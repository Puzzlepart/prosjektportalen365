// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The form's hook reaches the data adapter; it is a stand-in that
// edits an existing column. The footer, the render mode field and the search property's combobox
// are stand-ins too: they have tests of their own.
jest.mock('./useColumnFormPanel', () => ({
  useColumnFormPanel: () => ({
    onSave: jest.fn(),
    isSaveDisabled: false,
    onDeleteColumn: jest.fn(),
    onDismiss: jest.fn(),
    column: new Map<string, any>([
      ['sortOrder', 100],
      ['internalName', 'GtDeliveryStatus'],
      ['fieldName', 'GtDeliveryStatusOWSCHCS'],
      ['name', 'Status'],
      ['data', { isGroupable: true, visibility: [] }]
    ]),
    setColumn: jest.fn(),
    setColumnData: jest.fn(),
    findMatchingSearchProperty: jest.fn(),
    columnMessages: new Map(),
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
    ColumnSearchPropertyField: ({ disabled, readOnly }: any) =>
      React.createElement('input', { disabled, readOnly, defaultValue: 'GtDeliveryStatusOWSCHCS' })
  }
})

import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { PortfolioOverviewContext } from '../context'
import { ColumnFormPanel } from './index'

/**
 * The portfolio overview's column form for an existing column: its internal name cannot change,
 * so it is read-only and says why, where it was disabled, out of the keyboard's reach, with no
 * word of why.
 */
function renderForm() {
  render(
    <PortfolioOverviewContext.Provider value={{ state: { columnForm: { isOpen: true } } } as any}>
      <ColumnFormPanel />
    </PortfolioOverviewContext.Provider>
  )
}

describe('ColumnFormPanel (portfolio overview)', () => {
  it("keeps an existing column's internal name read-only, saying why (WCAG 2.1.1, 3.3.2)", () => {
    renderForm()
    const field = screen.getByLabelText(new RegExp(strings.InternalNameLabel))
    expect(field).not.toBeDisabled()
    expect(field).toHaveAttribute('readonly')
    expect(field).toHaveAccessibleDescription(
      expect.stringContaining(strings.ColumnFieldLockedText)
    )
    // The search property as well: a stand-in shows it, so only its state is seen here.
    const searchProperty = screen.getByDisplayValue('GtDeliveryStatusOWSCHCS')
    expect(searchProperty).not.toBeDisabled()
    expect(searchProperty).toHaveAttribute('readonly')
  })
})
