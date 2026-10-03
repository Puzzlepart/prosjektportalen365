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
    fireEvent.change(screen.getByPlaceholderText('Søk etter egenskap'), {
      target: { value: 'refinable' }
    })
    fireEvent.click(await screen.findByText('RefinableString01'))
    expect(onChange).toHaveBeenCalledWith('RefinableString01')
  })
})
