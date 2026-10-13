// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The autocomplete is a Fluent combobox, which looped the Jest
// worker on React 17 and takes tens of seconds to open under jsdom on React 18; it has tests of its
// own, and this one stands in for it with a button per item that reports the pick, to test what the
// field hands it and takes from it.
jest.mock('../Autocomplete', () => {
  const React = jest.requireActual('react')
  return {
    Autocomplete: (props: any) =>
      React.createElement(
        'div',
        null,
        React.createElement('span', null, props.label),
        props.items.map((item: string) =>
          React.createElement(
            'button',
            { key: item, onClick: () => props.onSelected({ key: item, text: item }) },
            item
          )
        )
      )
  }
})

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { ColumnSearchPropertyField } from '.'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ColumnSearchPropertyField', () => {
  it('is a plain input without managed properties to search', () => {
    const onChange = jest.fn()
    render(
      <ColumnSearchPropertyField
        value='GtProjectPhaseOWSCHCS'
        placeholder='Søkeegenskap'
        onChange={onChange}
      />
    )
    const input = screen.getByPlaceholderText('Søkeegenskap')
    expect(input).toHaveValue('GtProjectPhaseOWSCHCS')
    fireEvent.change(input, { target: { value: 'RefinableString01' } })
    expect(onChange).toHaveBeenCalledWith('RefinableString01')
  })

  it('searches the managed properties when it has them', async () => {
    const onChange = jest.fn()
    render(
      <ColumnSearchPropertyField
        label='Søkeegenskap'
        placeholder='Søk etter egenskap'
        managedProperties={['GtProjectPhaseOWSCHCS', 'RefinableString01']}
        onChange={onChange}
      />
    )
    expect(screen.getByText('Søkeegenskap')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'RefinableString01' }))
    expect(onChange).toHaveBeenCalledWith('RefinableString01')
  })
})
