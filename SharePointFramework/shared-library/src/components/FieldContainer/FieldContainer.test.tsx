import { act, cleanup, render, screen } from '@testing-library/react'
import { Input } from '@fluentui/react-components'
import * as React from 'react'
import { FieldContainer } from '.'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('FieldContainer', () => {
  it('labels its field, with an icon when it has one, and shows the description as a hint', () => {
    render(
      <FieldContainer label='Tittel' iconName='TextNumberFormat' description='Prosjektets navn'>
        <input aria-label='felt' />
      </FieldContainer>
    )
    expect(screen.getByText('Tittel')).toBeInTheDocument()
    expect(screen.getByText('Prosjektets navn')).toBeInTheDocument()
    expect(screen.getByLabelText('felt')).toBeInTheDocument()
    // The icon is part of the label, so a click on it goes to the field as well.
    expect(screen.getByText('Tittel').closest('label').querySelector('svg')).not.toBeNull()
  })

  it("ties the label to the field's control, with or without an icon", () => {
    render(
      <>
        <FieldContainer label='Tittel' iconName='TextNumberFormat' required>
          <Input />
        </FieldContainer>
        <FieldContainer label='Kommentar'>
          <Input />
        </FieldContainer>
      </>
    )
    // A required field's label ends with an asterisk.
    expect(screen.getByLabelText((content) => content.startsWith('Tittel'))).toHaveAttribute(
      'required'
    )
    expect(screen.getByLabelText('Kommentar')).toBeInTheDocument()
  })

  it('shows its validation message', () => {
    render(
      <FieldContainer label='Budsjett' validationState='error' validationMessage='For høyt'>
        <input />
      </FieldContainer>
    )
    expect(screen.getByText('For høyt')).toBeInTheDocument()
  })

  it('can be hidden', () => {
    const { container } = render(
      <FieldContainer label='Skjult' hidden>
        <input />
      </FieldContainer>
    )
    expect(container.firstElementChild).not.toBeVisible()
  })
})
