// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The archive status reads the project's archive log through its
// hook, which hands the test what `archive` holds. Fluent positions an open popover against its
// trigger, which is slow under jsdom (see the testing guide): the popover is a stand-in that shows
// its surface while open, named as it is told, and records whether it was asked to trap focus.
const popover: { trapFocus?: boolean } = {}
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const PopoverContext = React.createContext({ open: false })
  const Popover = ({ open, trapFocus, children }: any) => {
    popover.trapFocus = trapFocus
    return React.createElement(PopoverContext.Provider, { value: { open } }, children)
  }
  const PopoverTrigger = ({ children }: any) => children
  const PopoverSurface = ({ children, ...props }: any) =>
    React.useContext(PopoverContext).open
      ? React.createElement('div', { role: 'dialog', 'aria-label': props['aria-label'] }, children)
      : null
  return { __esModule: true, ...actual, Popover, PopoverTrigger, PopoverSurface }
})
const archive: { operations: any[] } = { operations: [] }
jest.mock('./useArchiveStatus', () => ({
  useArchiveStatus: () => ({
    archiveInfo: { lastArchiveDate: new Date(2026, 9, 1), operations: [] },
    processedOperations: archive.operations,
    open: true,
    fluentProviderId: 'fp-archive-status',
    handleOpenChange: jest.fn(),
    shouldHide: false
  })
}))

import { render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ArchiveStatus } from '.'
import { getContrastRatio } from 'pp365-shared-library'

const { ARCHIVE_STATUS_COLORS } =
  jest.requireActual<typeof import('./useArchiveStatus')>('./useArchiveStatus')

/**
 * The archive status of the project information: a message with the last archiving, which opens
 * the operations behind it in a popover.
 */
describe('ArchiveStatus', () => {
  it('opens the operations in a dialog named by the section, holding the focus (WCAG 2.4.3)', () => {
    archive.operations = [
      {
        operation: 'Fasebytte',
        date: new Date(2026, 9, 1),
        message: '',
        documentCount: 2,
        listCount: 0,
        totalItems: 2,
        scopes: [],
        scopeItems: [
          {
            scope: 'Dokumenter',
            count: 2,
            status: strings.ArchiveLogStatusWarning,
            icon: null,
            color: '#ffa500'
          }
        ]
      }
    ]
    render(<ArchiveStatus />)
    expect(screen.getByRole('heading', { level: 3, name: strings.ArchiveStatusHeaderText }))
    const dialog = screen.getByRole('dialog', { name: strings.ArchiveStatusHeaderText })
    expect(dialog).toBeInTheDocument()
    expect(popover.trapFocus).toBe(true)
    // The status is the group's heading; its colour is the icon's, not the text's, which in the
    // warning's orange read 2:1 (WCAG 1.4.3).
    expect(screen.getByText('Dokumenter (2)').closest('.fui-Tag')).not.toHaveStyle({
      color: '#ffa500'
    })
  })
})

describe('ARCHIVE_STATUS_COLORS', () => {
  it("gives each status icon 3:1 against the tag it sits in, where the warning's orange had 1.8:1 (WCAG 1.4.11)", () => {
    // Fluent's filled tag is colorNeutralBackground3.
    for (const color of Object.values(ARCHIVE_STATUS_COLORS)) {
      expect(getContrastRatio(color, '#f5f5f5')).toBeGreaterThanOrEqual(3)
    }
  })
})
