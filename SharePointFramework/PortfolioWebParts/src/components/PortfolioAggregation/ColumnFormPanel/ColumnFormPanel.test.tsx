// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The form's hook reaches the data adapter; it is a stand-in that
// edits an existing column. The footer, the render mode field and the search property's combobox
// are stand-ins too: they have tests of their own.
jest.mock('./useColumnFormPanel', () => ({
  useColumnFormPanel: () => ({
    onSave: jest.fn(),
    isSaveDisabled: false,
    onDeleteColumn: jest.fn(),
    isDeleteDisabled: false,
    onDismiss: jest.fn(),
    column: new Map<string, any>([
      ['sortOrder', 100],
      ['internalName', 'GtDeliveryStatus'],
      ['fieldName', 'GtDeliveryStatusOWSCHCS'],
      ['name', 'Status'],
      ['data', { isGroupable: true }]
    ]),
    setColumn: jest.fn(),
    setColumnData: jest.fn(),
    persistRenderGlobally: false,
    setPersistRenderGlobally: jest.fn(),
    isEditing: true,
    saveError: null,
    fluentProviderId: 'fp-column-form'
  })
}))
jest.mock('./ColumnFormPanelFooter', () => ({ ColumnFormPanelFooter: () => null }))
jest.mock('pp365-shared-library/lib/components/ItemColumn/ColumnDataTypeField', () => ({
  ColumnDataTypeField: () => null
}))
jest.mock('pp365-shared-library', () => {
  const React = jest.requireActual('react')
  return {
    ...jest.requireActual('pp365-shared-library'),
    ColumnSearchPropertyField: ({ disabled }: any) =>
      React.createElement('input', { disabled, defaultValue: 'GtDeliveryStatusOWSCHCS' })
  }
})

import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { PortfolioAggregationContext } from '../context'
import { ColumnFormPanel } from './ColumnFormPanel'

/**
 * The aggregated overview's column form for an existing column: what cannot change is read-only
 * and says why, where it was disabled, out of the keyboard's reach, with no word of why.
 */
function renderForm() {
  render(
    <PortfolioAggregationContext.Provider
      value={
        {
          state: { columnForm: { isOpen: true } },
          props: { dataSourceCategory: 'Leveranser' }
        } as any
      }
    >
      <ColumnFormPanel />
    </PortfolioAggregationContext.Provider>
  )
}

describe('ColumnFormPanel (aggregated overview)', () => {
  it("keeps an existing column's internal name and sort order read-only, saying why (WCAG 2.1.1, 3.3.2)", () => {
    renderForm()
    for (const label of [strings.InternalNameLabel, strings.SortOrderLabel]) {
      const field = screen.getByLabelText(new RegExp(label))
      expect(field).not.toBeDisabled()
      expect(field).toHaveAttribute('readonly')
      expect(field).toHaveAccessibleDescription(
        expect.stringContaining(strings.ColumnFieldLockedText)
      )
    }
  })

  it("shows the data source's category read-only, saying where it comes from (WCAG 2.1.1, 3.3.2)", () => {
    renderForm()
    const category = screen.getByLabelText(new RegExp(strings.ColumnCategoryLabel))
    expect(category).not.toBeDisabled()
    expect(category).toHaveAttribute('readonly')
    expect(category).toHaveValue('Leveranser')
    expect(category).toHaveAccessibleDescription(
      expect.stringContaining(strings.ReadOnlyFromDataSourceText)
    )
  })
})
