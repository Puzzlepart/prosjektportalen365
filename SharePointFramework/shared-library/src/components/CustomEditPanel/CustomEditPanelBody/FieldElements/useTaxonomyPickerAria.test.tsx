// PnP's ModernTaxonomyPicker cannot run under Jest (every `@pnp/*` import is a stub), but its term
// input is Fluent v8's BasePicker, which TagPicker is too: the hook is tried on the real picker.
// v8 is imported from the package's root, its CommonJS build.
import { ITag, TagPicker } from '@fluentui/react'
import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { applyTaxonomyPickerAria, useTaxonomyPickerAria } from './useTaxonomyPickerAria'

const ADMINISTRASJON: ITag = { key: 'term-1', name: 'Administrasjon' }
const BUTTON_LABEL = 'Velg termer for Prosjekttype'

/**
 * A v8 picker beside a button shaped as PnP's «Tag» button (an icon button, the icon an `<i>` with
 * `data-icon-name`), in the element the hook's ref is put on, with a hint outside it as the field
 * renders it.
 */
const Picker: React.FC<{ selected: ITag[]; describedBy?: string }> = ({
  selected,
  describedBy
}) => {
  const ref = useTaxonomyPickerAria(BUTTON_LABEL, describedBy)
  return (
    <>
      <div id='hint-1'>Hva slags type prosjekt er dette?</div>
      <div ref={ref}>
        <TagPicker
          onResolveSuggestions={() => []}
          getTextFromItem={(tag) => tag.name}
          selectedItems={selected}
          inputProps={{ 'aria-label': 'Prosjekttype' }}
        />
        <button type='button' aria-describedby='tooltip10'>
          <i data-icon-name='Tag' aria-hidden='true' />
        </button>
      </div>
    </>
  )
}

describe('useTaxonomyPickerAria', () => {
  it("names PnP's «Tag» button, which had no name (WCAG 4.1.2, axe button-name)", () => {
    render(<Picker selected={[]} describedBy='hint-1' />)
    expect(screen.getByRole('button', { name: BUTTON_LABEL })).toBeInTheDocument()
  })

  it("has the field's hint describe the input, keeping the list of the terms picked after it", async () => {
    const { rerender } = render(<Picker selected={[]} describedBy='hint-1' />)
    const input = screen.getByRole('combobox', { name: 'Prosjekttype' })
    // The picker sets the input's description itself, after its `inputProps`: to nothing here.
    expect(input).toHaveAttribute('aria-describedby', 'hint-1')
    expect(input).toHaveAccessibleDescription('Hva slags type prosjekt er dette?')

    // A term picked: the picker points the input at the list of the terms picked, and the hint
    // comes back in front of it.
    rerender(<Picker selected={[ADMINISTRASJON]} describedBy='hint-1' />)
    await act(() => Promise.resolve())
    const [hint, list] = (input.getAttribute('aria-describedby') ?? '').split(' ')
    expect(hint).toBe('hint-1')
    expect(document.getElementById(list)).toHaveTextContent('Administrasjon')

    // The term removed: the picker clears the description, and the hint is set again.
    rerender(<Picker selected={[]} describedBy='hint-1' />)
    await act(() => Promise.resolve())
    expect(input).toHaveAttribute('aria-describedby', 'hint-1')
  })

  it('leaves the input as the picker set it in a field without a hint', () => {
    render(<Picker selected={[]} />)
    expect(screen.getByRole('combobox', { name: 'Prosjekttype' })).not.toHaveAttribute(
      'aria-describedby'
    )
  })

  it('changes nothing that already holds the values, so an observer of its changes stops', () => {
    const container = document.createElement('div')
    container.innerHTML =
      '<input role="combobox" aria-describedby="hint-1 items-1" />' +
      `<button aria-label="${BUTTON_LABEL}"><i data-icon-name="Tag"></i></button>`
    const input = container.querySelector('input')!
    const setAttribute = jest.spyOn(input, 'setAttribute')
    applyTaxonomyPickerAria(container, BUTTON_LABEL, 'hint-1')
    expect(setAttribute).not.toHaveBeenCalled()
    expect(input).toHaveAttribute('aria-describedby', 'hint-1 items-1')
  })
})
