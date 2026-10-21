// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The form's hook reaches the data adapter; it is a stand-in
// that gives the view the test sets, and the footer renders nothing.
jest.mock('./useViewFormPanel', () => ({
  useViewFormPanel: () => ({
    view: new Map<string, any>([
      ['title', 'Mine leveranser'],
      ['searchQuery', ''],
      ['iconName', '']
    ]),
    setView: jest.fn(),
    isEditing: true,
    onDismiss: jest.fn(),
    onSave: undefined,
    fluentProviderId: 'fp-view-form'
  })
}))
jest.mock('./ViewFormPanelFooter', () => ({ ViewFormPanelFooter: () => null }))

import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { PortfolioAggregationContext } from '../context'
import { ViewFormPanel } from './index'

/**
 * The aggregated overview's view form: the search query is required, as save asks for it, and the
 * data source's category and level, which come from the web part, are read-only fields that say
 * so, where they were disabled, out of the keyboard's reach.
 */
function renderForm() {
  render(
    <PortfolioAggregationContext.Provider
      value={
        {
          state: { viewForm: { isOpen: true } },
          props: { dataSourceCategory: 'Leveranser', configuration: { level: 'Portefølje' } }
        } as any
      }
    >
      <ViewFormPanel />
    </PortfolioAggregationContext.Provider>
  )
}

describe('ViewFormPanel (aggregated overview)', () => {
  it('marks the search query as required, as save asks for it (WCAG 3.3.2)', () => {
    renderForm()
    expect(screen.getByLabelText(new RegExp(strings.SearchQueryLabel))).toBeRequired()
  })

  it("shows the data source's category and level read-only, saying where they come from (WCAG 2.1.1, 3.3.2)", () => {
    renderForm()
    for (const label of [strings.DataSourceCategoryLabel, strings.DataSourceLevelLabel]) {
      const field = screen.getByLabelText(new RegExp(label))
      expect(field).not.toBeDisabled()
      expect(field).toHaveAttribute('readonly')
      expect(field).toHaveAccessibleDescription(
        expect.stringContaining(strings.ReadOnlyFromDataSourceText)
      )
    }
    expect(screen.getByDisplayValue('Leveranser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Portefølje')).toBeInTheDocument()
  })
})
