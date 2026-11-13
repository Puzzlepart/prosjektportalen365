import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input, Switch, useFieldControlProps_unstable } from '@fluentui/react-components'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { FieldContainer } from '.'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

/**
 * A control that opens a popup when clicked, as a date picker's or a combobox's input does: a
 * `combobox` with the id of the field it is in, reporting each click.
 */
const PopupControl: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const props = useFieldControlProps_unstable({}, { supportsLabelFor: true })
  return <input {...props} role='combobox' aria-expanded={false} onClick={onOpen} />
}

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
    expect(screen.getByLabelText((content) => content.startsWith('Tittel'))).toHaveAttribute(
      'required'
    )
    expect(screen.getByLabelText('Kommentar')).toBeInTheDocument()
  })

  it('focuses a date or choice field from its label without opening it, and still toggles a switch (Puzzlepart/prosjektportalen365-testing#126)', async () => {
    // The browser hands a click on a label on to the control as a click: «Startdato» opened the
    // calendar and took the focus into it, and «Prosjektstatus» opened the list.
    const user = userEvent.setup()
    const openStatus = jest.fn()
    const openDate = jest.fn()
    render(
      <>
        <FieldContainer label='Prosjektstatus'>
          <PopupControl onOpen={openStatus} />
        </FieldContainer>
        <FieldContainer label='Startdato' iconName='Calendar'>
          <PopupControl onOpen={openDate} />
        </FieldContainer>
        <FieldContainer label='Opprett flere' iconName='ToggleLeft'>
          <Switch />
        </FieldContainer>
      </>
    )
    await user.click(screen.getByText('Prosjektstatus'))
    expect(screen.getByRole('combobox', { name: 'Prosjektstatus' })).toHaveFocus()
    expect(openStatus).not.toHaveBeenCalled()
    await user.click(screen.getByText('Startdato'))
    expect(screen.getByRole('combobox', { name: 'Startdato' })).toHaveFocus()
    expect(openDate).not.toHaveBeenCalled()
    // A click on the control itself still opens it.
    await user.click(screen.getByRole('combobox', { name: 'Startdato' }))
    expect(openDate).toHaveBeenCalledTimes(1)
    await user.click(screen.getByText('Opprett flere'))
    expect(screen.getByRole('switch', { name: 'Opprett flere' })).toBeChecked()
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

  it('breaks no WCAG 2.1 A or AA rule axe can check, with or without an icon', async () => {
    const { container } = render(
      <>
        <FieldContainer label='Tittel' iconName='TextNumberFormat' required description='Navnet'>
          <Input />
        </FieldContainer>
        <FieldContainer label='Kommentar'>
          <Input />
        </FieldContainer>
      </>
    )
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('is what keeps axe from finding an input without a label', async () => {
    const { container } = render(<Input />)
    const { violations } = await axeComponent(container)
    expect(violations.map((violation) => violation.id)).toContain('label')
  })
})
