import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { UserMessage } from '.'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('UserMessage', () => {
  it('shows its title, its text as markdown and what it wraps', () => {
    render(
      <UserMessage title='Ingen tilgang' text='Kontakt **administrator**.' intent='warning'>
        <a href='/hjelp'>Les mer</a>
      </UserMessage>
    )
    expect(screen.getByText('Ingen tilgang')).toBeInTheDocument()
    expect(screen.getByTestId('react-markdown')).toHaveTextContent('Kontakt **administrator**.')
    expect(screen.getByText('Les mer')).toHaveAttribute('href', '/hjelp')
  })

  it('leaves out the title and the text it does not have', () => {
    render(<UserMessage />)
    expect(screen.queryByTestId('react-markdown')).toBeNull()
  })

  it('can be hidden, and reports a click', () => {
    const onClick = jest.fn()
    const { container, rerender } = render(<UserMessage text='Lagret' onClick={onClick} />)
    fireEvent.click(screen.getByText('Lagret'))
    expect(onClick).toHaveBeenCalled()
    rerender(<UserMessage text='Lagret' hidden />)
    expect(container.firstElementChild).not.toBeVisible()
  })
})
