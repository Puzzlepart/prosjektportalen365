import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { Fluent } from './Fluent'

/**
 * The shared Fluent wrapper: its children inside a FluentProvider, and the children it is given on
 * every render, not only on the first.
 */
describe('Fluent', () => {
  it('renders its children in a Fluent provider, transparent when asked', () => {
    render(
      <Fluent transparent className='egen'>
        <span>Innhold</span>
      </Fluent>
    )
    const provider = screen.getByText('Innhold').closest('.fui-FluentProvider') as HTMLElement
    expect(provider).toHaveClass('egen')
    expect(provider.style.backgroundColor).toBe('transparent')
  })

  it('renders the children it is given on a later render', () => {
    const { rerender } = render(
      <Fluent>
        <span>Laster</span>
      </Fluent>
    )
    rerender(
      <Fluent>
        <span>Det har oppstått en feil</span>
      </Fluent>
    )
    expect(screen.queryByText('Laster')).toBeNull()
    expect(screen.getByText('Det har oppstått en feil')).toBeInTheDocument()
  })
})
