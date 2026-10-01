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

  it('shows the data type selected by default', async () => {
    render(<Harness defaultSelectedKey='url' />)
    expect(await screen.findByRole('combobox')).toHaveTextContent(strings.ColumnRenderOptionUrl)
  })

  it('reports the selected data type by its stored id', async () => {
    const onChange = jest.fn()
    render(<Harness defaultSelectedKey='url' onChange={onChange} />)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('URL'))
  })

  // Opening the list and picking another type is checked by hand: the v9 dropdown loops under
  // Jest on React 17 the moment it opens, while it works in the browser (see useDataTypeDropdown).

  it('shows the properties of the selected data type', async () => {
    const user = setupUser()
    render(<Harness defaultSelectedKey='url' />)
    // The properties start collapsed; the toggle button reveals them.
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
