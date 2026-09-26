import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Button } from './button';
import { Choice } from './choice';
import { PageHeader } from './page';
import { Help } from './help';
import { BottomSheet } from './bottom-sheet';
import { Text } from './text';

jest.mock('expo-router', () => ({ router: { canGoBack: () => false, replace: jest.fn() } }));
jest.mock('./screen', () => ({ Screen: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('./bottom-sheet', () => ({ BottomSheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => visible ? children : null }));

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
});
