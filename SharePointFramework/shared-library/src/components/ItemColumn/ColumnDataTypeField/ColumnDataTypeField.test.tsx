import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { useColumnRenderComponentRegistry } from '../registry'
import { ColumnDataTypeField } from './index'
import { IColumnDataTypeFieldProps } from './types'

/**
 * The data type field of the column form: a dropdown of the registered column renderers, and the
 * chosen renderer's properties under it. Asserted through the combobox and option roles and the
 * renderers' display names, so it holds whichever Fluent UI version renders the dropdown.
 *
 * The registry is filled the way the column forms fill it, through the hook, so the options are the
 * real ones.
 */

const Harness: React.FC<Partial<IColumnDataTypeFieldProps>> = (props) => {
  useColumnRenderComponentRegistry()
  return (
    <ColumnDataTypeField
      label='Datatype'
      description='Hvordan kolonnen vises'
      onChange={jest.fn()}
      {...props}
    />
  )
}

/**
 * Fluent's popup surfaces compute to `pointer-events: none` under jsdom, which has no layout, so
 * the check is off; the clicks are still real clicks.
 */
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('ColumnDataTypeField', () => {
  it('shows the field label and description', () => {
    render(<Harness />)
    expect(screen.getByText('Datatype')).toBeInTheDocument()
    expect(screen.getByText('Hvordan kolonnen vises')).toBeInTheDocument()
  })

  it("names Fluent's clear button in the page's language, not «Clear selection» (Puzzlepart/prosjektportalen365-testing#123)", async () => {
    render(<Harness defaultSelectedKey='url' />)
    await screen.findByRole('combobox')
    // Fluent renders it in every single-select dropdown, hidden while the dropdown is not
    // clearable, as here.
    const clearButton = document.querySelector('.fui-Dropdown__clearButton')
    expect(clearButton).toHaveAttribute('aria-label', strings.Aria.DropdownClearLabel)
    expect(clearButton).toHaveAttribute('aria-label', 'Fjern valget')
  })

  it('shows the data type selected by default', async () => {
    render(<Harness defaultSelectedKey='url' />)
    expect(await screen.findByRole('combobox')).toHaveTextContent(strings.ColumnRenderOptionUrl)
  })

  it('reports the selected data type by its stored id', async () => {
    const onChange = jest.fn()
    render(<Harness defaultSelectedKey='url' onChange={onChange} />)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('URL'))
  })

  // The column forms get the column they edit after their first render, so the field first renders
  // with no data type and then with the column's own. Kept from the first render, the dropdown was
  // empty and a save stored the column as text.
  it('starts over from a data type it gets after the first render', async () => {
    const onChange = jest.fn()
    const { rerender } = render(<Harness onChange={onChange} />)
    rerender(<Harness defaultSelectedKey='percentage' onChange={onChange} />)
    expect(await screen.findByRole('combobox')).toHaveTextContent(
      strings.ColumnRenderOptionPercentage
    )
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('Percentage'))
  })

  it('reads the properties again with a data type it gets after the first render', async () => {
    const user = setupUser()
    const onDataTypePropertiesChange = jest.fn()
    const { rerender } = render(<Harness onDataTypePropertiesChange={onDataTypePropertiesChange} />)
    rerender(
      <Harness
        defaultSelectedKey='url'
        dataTypeProperties={{ openInNewTab: true }}
        onDataTypePropertiesChange={onDataTypePropertiesChange}
      />
    )
    await user.click(
      await screen.findByRole('button', { name: strings.ShowDataTypePropertiesLabel })
    )
    expect(
      screen.getByRole('switch', { name: strings.ColumnRenderOptionUrlOpenInNewTabLabel })
    ).toBeChecked()
    await waitFor(() =>
      expect(onDataTypePropertiesChange).toHaveBeenLastCalledWith({ openInNewTab: true })
    )
  })

  // Opening the list and picking another type is checked by hand: the v9 dropdown looped under Jest
  // on React 17 and takes tens of seconds to open on React 18, while it works in the browser (see
  // useDataTypeDropdown).

  it('shows the properties of the selected data type', async () => {
    const user = setupUser()
    render(<Harness defaultSelectedKey='url' />)
    await user.click(
      await screen.findByRole('button', { name: strings.ShowDataTypePropertiesLabel })
    )
    expect(
      screen.getByRole('switch', { name: strings.ColumnRenderOptionUrlOpenInNewTabLabel })
    ).toBeInTheDocument()
  })

  it('reports edited properties', async () => {
    const user = setupUser()
    const onDataTypePropertiesChange = jest.fn()
    render(
      <Harness defaultSelectedKey='url' onDataTypePropertiesChange={onDataTypePropertiesChange} />
    )
    await user.click(
      await screen.findByRole('button', { name: strings.ShowDataTypePropertiesLabel })
    )
    await user.click(
      screen.getByRole('switch', { name: strings.ColumnRenderOptionUrlOpenInNewTabLabel })
    )
    await waitFor(() =>
      expect(onDataTypePropertiesChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ openInNewTab: true })
      )
    )
  })
})
