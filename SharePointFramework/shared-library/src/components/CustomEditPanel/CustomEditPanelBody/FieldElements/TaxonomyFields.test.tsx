// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The taxonomy picker comes from `@pnp/spfx-controls-react`, which
// maps to the one PnP stub like every `@pnp/*` import; the stub is kept, and only the picker
// replaced. Its term input is Fluent v8's BasePicker, and the stand-in keeps that contract: a
// suggestion shows once something is typed, choosing it adds it, and leaving the field dismisses
// the suggestions, which adds the first one unless `termPickerProps.onDismiss` answers false.
jest.mock('@pnp/spfx-controls-react/lib/ModernTaxonomyPicker', () => {
  const stub = jest.requireActual('@pnp/spfx-controls-react/lib/ModernTaxonomyPicker')
  const React = jest.requireActual('react')
  const ADMINISTRASJON = {
    id: 'term-1',
    labels: [{ name: 'Administrasjon', isDefault: true, languageTag: 'nb-NO' }]
  }
  const ModernTaxonomyPicker = ({ panelTitle, initialValues, termPickerProps, onChange }: any) => {
    const [text, setText] = React.useState('')
    const suggestion = text ? ADMINISTRASJON : undefined
    const add = () => onChange([...(initialValues ?? []), suggestion])
    return React.createElement(
      'div',
      null,
      React.createElement('input', {
        'aria-label': panelTitle,
        value: text,
        onChange: (event: any) => setText(event.target.value),
        onBlur: (event: any) => {
          if (suggestion && termPickerProps?.onDismiss?.(event, suggestion) !== false) add()
        }
      }),
      suggestion && React.createElement('button', { onClick: add }, 'Administrasjon')
    )
  }
  return new Proxy(stub, {
    get: (target, prop) => (prop === 'ModernTaxonomyPicker' ? ModernTaxonomyPicker : target[prop])
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { EditableSPField } from '../../../../models'
import { CustomEditPanelContext, ICustomEditPanelContext } from '../../context'
import { TaxonomyFieldType } from './TaxonomyFieldType'
import { TaxonomyFieldTypeMulti } from './TaxonomyFieldTypeMulti'

/**
 * The taxonomy fields of `CustomEditPanel` («Tjenesteområde» in «Rediger prosjektinformasjon»):
 * a term is saved only when it is chosen. Typing «a» and leaving the field saved «Administrasjon»,
 * the first suggestion, in 1.14 and before.
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
  const input = screen.getByRole('textbox', { name: FIELD.description })
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
})
