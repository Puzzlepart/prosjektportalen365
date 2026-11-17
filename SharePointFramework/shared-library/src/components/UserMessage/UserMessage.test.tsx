import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
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

  it('keeps a space between its title and its text, which are announced as one text (WCAG 4.1.3)', () => {
    // The copy summary was announced «Sammendrag av kopiering1 element(er) …».
    render(<UserMessage title='Sammendrag av kopiering' text='1 element(er) ble kopiert.' />)
    expect(screen.getByText('Sammendrag av kopiering').parentElement).toHaveTextContent(
      'Sammendrag av kopiering 1 element(er) ble kopiert.'
    )
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

  it('breaks no rule axe can check, with a title, a text and a link', async () => {
    const { container } = render(
      <UserMessage title='Ingen tilgang' text='Kontakt **administrator**.' intent='warning'>
        <a href='/hjelp'>Les mer</a>
      </UserMessage>
    )
    expect(await axeComponent(container)).toHaveNoViolations()
  })
})
