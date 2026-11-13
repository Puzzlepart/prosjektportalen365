import { Dropdown, Field, Option } from '@fluentui/react-components'
import { act, cleanup, render, screen } from '@testing-library/react'
import * as React from 'react'
import strings from 'SharedLibraryStrings'
import { getDropdownClearButtonProps } from './getDropdownClearButtonProps'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

/**
 * Fluent's `Dropdown` names its clear button «Clear selection», in English, and renders it in every
 * single-select dropdown, hidden unless `clearable` and something is selected («Visningsmodus» in
 * «Rediger kolonne»). Rendered closed: opening the list under jsdom is slow and adds nothing here.
 */
describe('getDropdownClearButtonProps', () => {
  it('names the clear button from the strings, not «Clear selection» (WCAG 3.1.2, 4.1.2)', () => {
    expect(strings.Aria.DropdownClearLabel).toBe('Fjern valget')
    render(
      <Field label='Visningsmodus'>
        <Dropdown
          clearable
          selectedOptions={['text']}
          value='Tekst'
          clearButton={getDropdownClearButtonProps()}
        >
          <Option value='text'>Tekst</Option>
        </Dropdown>
      </Field>
    )
    expect(screen.getByRole('button', { name: strings.Aria.DropdownClearLabel })).toHaveClass(
      'fui-Dropdown__clearButton'
    )
    expect(screen.getByRole('combobox')).toHaveAccessibleName(/Visningsmodus/)
  })

  it('leaves Fluent its English name without it, which is why every dropdown takes it', () => {
    render(
      <Field label='Visningsmodus'>
        <Dropdown clearable selectedOptions={['text']} value='Tekst'>
          <Option value='text'>Tekst</Option>
        </Dropdown>
      </Field>
    )
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeInTheDocument()
  })
})
