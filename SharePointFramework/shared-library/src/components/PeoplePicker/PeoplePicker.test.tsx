import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { PeoplePicker } from '.'

/**
 * The picker's own contract; the person fields of the edit panel test the search and the picking
 * through it (`CustomEditPanel/.../UserFields.test.tsx`).
 */
const KARI = { text: 'Kari Nordmann', secondaryText: 'kari@contoso.no' } as any

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('PeoplePicker', () => {
  it('asks for a person with the shared placeholder unless it is given one', () => {
    const { rerender } = render(
      <PeoplePicker onChange={jest.fn()} onResolveSuggestions={jest.fn()} />
    )
    expect(screen.getByPlaceholderText(strings.Placeholder.PeoplePicker)).toBeInTheDocument()
    rerender(
      <PeoplePicker
        placeholder='Velg prosjektleder'
        aria-label='Prosjektleder'
        onChange={jest.fn()}
        onResolveSuggestions={jest.fn()}
      />
    )
    expect(screen.getByLabelText('Prosjektleder')).toHaveAttribute(
      'placeholder',
      'Velg prosjektleder'
    )
  })

  it('shows the people already picked, and reports removing one', () => {
    const onChange = jest.fn()
    render(
      <PeoplePicker
        selected={[KARI]}
        multi
        onChange={onChange}
        onResolveSuggestions={jest.fn(() => Promise.resolve([]))}
      />
    )
    // The persona shows the name, and repeats it as hidden text for screen readers.
    expect(screen.getAllByText('Kari Nordmann')[0]).toBeVisible()
    // Backspace in the empty input removes the last person, as the picker's remove button does.
    fireEvent.keyDown(screen.getByPlaceholderText(strings.Placeholder.PeoplePicker), {
      key: 'Backspace',
      keyCode: 8,
      which: 8
    })
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('can be disabled', () => {
    render(
      <PeoplePicker
        disabled
        aria-label='Eier'
        onChange={jest.fn()}
        onResolveSuggestions={jest.fn()}
      />
    )
    expect(screen.getByLabelText('Eier')).toBeDisabled()
  })
})
