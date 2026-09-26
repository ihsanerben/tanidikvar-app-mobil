import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Button } from './button';
import { Choice } from './choice';
import { PageHeader } from './page';
import { Help } from './help';
import { BottomSheet, DialogContentContext } from './bottom-sheet';
import { Text } from './text';
import { Tabs } from './tabs';
import { Select } from './select';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { canGoBack: () => false, replace: jest.fn(), push: jest.fn() } }));
jest.mock('./screen', () => ({ Screen: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('./bottom-sheet', () => ({
  DialogContentContext: jest.requireActual<typeof import('react')>('react').createContext(false),
  BottomSheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => visible ? children : null,
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem }: { data: { value: string; label: string }[]; renderItem: (args: { item: { value: string; label: string }; index: number }) => React.ReactNode }) =>
    data.map((item, index) => {
      const React = jest.requireActual<typeof import('react')>('react');
      return React.createElement(React.Fragment, { key: item.value }, renderItem({ item, index }));
    }),
}));

describe('shared design control behavior', () => {
  let tree: ReactTestRenderer;
  afterEach(async () => { if (tree) await act(async () => tree.unmount()); });
  it('keeps the action label and marks pending controls unavailable', async () => {
    const press = jest.fn();
    await act(async () => { tree = create(<Button label="Kaydet" onPress={press} pending fullWidth size="large" />); });
    const control = tree.root.findAllByProps({ accessibilityRole: 'button', accessibilityLabel: 'Kaydet' })[0];
    expect(control.props.accessibilityLabel).toBe('Kaydet');
    expect(control.props.disabled).toBe(true);
    expect(control.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(press).not.toHaveBeenCalled();
  });
  it('selects the requested option and exposes a single checked choice', async () => {
    const change = jest.fn();
    await act(async () => { tree = create(<Choice label="Dönem" value="week" options={[{ value: 'week', label: 'Bu hafta' }, { value: 'month', label: 'Bu ay' }]} onChange={change} />); });
    const options = ['Bu hafta', 'Bu ay'].map(accessibilityLabel => tree.root.findAllByProps({ accessibilityRole: 'radio', accessibilityLabel })[0]);
    expect(options.map(option => option.props.accessibilityState.checked)).toEqual([true, false]);
    await act(async () => options[1].props.onPress());
    expect(change).toHaveBeenCalledWith('month');
  });
  it('places help beside the heading and closes the shared explanation dialog', async () => {
    await act(async () => { tree = create(<PageHeader title="Sorular" back={false} help="Soruları filtreleyebilirsin." />); });
    const help = tree.root.findByType(Help);
    expect(help.parent?.findAllByType(Text).some(node => node.props.children === 'Sorular')).toBe(true);
    expect(tree.root.findByType(BottomSheet).props.visible).toBe(false);
    await act(async () => tree.root.findAllByProps({ accessibilityRole: 'button', accessibilityLabel: 'Sorular hakkında bilgi' })[0].props.onPress());
    expect(tree.root.findByType(BottomSheet).props.visible).toBe(true);
    await act(async () => tree.root.findByType(Button).props.onPress());
    expect(tree.root.findByType(BottomSheet).props.visible).toBe(false);
  });
  it('changes account tabs and announces exactly one selected tab', async () => {
    const change = jest.fn();
    await act(async () => { tree = create(<Tabs label="Soru durumu" value="active" options={[{ value: 'active', label: 'Aktif' }, { value: 'archived', label: 'Arşiv' }]} onChange={change} />); });
    const tabs = ['Aktif', 'Arşiv'].map(accessibilityLabel => tree.root.findAllByProps({ accessibilityRole: 'tab', accessibilityLabel })[0]);
    expect(tabs.map(tab => tab.props.accessibilityState.selected)).toEqual([true, false]);
    await act(async () => tabs[1].props.onPress());
    expect(change).toHaveBeenCalledWith('archived');
  });
  it('opens the select and closes it after choosing a value', async () => {
    const change = jest.fn();
    await act(async () => { tree = create(<Select label="Kapsam" value="all" options={[{ value: 'all', label: 'Tümü' }, { value: 'general', label: 'Genel' }]} onChange={change} />); });
    const trigger = () => tree.root.findAllByProps({ accessibilityLabel: 'Kapsam: Tümü', accessibilityRole: 'button' })[0];
    expect(trigger().props.accessibilityState.expanded).toBe(false);
    await act(async () => trigger().props.onPress());
    expect(tree.root.findByType(BottomSheet).props.visible).toBe(true);
    await act(async () => tree.root.findAllByProps({ accessibilityRole: 'radio', accessibilityLabel: 'Genel' })[0].props.onPress());
    expect(change).toHaveBeenCalledWith('general');
    expect(trigger().props.accessibilityState.expanded).toBe(false);
    expect(tree.root.findByType(BottomSheet).props.visible).toBe(false);
  });
  it('keeps a select inside the current dialog instead of opening a second modal', async () => {
    const change = jest.fn();
    await act(async () => { tree = create(<DialogContentContext.Provider value={true}><Select label="Sıklık" value="daily" options={[{ value: 'daily', label: 'Günlük' }, { value: 'weekly', label: 'Haftalık' }]} onChange={change} /></DialogContentContext.Provider>); });
    await act(async () => tree.root.findAllByProps({ accessibilityLabel: 'Sıklık: Günlük', accessibilityRole: 'button' })[0].props.onPress());
    expect(tree.root.findAllByType(BottomSheet)).toHaveLength(0);
    await act(async () => tree.root.findAllByProps({ accessibilityLabel: 'Haftalık', accessibilityRole: 'radio' })[0].props.onPress());
    expect(change).toHaveBeenCalledWith('weekly');
    expect(tree.root.findAllByProps({ accessibilityRole: 'radio' })).toHaveLength(0);
  });
  it('returns account subpages to the account even without a navigation history', async () => {
    await act(async () => { tree = create(<PageHeader title="Sorularım" backHref="/profil" backLabel="Hesabıma dön" />); });
    await act(async () => tree.root.findAllByProps({ accessibilityRole: 'link', accessibilityLabel: 'Hesabıma dön' })[0].props.onPress());
    expect(router.push).toHaveBeenCalledWith('/profil');
  });
});
