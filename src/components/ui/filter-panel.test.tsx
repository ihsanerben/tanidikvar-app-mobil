import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { FilterPanel, FilterSelect } from './filter-panel';
import { BottomSheet } from './bottom-sheet';
import { FormField } from './form-field';
import { TextInput } from 'react-native';
import { Text } from './text';

jest.mock('./bottom-sheet', () => ({ BottomSheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => visible ? children : null }));
jest.mock('@shopify/flash-list', () => ({ FlashList: ({ data, renderItem }: { data: { value: string; label: string }[]; renderItem: (args: { item: { value: string; label: string } }) => React.ReactNode }) => { const React = jest.requireActual<typeof import('react')>('react'); return data.map(item => React.createElement(React.Fragment, { key: item.value }, renderItem({ item }))); } }));

describe('compact filters', () => {
  let tree: ReactTestRenderer;
  afterEach(async () => { if (tree) await act(async () => tree.unmount()); });
  it('selects a value in the same modal and returns to the filter form', async () => {
    const change = jest.fn();
    const close = jest.fn();
    await act(async () => { tree = create(<FilterPanel visible title="Soruları filtrele" close={close}><FilterSelect label="Kapsam" value="" options={[{ value: '', label: 'Tümü' }, { value: 'GENERAL', label: 'Genel' }]} onChange={change} /></FilterPanel>); });
    await act(async () => tree.root.findAllByProps({ accessibilityLabel: 'Kapsam: Tümü', accessibilityRole: 'button' })[0].props.onPress());
    expect(tree.root.findAllByType(BottomSheet)).toHaveLength(1);
    expect(tree.root.findByType(BottomSheet).props.title).toBe('Kapsam');
    await act(async () => tree.root.findAllByProps({ accessibilityLabel: 'Genel', accessibilityRole: 'radio' })[0].props.onPress());
    expect(change).toHaveBeenCalledWith('GENERAL');
    expect(tree.root.findByType(BottomSheet).props.title).toBe('Soruları filtrele');
    expect(close).not.toHaveBeenCalled();
  });
  it('backs out of an option list without changing the filter or closing its form', async () => {
    const change = jest.fn();
    const close = jest.fn();
    await act(async () => { tree = create(<FilterPanel visible title="Filtreler" close={close}><FilterSelect label="Şehir" value="" options={[{ value: '', label: 'Tümü' }]} onChange={change} /></FilterPanel>); });
    await act(async () => tree.root.findAllByProps({ accessibilityLabel: 'Şehir: Tümü', accessibilityRole: 'button' })[0].props.onPress());
    await act(async () => tree.root.findByType(BottomSheet).props.close());
    expect(change).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(tree.root.findByType(BottomSheet).props.title).toBe('Filtreler');
    await act(async () => tree.root.findByType(BottomSheet).props.close());
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('hides the repeated search caption but retains the input accessible name', async () => {
    await act(async () => { tree = create(<FormField hideLabel label="Soru ara" placeholder="Soru ara" />); });
    expect(tree.root.findAllByType(Text)).toHaveLength(0);
    expect(tree.root.findByType(TextInput).props.accessibilityLabel).toBe('Soru ara');
  });
});
