// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Fluent's TagPicker looped the Jest worker on React 17 when typed
// into and takes tens of seconds to open under jsdom on React 18 (it works in the browser); the
// harness's stand-in keeps its contract.
jest.mock('@fluentui/react-components', () =>
  jest.requireActual('pp365-jest-config/lib/tagPickerStandIn').withTagPickerStandIn()
)

import { act, fireEvent, render, screen } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { PeoplePicker } from '.'
import { PEOPLE_SEARCH_DELAY } from './usePeoplePicker'

/**
 * The picker's own contract: the people picked as tags, removed by a click or Backspace; the search
 * after a pause in the typing, told who is picked; the pick reported, one person in a field for
 * one; no further input in a field for one that holds one; and a word when no one is found. The
 * person fields of the edit panel test the same through their own wiring
 * (`CustomEditPanel/.../UserFields.test.tsx`).
 */
const KARI = {
  id: 'i:0#.f|membership|kari@contoso.no',
  text: 'Kari Nordmann',
  secondaryText: 'kari@contoso.no'
}
const OLA = {
  id: 'i:0#.f|membership|ola@contoso.no',
  text: 'Ola Nordmann',
  secondaryText: 'ola@contoso.no'
}

const input = () => screen.getByRole('combobox')

/** Types into the input and lets the search run. */
async function search(text: string) {
  fireEvent.change(input(), { target: { value: text } })
  await act(async () => {
    jest.advanceTimersByTime(PEOPLE_SEARCH_DELAY)
    // The search answers in a promise; let it settle.
    await Promise.resolve()
  })
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

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

  it('shows the people picked, and reports removing one by its tag or by Backspace', () => {
    const onChange = jest.fn()
    render(
      <PeoplePicker
        selected={[KARI, OLA]}
        multi
        onChange={onChange}
        onResolveSuggestions={jest.fn()}
      />
    )
    expect(
      screen.getByRole('group', { name: strings.PeoplePickerSelectedLabel })
    ).toHaveTextContent('Kari NordmannOla Nordmann')
    fireEvent.click(screen.getByRole('button', { name: 'Kari Nordmann' }))
    expect(onChange).toHaveBeenLastCalledWith([OLA])
    fireEvent.keyDown(input(), { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith([KARI])
  })

  it('searches a moment after the typing pauses, telling the search who is picked', async () => {
    const onResolveSuggestions = jest.fn(() => Promise.resolve([OLA]))
    render(
      <PeoplePicker
        selected={[KARI]}
        multi
        onChange={jest.fn()}
        onResolveSuggestions={onResolveSuggestions}
      />
    )
    fireEvent.change(input(), { target: { value: 'Nord' } })
    expect(onResolveSuggestions).not.toHaveBeenCalled()
    await search('Nordmann')
    expect(onResolveSuggestions).toHaveBeenCalledTimes(1)
    expect(onResolveSuggestions).toHaveBeenCalledWith('Nordmann', [KARI])
    expect(screen.getByRole('option', { name: /Ola Nordmann/ })).toHaveTextContent('ola@contoso.no')
  })

  it('reports the person picked, with those picked before in a field for several', async () => {
    const onChange = jest.fn()
    render(
      <PeoplePicker
        selected={[KARI]}
        multi
        onChange={onChange}
        onResolveSuggestions={() => Promise.resolve([OLA])}
      />
    )
    await search('Ola')
    fireEvent.click(screen.getByRole('option', { name: /Ola Nordmann/ }))
    expect(onChange).toHaveBeenLastCalledWith([KARI, OLA])
    expect(input()).toHaveValue('')
  })

  it('takes no more input in a field for one person while it holds one', () => {
    const { rerender } = render(
      <PeoplePicker onChange={jest.fn()} onResolveSuggestions={jest.fn()} />
    )
    expect(input()).toBeInTheDocument()
    rerender(
      <PeoplePicker selected={[KARI]} onChange={jest.fn()} onResolveSuggestions={jest.fn()} />
    )
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('says so when no one is found, and picking that does nothing', async () => {
    const onChange = jest.fn()
    render(<PeoplePicker onChange={onChange} onResolveSuggestions={() => Promise.resolve([])} />)
    await search('Ingen')
    fireEvent.click(screen.getByRole('option', { name: strings.PeoplePickerNoResults }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('drops the answer to a search the user has typed past', async () => {
    let answerFirst: (people: any[]) => void = () => undefined
    const onResolveSuggestions = jest
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
      .mockImplementationOnce(() => Promise.resolve([OLA]))
    render(<PeoplePicker multi onChange={jest.fn()} onResolveSuggestions={onResolveSuggestions} />)
    await search('Kar')
    await search('Ola')
    await act(async () => {
      answerFirst([KARI])
      await Promise.resolve()
    })
    expect(screen.queryByRole('option', { name: /Kari Nordmann/ })).toBeNull()
    expect(screen.getByRole('option', { name: /Ola Nordmann/ })).toBeInTheDocument()
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
