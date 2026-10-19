import { useRestoreFocusTarget } from '@fluentui/react-components'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { PortfolioAggregationContext } from '../../context'
import { ColumnFormPanelFooter } from './index'

/**
 * The aggregated overview's column form footer: its delete asks first, in a dialog opened from
 * state, so the button is where the focus goes back.
 */
describe('ColumnFormPanelFooter (aggregated overview)', () => {
  it('gives the focus back to delete as its confirmation closes, not to the column header behind the panel (WCAG 2.4.3)', () => {
    let target: ReturnType<typeof useRestoreFocusTarget>
    const Probe: React.FC = () => {
      target = useRestoreFocusTarget()
      return null
    }
    render(
      <PortfolioAggregationContext.Provider value={{ dispatch: jest.fn() } as any}>
        <Probe />
        <ColumnFormPanelFooter
          onSave={jest.fn()}
          onDeleteColumn={jest.fn()}
          isEditing
          isSaveDisabled={false}
          isDeleteDisabled={false}
        />
      </PortfolioAggregationContext.Provider>
    )
    const [attribute, value] = Object.entries(target)[0]
    expect(screen.getByRole('button', { name: 'Slett' })).toHaveAttribute(attribute, value)
  })
})
