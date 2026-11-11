import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { CurrencyColumn } from '../../CurrencyColumn'
import { DialogColumn } from '../../DialogColumn'
import { TrendColumn } from '../../TrendColumn'
import { UrlColumn } from '../../UrlColumn'
import { ColumnRenderComponent } from '../../types'
import { DataTypeFields } from './index'

/**
 * The contract between a column renderer's `getDataTypeProperties` and the fields the column form
 * shows for it: each property becomes a labelled control, and using the control reports the
 * property's key and new value. Asserted through labels and the switch/checkbox/textbox roles, so it
 * holds whichever Fluent UI version renders the controls.
 *
 * The renderers are exercised through their real `getDataTypeProperties`, so a renderer that stops
 * declaring a property, or reports it under the wrong key, fails here.
 */

function renderFields(
  column: ColumnRenderComponent<any>,
  dataTypeProperties: Record<string, any> = {}
) {
  const onChange = jest.fn()
  const toggleIsFieldsVisible = jest.fn()
  const fields = column.getDataTypeProperties?.(onChange, dataTypeProperties) ?? []
  const result = render(
    <DataTypeFields
      fields={fields}
      dataTypeProperties={dataTypeProperties}
      isFieldsVisible={true}
      toggleIsFieldsVisible={toggleIsFieldsVisible}
    />
  )
  return { ...result, onChange, toggleIsFieldsVisible }
}

/**
 * Fluent's controls compute to `pointer-events: none` under jsdom, which has no layout, so the
 * check is off; the clicks are still real clicks.
 */
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('DataTypeFields', () => {
  it('renders nothing for a renderer without properties', () => {
    const { container } = render(
      <DataTypeFields
        fields={[]}
        dataTypeProperties={{}}
        isFieldsVisible={true}
        toggleIsFieldsVisible={jest.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('offers to show or hide the properties', async () => {
    const user = setupUser()
    const { toggleIsFieldsVisible } = renderFields(UrlColumn)
    await user.click(screen.getByRole('button', { name: strings.HideDataTypePropertiesLabel }))
    expect(toggleIsFieldsVisible).toHaveBeenCalled()
  })

  describe('a boolean property', () => {
    it('is a switch that reports its key and new state', async () => {
      const user = setupUser()
      const { onChange } = renderFields(UrlColumn)
      const control = screen.getByRole('switch', {
        name: strings.ColumnRenderOptionUrlOpenInNewTabLabel
      })
      await user.click(control)
      await waitFor(() => expect(onChange).toHaveBeenCalledWith('openInNewTab', true))
    })

    it('shows the stored value', () => {
      renderFields(UrlColumn, { openInNewTab: true })
      expect(
        screen.getByRole('switch', { name: strings.ColumnRenderOptionUrlOpenInNewTabLabel })
      ).toBeChecked()
    })

    it('may also be a checkbox', async () => {
      const user = setupUser()
      const { onChange } = renderFields(TrendColumn, { showTrendIcon: false })
      const control = screen.getByRole('checkbox', {
        name: strings.ColumnRenderOptionTrendShowTrendIconLabel
      })
      expect(control).not.toBeChecked()
      await user.click(control)
      await waitFor(() => expect(onChange).toHaveBeenCalledWith('showTrendIcon', true))
    })
  })

  describe('a text property', () => {
    it('is a textbox that reports its key and text', async () => {
      const user = setupUser()
      const { onChange } = renderFields(UrlColumn)
      const control = screen.getByRole('textbox', {
        name: strings.ColumnRenderOptionUrlDescriptionLabel
      })
      await user.type(control, 'Les mer')
      await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('description', 'Les mer'))
    })

    it('shows the stored value', () => {
      renderFields(UrlColumn, { description: 'Åpne' })
      expect(
        screen.getByRole('textbox', { name: strings.ColumnRenderOptionUrlDescriptionLabel })
      ).toHaveValue('Åpne')
    })

    it('shows the renderer default as placeholder', () => {
      renderFields(CurrencyColumn)
      expect(
        screen.getByRole('textbox', { name: strings.ColumnRenderOptionCurrencyPrefixLabel })
      ).toHaveAttribute('placeholder', 'kr')
    })
  })

  describe('a number property', () => {
    it('reports a number, not text', async () => {
      const user = setupUser()
      const { onChange } = renderFields(CurrencyColumn)
      const control = screen.getByRole('spinbutton', {
        name: strings.ColumnRenderOptionCurrencyMinimumFractionDigitsLabel
      })
      await user.type(control, '2')
      await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('minimumFractionDigits', 2))
    })
  })

  describe('a property that depends on another', () => {
    it('is disabled until the other is set', () => {
      renderFields(DialogColumn, {})
      expect(
        screen.getByRole('textbox', {
          name: strings.ColumnRenderOptionDialogInfoTextTemplateLabel
        })
      ).toBeDisabled()
    })

    it('is enabled once the other is set', () => {
      renderFields(DialogColumn, { showInfoText: true })
      expect(
        screen.getByRole('textbox', {
          name: strings.ColumnRenderOptionDialogInfoTextTemplateLabel
        })
      ).toBeEnabled()
    })
  })
})
