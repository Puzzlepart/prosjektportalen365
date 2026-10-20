import { useRestoreFocusTarget } from '@fluentui/react-components'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
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

  it("keeps save and the title column's delete from running, and lets the keyboard reach why (WCAG 2.1.1, 3.3.2)", async () => {
    // Both were disabled, skipped by the keyboard, with no word of why.
    const user = userEvent.setup()
    const onSave = jest.fn()
    render(
      <PortfolioAggregationContext.Provider value={{ dispatch: jest.fn() } as any}>
        <ColumnFormPanelFooter
          onSave={onSave}
          onDeleteColumn={jest.fn()}
          isEditing
          isSaveDisabled
          isDeleteDisabled
        />
      </PortfolioAggregationContext.Provider>
    )
    const save = screen.getByRole('button', { name: 'Lagre' })
    expect(save).toHaveAttribute('aria-disabled', 'true')
    expect(save).toHaveAccessibleDescription(strings.ColumnFormSaveDisabledReason)
    const remove = screen.getByRole('button', { name: 'Slett' })
    expect(remove).toHaveAttribute('aria-disabled', 'true')
    expect(remove).toHaveAccessibleDescription(strings.TitleColumnDeleteDisabledReason)
    await user.click(save)
    expect(onSave).not.toHaveBeenCalled()
  })
})
