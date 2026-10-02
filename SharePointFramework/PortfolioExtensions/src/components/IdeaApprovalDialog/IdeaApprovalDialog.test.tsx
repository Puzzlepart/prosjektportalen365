// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Fluent's combobox family cannot be opened under jsdom on
// React 17 (it loops the Jest worker; see the testing guide), so the dialog's combobox is a native
// select that keeps Fluent's contract: choosing an option calls `onOptionSelect` with the
// option's value and text.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const Combobox = ({ placeholder, onOptionSelect, children }: any) =>
    React.createElement(
      'select',
      {
        'aria-label': placeholder,
        defaultValue: '',
        onChange: (event: any) => {
          const option = event.target.options[event.target.selectedIndex]
          onOptionSelect?.(event, {
            optionValue: option.value,
            optionText: option.textContent,
            selectedOptions: [option.value]
          })
        }
      },
      React.createElement('option', { value: '', disabled: true }, placeholder),
      children
    )
  const Option = ({ value, children }: any) => React.createElement('option', { value }, children)
  return { __esModule: true, ...actual, Combobox, Option }
})

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'PortfolioExtensionsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import RecommendationDialog, { IdeaApprovalDialog } from '.'

const CHOICES = [
  { key: 'approve', choice: 'Godkjenn' },
  { key: 'reject', choice: 'Avvis' }
]

function choose(choice: string) {
  fireEvent.change(screen.getByLabelText(strings.ActionLabelPlaceholder), {
    target: { value: choice }
  })
}

function comment(text: string) {
  fireEvent.change(screen.getByPlaceholderText(strings.CommentLabelPlaceholder), {
    target: { value: text }
  })
}

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('IdeaApprovalDialog', () => {
  it('asks for a recommendation for the idea among the configured choices', () => {
    render(
      <IdeaApprovalDialog
        ideaTitle='Ny bysykkel'
        dialogMessage='Velg hva som skal skje med ideen.'
        choices={CHOICES}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByText(strings.SetRecommendationTitle)).toBeInTheDocument()
    expect(
      screen.getByText(format(strings.SetRecommendationSubtitle, 'Ny bysykkel'))
    ).toBeInTheDocument()
    expect(screen.getByText('Velg hva som skal skje med ideen.')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Godkjenn' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Avvis' })).toBeInTheDocument()
  })

  it('sends the choice and the comment once both are given', () => {
    const onSubmit = jest.fn()
    render(<IdeaApprovalDialog choices={CHOICES} onClose={jest.fn()} onSubmit={onSubmit} />)
    const send = screen.getByRole('button', { name: strings.SubmitLabel })
    expect(send).toBeDisabled()
    choose('Godkjenn')
    expect(send).toBeDisabled()
    comment('Passer med strategien')
    expect(send).toBeEnabled()
    fireEvent.click(send)
    expect(onSubmit).toHaveBeenCalledWith('Godkjenn', 'Passer med strategien')
  })

  it('needs a choice, not only a comment', () => {
    render(<IdeaApprovalDialog choices={CHOICES} onClose={jest.fn()} onSubmit={jest.fn()} />)
    comment('Uten valg')
    expect(screen.getByRole('button', { name: strings.SubmitLabel })).toBeDisabled()
  })

  it('closes on cancel', () => {
    const onClose = jest.fn()
    render(<IdeaApprovalDialog choices={CHOICES} onClose={onClose} onSubmit={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: strings.CancelLabel }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('RecommendationDialog', () => {
  it('hands the choice and the comment to the command when it closes', async () => {
    const dialog = new RecommendationDialog()
    dialog.ideaTitle = 'Ny bysykkel'
    dialog.choices = CHOICES
    const closed = dialog.show()
    await screen.findByText(format(strings.SetRecommendationSubtitle, 'Ny bysykkel'))
    choose('Avvis')
    comment('For dyrt')
    fireEvent.click(screen.getByRole('button', { name: strings.SubmitLabel }))
    await closed
    expect(dialog.selectedChoice).toBe('Avvis')
    expect(dialog.comment).toBe('For dyrt')
    expect(screen.queryByText(strings.SetRecommendationTitle)).toBeNull()
  })

  it('closes with no choice on cancel', async () => {
    const dialog = new RecommendationDialog()
    dialog.choices = CHOICES
    const closed = dialog.show()
    fireEvent.click(await screen.findByRole('button', { name: strings.CancelLabel }))
    await closed
    expect(dialog.comment).toBeUndefined()
    await waitFor(() => expect(screen.queryByText(strings.SetRecommendationTitle)).toBeNull())
  })
})
