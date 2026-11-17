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
  /** Records focus trapping and shares open state without positioning the popover. */
  const Popover = ({ open, trapFocus, children }: any) => {
    popover.trapFocus = trapFocus
    return React.createElement(PopoverContext.Provider, { value: { open } }, children)
  }
  /** Leaves the archive status trigger available to the test. */
  const PopoverTrigger = ({ children }: any) => children
  /** Shows the open archive details with their accessible dialog name. */
  const PopoverSurface = ({ children, ...props }: any) =>
    React.useContext(PopoverContext).open
      ? React.createElement('div', { role: 'dialog', 'aria-label': props['aria-label'] }, children)
      : null
  return { __esModule: true, ...actual, Popover, PopoverTrigger, PopoverSurface }
})
const archive: { operations: any[] } = { operations: [] }
jest.mock('./useArchiveStatus', () => ({
  useArchiveStatus: () => ({
    archiveInfo: { lastArchiveDate: new Date(2026, 9, 1), operations: archive.operations },
    operations: archive.operations,
    aggregateCounts: { success: 0, pending: 0, error: 0, warning: 2 },
    intent: 'warning',
    open: true,
    fluentProviderId: 'fp-archive-status',
    handleOpenChange: jest.fn(),
    refresh: jest.fn(),
    shouldHide: false
  })
}))

import { fireEvent, render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { getContrastRatio } from 'pp365-shared-library'
import { ArchiveSection } from '../ArchiveSection'
import { ProjectInformationContextProvider } from '../context'
import { OPEN_DIALOG } from '../reducer'
import { ARCHIVE_STATUS_COLORS } from './ArchiveStatusDetails/useArchiveStatusDetails'

/**
 * The archive section of the project information: its heading, the button that starts a manual
 * archive, and the archive status, a message with the last archiving which opens the operations
 * behind it in a popover.
 */
describe('ArchiveSection', () => {
  it('heads the section at level 3, and opens the operations in a dialog named by them, holding the focus (WCAG 1.3.1, 2.4.3)', () => {
    archive.operations = [
      {
        operation: 'Fasebytte',
        date: new Date(2026, 9, 1),
        message: '',
        documentCount: 2,
        listCount: 0,
        totalItems: 2,
        scopes: [{ scope: 'Dokumenter', count: 2, status: strings.ArchiveLogStatusWarning }]
      }
    ]
    const dispatch = jest.fn()
    render(
      <ProjectInformationContextProvider
        value={{ props: { useArchive: true }, state: {}, dispatch } as any}
      >
        <ArchiveSection />
      </ProjectInformationContextProvider>
    )
    // The section sits under the web part's own heading, as the parent projects do.
    expect(
      screen.getByRole('heading', { level: 3, name: strings.ArchiveSectionTitle })
    ).toBeInTheDocument()
    const dialog = screen.getByRole('dialog', { name: strings.ArchiveStatusHeaderText })
    expect(dialog).toBeInTheDocument()
    expect(popover.trapFocus).toBe(true)
    // The status's colour is its icon's, and the text takes none of its own: in the warning's
    // orange it read 2:1 (WCAG 1.4.3).
    const tag = screen.getByText(strings.ArchiveLogStatusWarning).closest('.fui-Tag') as HTMLElement
    expect(tag.style.color).toBe('')
    expect(tag.querySelector('svg')).toHaveStyle({
      color: ARCHIVE_STATUS_COLORS[strings.ArchiveLogStatusWarning]
    })
    fireEvent.click(screen.getByText(strings.ArchiveStartButtonLabel).closest('button'))
    expect(dispatch).toHaveBeenCalledWith(OPEN_DIALOG('ArchiveDialog'))
  })
})

describe('ARCHIVE_STATUS_COLORS', () => {
  it("gives each status icon 3:1 against the row its tag sits in, where the warning's orange had 1.8:1 (WCAG 1.4.11)", () => {
    // The tag is an outline on the table's row, which is darkest when hovered
    // (colorSubtleBackgroundHover).
    for (const color of Object.values(ARCHIVE_STATUS_COLORS)) {
      expect(getContrastRatio(color, '#f5f5f5')).toBeGreaterThanOrEqual(3)
    }
  })
})
