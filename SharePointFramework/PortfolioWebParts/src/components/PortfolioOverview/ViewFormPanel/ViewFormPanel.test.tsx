// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The form's hook and its footer reach the data adapter; the hook
// is a stand-in that gives the view the test sets, and the footer renders nothing.
const form: { view: Map<string, any>; isDefaultViewSet: boolean } = {
  view: new Map(),
  isDefaultViewSet: false
}
jest.mock('./useViewFormPanel', () => ({
  useViewFormPanel: () => ({
    view: form.view,
    setView: jest.fn(),
    isEditing: true,
    onDismiss: jest.fn(),
    isDefaultViewSet: form.isDefaultViewSet,
    onSave: jest.fn(),
    fluentProviderId: 'fp-view-form'
  })
}))
jest.mock('./ViewFormPanelFooter', () => ({ ViewFormPanelFooter: () => null }))

import { render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { PortfolioOverviewContext } from '../context'
import { ViewFormPanel } from './ViewFormPanel'

/**
 * The form for a portfolio view: the warning that a default view is set already shows beside its
 * switch, and only while that field shows, since a message bar announces itself hidden or not.
 */
function renderForm(view: Record<string, any>, isDefaultViewSet: boolean) {
  form.view = new Map(Object.entries(view))
  form.isDefaultViewSet = isDefaultViewSet
  render(
    <PortfolioOverviewContext.Provider value={{ state: { viewForm: { isOpen: true } } } as any}>
      <ViewFormPanel />
    </PortfolioOverviewContext.Provider>
  )
}

describe('ViewFormPanel', () => {
  it('warns that a default view is set already beside the switch it disables', () => {
    renderForm({ title: 'Mine prosjekter', isPersonalView: false }, true)
    expect(screen.getByText(strings.DefaultViewSetWarningMessage)).toBeInTheDocument()
  })

  it('marks the search query as required, as save asks for it (WCAG 3.3.2)', () => {
    renderForm({ title: 'Mine prosjekter', searchQuery: '', isPersonalView: false }, false)
    expect(screen.getByLabelText(new RegExp(strings.SearchQueryLabel))).toBeRequired()
  })

  it('leaves the warning out for a personal view, whose default view field is hidden (WCAG 4.1.3)', () => {
    renderForm({ title: 'Mine prosjekter', isPersonalView: true }, true)
    expect(screen.queryByText(strings.DefaultViewSetWarningMessage)).toBeNull()
  })
})
