import { render, screen } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { UserColumn } from '.'

/**
 * The person cell: one person as their picture beside their name, several as pictures named by
 * the people in them. A picture beside the name says nothing the name does not, so it is hidden
 * from screen readers, which would otherwise read the name twice.
 */
const column = (fieldName: string) => ({ key: fieldName, fieldName, name: 'Prosjektleder' }) as any

describe('UserColumn', () => {
  it('reads one person by their name once, their picture beside it hidden (WCAG 1.1.1)', async () => {
    const { container, rerender } = render(
      <UserColumn
        columnValue='kari@contoso.no | Kari Nordmann'
        column={column('GtProjectManagerOWSUSER')}
      />
    )
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
    expect(await axeComponent(container)).toHaveNoViolations()
    rerender(<UserColumn columnValue='Ola Nordmann' column={column('GtProjectOwner')} />)
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('names each of several people by their picture', async () => {
    const { container } = render(
      <UserColumn columnValue='Kari Nordmann;Ola Nordmann' column={column('GtProjectTeam')} />
    )
    expect(screen.getByRole('img', { name: 'Kari Nordmann' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ola Nordmann' })).toBeInTheDocument()
    expect(await axeComponent(container)).toHaveNoViolations()
  })
})
