// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Fluent's combobox family loops the Jest worker on React 17 the
// moment it opens (see the testing guide); the stand-in keeps the contract the autocomplete uses:
// the input shows `value` and reports typing through `onChange`, the clear button and each option
// report a pick through `onOptionSelect`, a clear with no option value.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const Pick = React.createContext(null)
  const Combobox = (props: any) =>
    React.createElement(
      Pick.Provider,
      { value: props.onOptionSelect },
      React.createElement('input', {
        role: 'combobox',
        value: props.value,
        placeholder: props.placeholder,
        disabled: props.disabled,
        onChange: props.onChange
      }),
      props.clearable &&
        React.createElement(
          'button',
          {
            onClick: (event: any) =>
              props.onOptionSelect(event, { optionValue: undefined, selectedOptions: [] })
          },
          'Tøm'
        ),
      React.createElement('ul', { role: 'listbox' }, props.children)
    )
  const Option = (props: any) => {
    const onOptionSelect = React.useContext(Pick)
    return React.createElement(
      'li',
      {
        role: 'option',
        'aria-disabled': !!props.disabled,
        onClick: (event: any) =>
          !props.disabled &&
          onOptionSelect(event, {
            optionValue: props.value,
            optionText: props.text,
            selectedOptions: [props.value]
          })
      },
      props.children
    )
  }
  return { __esModule: true, ...actual, Combobox, Option }
})

import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { Autocomplete } from '.'

/**
 * The contract the autocomplete keeps for its callers, from its v8 search box and callout to the
 * v9 combobox (slice 7 of phase 4): typing narrows the items to those that match, a pick reports
 * the item, the default key starts it picked, and clearing starts over.
 */
const PROPERTIES = ['GtProjectPhaseOWSCHCS', 'GtProjectManagerOWSUSER', 'RefinableString01']

const input = () => screen.getByRole('combobox')
const offered = () => screen.queryAllByRole('option').map((option) => option.textContent)

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

describe('Autocomplete', () => {
  it('offers every item until something is typed, then the ones that match, ignoring case', () => {
    renderAutocomplete()
    expect(offered()).toEqual(PROPERTIES)
    fireEvent.change(input(), { target: { value: 'gtproject' } })
    expect(offered()).toEqual(['GtProjectPhaseOWSCHCS', 'GtProjectManagerOWSUSER'])
  })

  it('reports the item picked and shows its text', () => {
    const { onSelected } = renderAutocomplete()
    fireEvent.change(input(), { target: { value: 'manager' } })
    fireEvent.click(screen.getByRole('option', { name: 'GtProjectManagerOWSUSER' }))
    expect(onSelected).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'GtProjectManagerOWSUSER', text: 'GtProjectManagerOWSUSER' })
    )
    expect(input()).toHaveValue('GtProjectManagerOWSUSER')
  })

  it('starts with the item of its default key, and its items may carry more than a name', () => {
    renderAutocomplete({
      items: [
        { key: 'phase', text: 'Fase', searchValue: 'Fase GtProjectPhase' },
        { key: 'owner', text: 'Eier', searchValue: 'Eier GtProjectOwner', disabled: true }
      ],
      defaultSelectedKey: 'phase'
    })
    expect(input()).toHaveValue('Fase')
    fireEvent.change(input(), { target: { value: 'gtproject' } })
    // The search value is matched, the text shown, and a disabled item cannot be picked.
    expect(offered()).toEqual(['Fase', 'Eier'])
    expect(screen.getByRole('option', { name: 'Eier' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('starts over when it is cleared, whether or not the caller listens', () => {
    const onClear = jest.fn()
    renderAutocomplete({ defaultSelectedKey: 'RefinableString01', onClear })
    fireEvent.click(screen.getByRole('button', { name: 'Tøm' }))
    expect(input()).toHaveValue('')
    expect(onClear).toHaveBeenCalledTimes(1)
    const { onSelected } = renderAutocomplete({ defaultSelectedKey: 'RefinableString01' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Tøm' })[1])
    expect(onSelected).not.toHaveBeenCalled()
  })

  it('starts over when the caller sets the selected key to null', () => {
    const { rerender, onSelected } = renderAutocomplete({ defaultSelectedKey: 'RefinableString01' })
    expect(input()).toHaveValue('RefinableString01')
    rerender(
      <Autocomplete
        items={PROPERTIES}
        onSelected={onSelected}
        defaultSelectedKey='RefinableString01'
        selectedKey={null}
      />
    )
    expect(input()).toHaveValue('')
  })

  it('says so when nothing matches, if it is given the words', () => {
    renderAutocomplete({ noSuggestionsText: 'Ingen treff' })
    fireEvent.change(input(), { target: { value: 'finnes ikke' } })
    expect(offered()).toEqual(['Ingen treff'])
    expect(screen.getByRole('option', { name: 'Ingen treff' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('sits in a field with its label, hint and error when it has them', () => {
    renderAutocomplete({
      label: 'Søkeegenskap',
      description: 'Egenskapen i søkeindeksen',
      errorMessage: 'Velg en egenskap'
    })
    expect(screen.getByText('Søkeegenskap')).toBeInTheDocument()
    expect(screen.getByText('Egenskapen i søkeindeksen')).toBeInTheDocument()
    expect(screen.getByText('Velg en egenskap')).toBeInTheDocument()
  })
})
