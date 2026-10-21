import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { PortfolioAggregationContext } from '../../context'
import { ViewFormPanelFooter } from './index'

/**
 * The aggregated overview's view form's footer: save waits for a complete form, focusable and saying what it
 * needs, where it was disabled, skipped by the keyboard, with no word of why.
 */
function renderFooter(onSave?: () => Promise<void>) {
  render(
    <PortfolioAggregationContext.Provider value={{ dispatch: jest.fn() } as any}>
      <ViewFormPanelFooter onSave={onSave} />
    </PortfolioAggregationContext.Provider>
  )
  return screen.getByRole('button', { name: 'Lagre' })
}

describe('ViewFormPanelFooter (aggregated overview)', () => {
  it('saves a complete form', async () => {
    const onSave = jest.fn(() => Promise.resolve())
    await userEvent.setup().click(renderFooter(onSave))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('lets the keyboard reach save while the form is incomplete, and says what it needs (WCAG 2.1.1, 3.3.2)', () => {
    const save = renderFooter(undefined)
    expect(save).toHaveAttribute('aria-disabled', 'true')
    expect(save).toHaveAccessibleDescription(strings.ViewFormSaveDisabledReason)
  })
})
