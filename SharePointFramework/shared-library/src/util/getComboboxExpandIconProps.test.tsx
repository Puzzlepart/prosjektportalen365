import { Combobox, Field, Option } from '@fluentui/react-components'
import { act, cleanup, render, screen } from '@testing-library/react'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { getComboboxExpandIconProps } from './getComboboxExpandIconProps'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

/**
 * Fluent's `Combobox` names the button that opens its list «Open», in English, and in a `Field`
 * tells it nothing of the field («Prosjektstatus» in «Rediger egenskaper»). Rendered closed: opening
 * the list under jsdom is slow and adds nothing here.
 */
describe('getComboboxExpandIconProps', () => {
  it('names the button that opens the list from the strings, not «Open» (WCAG 3.1.2, 4.1.2)', () => {
    render(
      <Field label='Prosjektstatus'>
        <Combobox expandIcon={getComboboxExpandIconProps()}>
          <Option>Aktiv</Option>
        </Combobox>
      </Field>
    )
    const expandButton = document.querySelector('.fui-Combobox__expandIcon')
    expect(expandButton).toHaveAttribute('role', 'button')
    expect(expandButton).toHaveAccessibleName(strings.Aria.ComboboxExpandLabel)
    // Fluent keeps its chevron when only the name is given.
    expect(expandButton.querySelector('svg')).not.toBeNull()
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Prosjektstatus')
  })

  it('leaves Fluent its English name without it, which is why every combobox takes it', () => {
    render(
      <Field label='Prosjektstatus'>
        <Combobox>
          <Option>Aktiv</Option>
        </Combobox>
      </Field>
    )
    expect(document.querySelector('.fui-Combobox__expandIcon')).toHaveAccessibleName('Open')
  })
})
