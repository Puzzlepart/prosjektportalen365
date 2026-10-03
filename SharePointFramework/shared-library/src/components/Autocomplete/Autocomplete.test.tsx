import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { Autocomplete } from '.'
import { DISMISS_CALLOUT, INIT, ON_KEY_DOWN, ON_SEARCH, RESET, SET_SELECTED_INDEX } from './actions'
import { createAutocompleteReducer } from './reducer'

/**
 * The contract the autocomplete keeps for its callers, written before its conversion from the v8
 * search box and callout (slice 7 of phase 4): typing offers the items that match, a click or
 * Enter on one picks it, and clearing starts over.
 */
const PROPERTIES = ['GtProjectPhaseOWSCHCS', 'GtProjectManagerOWSUSER', 'RefinableString01']

const searchBox = () => screen.getByRole('searchbox')
// The v8 search box reads the key from `which`, not from `key`.
const ESCAPE = { key: 'Escape', keyCode: 27, which: 27 }

function renderAutocomplete(props: Record<string, any> = {}) {
  const onSelected = jest.fn()
  const result = render(
    <Autocomplete
      placeholder='Søk etter egenskap'
      items={PROPERTIES}
      onSelected={onSelected}
      {...props}
    />
  )
  return { ...result, onSelected }
}

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('Autocomplete', () => {
  it('offers the items that match what is typed, and picks the one clicked', async () => {
    const { onSelected } = renderAutocomplete()
    fireEvent.change(searchBox(), { target: { value: 'gtproject' } })
    expect(await screen.findByText('GtProjectPhaseOWSCHCS')).toBeInTheDocument()
    expect(screen.getByText('GtProjectManagerOWSUSER')).toBeInTheDocument()
    expect(screen.queryByText('RefinableString01')).toBeNull()
    fireEvent.click(screen.getByText('GtProjectManagerOWSUSER'))
    expect(onSelected).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'GtProjectManagerOWSUSER' })
    )
  })

  it('picks the highlighted item on Enter, and nothing when none is', async () => {
    const { container, onSelected } = renderAutocomplete()
    fireEvent.change(searchBox(), { target: { value: 'Refinable' } })
    await screen.findByText('RefinableString01')
    fireEvent.keyDown(container.firstElementChild, { key: 'Enter' })
    expect(onSelected).not.toHaveBeenCalled()
    fireEvent.keyDown(container.firstElementChild, { key: 'ArrowDown' })
    fireEvent.keyDown(container.firstElementChild, { key: 'Enter' })
    expect(onSelected).toHaveBeenCalledWith(expect.objectContaining({ key: 'RefinableString01' }))
  })

  it('starts with the item of its default key', () => {
    renderAutocomplete({ defaultSelectedKey: 'RefinableString01' })
    expect(searchBox()).toHaveValue('RefinableString01')
  })

  it('starts over when it is cleared, whether or not the caller listens', () => {
    const onClear = jest.fn()
    const { rerender } = renderAutocomplete({ onClear })
    fireEvent.change(searchBox(), { target: { value: 'Gt' } })
    fireEvent.keyDown(searchBox(), ESCAPE)
    expect(onClear).toHaveBeenCalled()
    rerender(<Autocomplete items={PROPERTIES} onSelected={jest.fn()} />)
    fireEvent.change(searchBox(), { target: { value: 'Gt' } })
    expect(() => fireEvent.keyDown(searchBox(), ESCAPE)).not.toThrow()
  })
})

describe('Autocomplete reducer', () => {
  const ITEMS = [
    { key: 'a', text: 'Alfa', searchValue: 'Alfa' },
    { key: 'b', text: 'Bravo', searchValue: 'Bravo' }
  ]
  const reduce = (state: any, ...actions: any[]) =>
    actions.reduce((current, action) => createAutocompleteReducer(state)(current, action), state)

  it('takes plain strings as items, and the default key as the value', () => {
    const state = reduce(
      {},
      INIT({ props: { items: ['Alfa', 'Bravo'], defaultSelectedKey: 'Bravo', onSelected: null } })
    )
    expect(state.items).toEqual([
      { key: 'Alfa', text: 'Alfa', searchValue: 'Alfa' },
      { key: 'Bravo', text: 'Bravo', searchValue: 'Bravo' }
    ])
    expect(state.value).toBe('Bravo')
  })

  it('moves the highlight with the arrows and picks it on Enter', () => {
    const onEnter = jest.fn()
    let state = reduce(
      { selectedIndex: -1 },
      INIT({ props: { items: ITEMS, onSelected: null } }),
      ON_SEARCH({ searchTerm: 'a' })
    )
    expect(state.suggestions.map(({ key }) => key)).toEqual(['a', 'b'])
    state = reduce(
      state,
      ON_KEY_DOWN({ key: 'ArrowDown', onEnter }),
      ON_KEY_DOWN({ key: 'ArrowDown', onEnter }),
      ON_KEY_DOWN({ key: 'ArrowUp', onEnter })
    )
    expect(state.selectedIndex).toBe(0)
    state = reduce(state, ON_KEY_DOWN({ key: 'Enter', onEnter }))
    expect(onEnter).toHaveBeenCalledWith(ITEMS[0])
    expect(state).toMatchObject({ suggestions: [], value: 'Alfa' })
  })

  it('keeps what was typed on Enter with nothing highlighted', () => {
    const onEnter = jest.fn()
    const state = reduce(
      { selectedIndex: -1 },
      INIT({ props: { items: ITEMS, onSelected: null } }),
      ON_SEARCH({ searchTerm: 'Br' }),
      ON_KEY_DOWN({ key: 'Enter', onEnter })
    )
    expect(onEnter).not.toHaveBeenCalled()
    expect(state.value).toBe('Br')
  })

  it('offers nothing for an empty search, and starts over on reset', () => {
    let state = reduce(
      {},
      INIT({ props: { items: ITEMS, onSelected: null } }),
      ON_SEARCH({ searchTerm: '' })
    )
    expect(state.suggestions).toEqual([])
    state = reduce(state, SET_SELECTED_INDEX({ index: 1 }), DISMISS_CALLOUT({ item: ITEMS[1] }))
    expect(state).toMatchObject({ selectedIndex: 1, value: 'Bravo', selectedItem: ITEMS[1] })
    state = reduce(state, RESET())
    expect(state).toMatchObject({ value: '', selectedItem: null, suggestions: [] })
  })
})
