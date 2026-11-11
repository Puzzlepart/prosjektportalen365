import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { PlannerTaskItemProperty } from './PlannerTaskItemProperty'

describe('PlannerTaskItemProperty', () => {
  it('renders the label and value', () => {
    render(<PlannerTaskItemProperty label='Frist' value='21.09.2026' />)
    expect(screen.getByText('Frist')).toBeVisible()
    expect(screen.getByText('21.09.2026')).toBeVisible()
  })

  it("is a name and its value, a term and its description in the preview's list (WCAG 1.3.1)", () => {
    render(<PlannerTaskItemProperty label='Frist' value='21.09.2026' />)
    expect(screen.getByText('Frist').closest('dt')).not.toBeNull()
    expect(screen.getByText('21.09.2026').closest('dd')).not.toBeNull()
  })

  it('is hidden when there is neither a value nor children', () => {
    const { container } = render(<PlannerTaskItemProperty label='Frist' />)
    expect(container.firstElementChild).toHaveAttribute('hidden')
  })

  it('stays visible with children only', () => {
    render(
      <PlannerTaskItemProperty label='Tildelt'>
        <span>Kari Nordmann</span>
      </PlannerTaskItemProperty>
    )
    expect(screen.getByText('Kari Nordmann')).toBeVisible()
    expect(screen.getByText('Tildelt').closest('[hidden]')).toBeNull()
  })
})
