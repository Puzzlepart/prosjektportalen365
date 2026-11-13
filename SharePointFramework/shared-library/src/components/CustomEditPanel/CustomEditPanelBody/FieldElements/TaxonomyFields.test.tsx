// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The taxonomy picker comes from `@pnp/spfx-controls-react`, which
// maps to the one PnP stub like every `@pnp/*` import; the stub is kept, and only the picker
// replaced. The stand-in keeps PnP's contract: `termPickerProps.inputProps` go to the input, in
// place of PnP's own name and placeholder. And its term input keeps the contract of Fluent v8's
// BasePicker (tried for real in termPickerProps.test.tsx): a suggestion shows once something is
// typed; the input hands a key to `inputProps.onKeyDown` before the picker's own handler, which
// chooses the suggestion with Tab or Enter; a click chooses it; and leaving the field dismisses the
// suggestions, which adds the first one unless `termPickerProps.onDismiss` answers false. As PnP's,
// the input is a combobox whose `aria-describedby` the picker sets after `inputProps` (to nothing
// with no term picked), and beside it is PnP's «Tag» button, an icon with no name.
jest.mock('@pnp/spfx-controls-react/lib/ModernTaxonomyPicker', () => {
  const stub = jest.requireActual('@pnp/spfx-controls-react/lib/ModernTaxonomyPicker')
  const React = jest.requireActual('react')
  const ADMINISTRASJON = {
    id: 'term-1',
    labels: [{ name: 'Administrasjon', isDefault: true, languageTag: 'nb-NO' }]
  }
  const PNP_PLACEHOLDER = 'Skriv inn termen som skal merkes'
  const ModernTaxonomyPicker = ({ initialValues, termPickerProps, onChange }: any) => {
    const [text, setText] = React.useState('')
    const suggestion = text ? ADMINISTRASJON : undefined
    const add = () => onChange([...(initialValues ?? []), suggestion])
    const inputProps = termPickerProps?.inputProps ?? {
      'aria-label': PNP_PLACEHOLDER,
      placeholder: PNP_PLACEHOLDER
    }
    return React.createElement(
      'div',
      {
        onKeyDown: (event: any) => {
          if ((event.key === 'Tab' || event.key === 'Enter') && !event.shiftKey && suggestion) add()
        }
      },
      React.createElement('input', {
        ...inputProps,
        role: 'combobox',
        'aria-describedby': undefined,
        value: text,
        onChange: (event: any) => setText(event.target.value),
        onKeyDown: (event: any) => inputProps.onKeyDown?.(event),
        onBlur: (event: any) => {
          if (suggestion && termPickerProps?.onDismiss?.(event, suggestion) !== false) add()
        }
      }),
      suggestion && React.createElement('button', { onClick: add }, 'Administrasjon'),
      React.createElement(
        'button',
        { type: 'button' },
        React.createElement('i', { 'data-icon-name': 'Tag', 'aria-hidden': true })
      )
    )
  }
  return new Proxy(stub, {
    get: (target, prop) => (prop === 'ModernTaxonomyPicker' ? ModernTaxonomyPicker : target[prop])
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { EditableSPField } from '../../../../models'
import { format } from '../../../../util/format'
import { CustomEditPanelContext, ICustomEditPanelContext } from '../../context'
import { TaxonomyFieldType } from './TaxonomyFieldType'
import { TaxonomyFieldTypeMulti } from './TaxonomyFieldTypeMulti'

/**
 * The taxonomy fields of `CustomEditPanel` («Tjenesteområde» in «Rediger prosjektinformasjon»):
 * a term is saved only when it is chosen, by a click or with Enter. Typing «a» and leaving the
 * field, or pressing Tab, saved «Administrasjon», the first suggestion, in 1.14 and before.
 */
const FIELD = {
  internalName: 'GtProjectServiceArea',
  displayName: 'Tjenesteområde',
  description: 'Hvilke tjenesteområder prosjektet gjelder',
  required: false,
  getProperty: () => 'termset-1'
} as unknown as EditableSPField

/** Renders a taxonomy field inside a context whose model holds no terms and records every `set`. */
function renderField(Component: typeof TaxonomyFieldType | typeof TaxonomyFieldTypeMulti) {
  const set = jest.fn()
  const context = {
    model: { get: () => [], set },
    props: {
      dataAdapter: {
        spfxContext: { pageContext: { cultureInfo: { currentUICultureName: 'nb-NO' } } }
      }
    }
  } as unknown as ICustomEditPanelContext
  render(
    <CustomEditPanelContext.Provider value={context}>
      <Component field={FIELD} />
    </CustomEditPanelContext.Provider>
  )
  const input = screen.getByRole('combobox')
  fireEvent.change(input, { target: { value: 'a' } })
  return { set, input }
}

describe.each([
  ['TaxonomyFieldType', TaxonomyFieldType],
  ['TaxonomyFieldTypeMulti', TaxonomyFieldTypeMulti]
])('%s', (_name, Component) => {
  it('adds no term when the field is left without choosing one', () => {
    const { set, input } = renderField(Component)
    fireEvent.blur(input)
    expect(set).not.toHaveBeenCalled()
  })

  it('saves the term chosen', () => {
    const { set } = renderField(Component)
    fireEvent.click(screen.getByText('Administrasjon'))
    expect(set).toHaveBeenCalledWith(FIELD, [expect.objectContaining({ id: 'term-1' })])
  })

  it('names its input after the field, and keeps a placeholder', () => {
    // The input was named by PnP's placeholder, not by the field.
    const { input } = renderField(Component)
    expect(input).toHaveAccessibleName(FIELD.displayName)
    expect(input).toHaveAttribute('placeholder', strings.Placeholder.TaxonomyPicker)
  })

  it("gives its input the field's id, so a click on the label reaches it (WCAG 1.3.1)", () => {
    // PnP's input took an id of its own (`combobox-id__12`), and the label's `for` pointed at
    // nothing.
    const { input } = renderField(Component)
    expect(input.id).not.toBe('')
    expect(screen.getByText(FIELD.displayName).closest('label')).toHaveAttribute('for', input.id)
  })

  it("names PnP's «Tag» button after the field, and has the field's hint describe the input (Puzzlepart/prosjektportalen365-testing#126)", () => {
    // The button had no name (axe button-name, critical), and the input was described only by the
    // list of the terms picked, not by the hint.
    const { input } = renderField(Component)
    expect(
      screen.getByRole('button', {
        name: format(strings.Aria.TaxonomyPickerButtonLabel, FIELD.displayName)
      })
    ).toBeInTheDocument()
    expect(input).toHaveAccessibleDescription(FIELD.description)
  })

  it('moves on with Tab without adding the suggestion', () => {
    // Tab added the first suggestion, as Enter does.
    const { set, input } = renderField(Component)
    fireEvent.keyDown(input, { key: 'Tab', keyCode: 9, which: 9 })
    expect(set).not.toHaveBeenCalled()
  })

  it('adds the suggestion with Enter', () => {
    const { set, input } = renderField(Component)
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 13, which: 13 })
    expect(set).toHaveBeenCalledWith(FIELD, [expect.objectContaining({ id: 'term-1' })])
  })
})
