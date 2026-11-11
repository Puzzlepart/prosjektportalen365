// PnP's ModernTaxonomyPicker cannot run under Jest (every `@pnp/*` import is a stub), but its term
// input is Fluent v8's BasePicker, which TagPicker is too: the props are tried on the real picker.
// v8 is imported from the package's root, its CommonJS build.
import { ITag, TagPicker } from '@fluentui/react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { getTermPickerProps } from './termPickerProps'

const ADMINISTRASJON: ITag = { key: 'term-1', name: 'Administrasjon' }

/**
 * A v8 picker with a taxonomy field's term picker props, suggesting «Administrasjon» for anything
 * typed; types «a» and waits for the suggestion.
 */
async function typeInPicker() {
  const onChange = jest.fn()
  render(
    <TagPicker
      onResolveSuggestions={(filter) => (filter ? [ADMINISTRASJON] : [])}
      getTextFromItem={(tag) => tag.name}
      onChange={onChange}
      {...(getTermPickerProps('Tjenesteområde') as any)}
    />
  )
  const input = screen.getByRole('combobox', { name: 'Tjenesteområde' })
  await userEvent.setup({ pointerEventsCheck: 0 }).type(input, 'a')
  await screen.findByText('Administrasjon')
  return { onChange, input }
}

/**
 * The term picker props on Fluent v8's BasePicker: the input is named after the field and keeps
 * its placeholder, Tab moves on without choosing, and Enter still chooses.
 */
describe('getTermPickerProps', () => {
  it('names the input after the field, and keeps a placeholder', async () => {
    const { input } = await typeInPicker()
    expect(input).toHaveAttribute('placeholder', strings.Placeholder.TaxonomyPicker)
  })

  it('leaves the highlighted suggestion with Tab, and chooses it with Enter', async () => {
    // Tab added the first suggestion, as Enter does.
    const { onChange, input } = await typeInPicker()
    fireEvent.keyDown(input, { key: 'Tab', keyCode: 9, which: 9 })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 13, which: 13 })
    expect(onChange).toHaveBeenCalledWith([ADMINISTRASJON])
  })
})
