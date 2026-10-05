import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { BaseDialog } from '.'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('BaseDialog', () => {
  it('shows its title, text, content, footer and version', () => {
    render(
      <BaseDialog
        title='Oppsettveiviser'
        subText='Velg en mal for området'
        version='v1.15.0'
        footer={<button>Sett opp</button>}
      >
        <p>Innholdet</p>
      </BaseDialog>
    )
    expect(screen.getByText('Oppsettveiviser')).toBeInTheDocument()
    expect(screen.getByText('Velg en mal for området')).toBeInTheDocument()
    expect(screen.getByText('Innholdet')).toBeInTheDocument()
    expect(screen.getByText('Sett opp')).toBeInTheDocument()
    expect(screen.getByText('v1.15.0')).toBeInTheDocument()
  })

  it('closes through its close button', () => {
    const onDismiss = jest.fn()
    render(<BaseDialog title='Oppsettveiviser' onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('has no close button when it blocks the page', () => {
    render(<BaseDialog title='Oppsettveiviser' isBlocking onDismiss={jest.fn()} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
