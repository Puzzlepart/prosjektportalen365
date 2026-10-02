import strings from 'PortfolioWebPartsStrings'
import { useAddColumn } from './useAddColumn'

/**
 * The add column: hidden unless the list asks for it, recognised by its key, and its menu items
 * disabled for users who may not manage columns.
 */
describe('useAddColumn', () => {
  it('is hidden when the list does not enable it', () => {
    expect(useAddColumn(false).addColumn.data.isHidden).toBe(true)
    expect(useAddColumn(true).addColumn.data.isHidden).toBe(false)
    expect(useAddColumn().addColumn.name).toBe(strings.ToggleColumnFormPanelLabel)
  })

  it('recognises its own column by key', () => {
    const { addColumn, isAddColumn } = useAddColumn(true, true, 'MY_KEY')
    expect(addColumn.key).toBe('MY_KEY')
    expect(isAddColumn({ key: 'MY_KEY' } as any)).toBe(true)
    expect(isAddColumn({ key: 'Title' } as any)).toBe(false)
  })

  it('offers the column form and the show/hide panel, disabled without permission', () => {
    const onToggleColumnFormPanel = jest.fn()
    const onToggleEditViewColumnsPanel = jest.fn()
    const items = useAddColumn(true, true).createContextualMenuItems(
      onToggleColumnFormPanel,
      onToggleEditViewColumnsPanel
    )
    expect(items.map((i) => i.text)).toEqual([
      strings.ToggleColumnFormPanelLabel,
      strings.ShowHideColumnsLabel
    ])
    expect(items.map((i) => i.disabled)).toEqual([false, false])
    items[0].onClick(null, items[0])
    items[1].onClick(null, items[1])
    expect(onToggleColumnFormPanel).toHaveBeenCalledTimes(1)
    expect(onToggleEditViewColumnsPanel).toHaveBeenCalledTimes(1)

    const withoutPermission = useAddColumn(true, false).createContextualMenuItems(
      jest.fn(),
      jest.fn()
    )
    expect(withoutPermission.map((i) => i.disabled)).toEqual([true, true])
    const programView = useAddColumn(true, true).createContextualMenuItems(
      jest.fn(),
      jest.fn(),
      true,
      true
    )
    expect(programView.map((i) => i.disabled)).toEqual([true, true])
  })
})
