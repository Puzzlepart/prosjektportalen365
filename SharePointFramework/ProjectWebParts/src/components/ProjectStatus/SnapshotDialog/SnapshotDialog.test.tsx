// jest.mock must come BEFORE the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mock calls are not hoisted. TypeScript keeps statement order, which is what makes this work.
const snapshotUrl = '/sites/pp/Lists/Prosjektstatus/Attachments/12/Snapshot.png'
const title = 'Øyeblikksbilde – mandag 5. okt. 2026'
const mockDialog: Record<string, any> = {}
jest.mock('./useSnapshotDialog', () => ({ useSnapshotDialog: () => mockDialog }))

import * as React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { ProjectStatusContext } from '../context'
import { report } from '../testFixtures'
import { SnapshotDialog } from './SnapshotDialog'

const { useSnapshotDialog } =
  jest.requireActual<typeof import('./useSnapshotDialog')>('./useSnapshotDialog')

/**
 * The snapshot of a published report: the dialog that shows it, its link to the image and its
 * full screen button (against a stand-in for its hook), and the hook's full screen handling
 * against a stand-in for the browser's Fullscreen API, which jsdom lacks.
 */
describe('ProjectStatus SnapshotDialog', () => {
  beforeEach(() => {
    Object.assign(mockDialog, {
      isOpen: true,
      snapshotUrl,
      title,
      surfaceRef: { current: null },
      canFullscreen: true,
      isFullscreen: false,
      toggleFullscreen: jest.fn(),
      openInNewTab: jest.fn(),
      onDismiss: jest.fn()
    })
  })

  it('shows the snapshot image with a button that opens it in a new tab', () => {
    render(<SnapshotDialog />)
    expect(screen.getByAltText(title)).toHaveAttribute('src', snapshotUrl)
    fireEvent.click(screen.getByText(strings.SnapshotOpenInNewTabLabel))
    expect(mockDialog.openInNewTab).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when the close button is clicked', () => {
    render(<SnapshotDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'Lukk' }))
    expect(mockDialog.onDismiss).toHaveBeenCalled()
  })

  it('toggles full screen, and offers the way back once in it', () => {
    const { rerender } = render(<SnapshotDialog />)
    fireEvent.click(screen.getByText(strings.SnapshotEnterFullscreenLabel))
    expect(mockDialog.toggleFullscreen).toHaveBeenCalledTimes(1)
    mockDialog.isFullscreen = true
    rerender(<SnapshotDialog />)
    expect(screen.getByText(strings.SnapshotExitFullscreenLabel)).toBeInTheDocument()
    expect(screen.queryByText(strings.SnapshotEnterFullscreenLabel)).toBeNull()
  })

  it('leaves out the full screen button where the browser does not allow it', () => {
    mockDialog.canFullscreen = false
    render(<SnapshotDialog />)
    expect(screen.queryByText(strings.SnapshotEnterFullscreenLabel)).toBeNull()
  })
})

describe('useSnapshotDialog', () => {
  const dispatch = jest.fn()
  let fullscreenElement: Element = null
  let dialog: ReturnType<typeof useSnapshotDialog>

  const Probe: React.FC = () => {
    dialog = useSnapshotDialog()
    return <div ref={dialog.surfaceRef} />
  }

  function renderDialog(state: Record<string, any>) {
    render(
      <ProjectStatusContext.Provider value={{ state, props: {}, dispatch } as any}>
        <Probe />
      </ProjectStatusContext.Provider>
    )
    dialog.surfaceRef.current.requestFullscreen = jest.fn(() => Promise.resolve())
  }

  function fullscreenChange(element: Element) {
    fullscreenElement = element
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'))
    })
  }

  beforeAll(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement
    })
    document.exitFullscreen = jest.fn(() => Promise.resolve())
  })

  afterAll(() => {
    delete (document as any).fullscreenEnabled
    delete (document as any).fullscreenElement
    delete (document as any).exitFullscreen
  })

  beforeEach(() => {
    fullscreenElement = null
    jest.clearAllMocks()
  })

  it('opens for a report with a snapshot only, titled with its date', () => {
    const withSnapshot = report({}, { snapshotUrl })
    renderDialog({ isSnapshotOpen: true, selectedReport: withSnapshot })
    expect(dialog.isOpen).toBe(true)
    expect(dialog.snapshotUrl).toBe(snapshotUrl)
    expect(dialog.title).toMatch(/^Øyeblikksbilde – .*2026/)
    renderDialog({ isSnapshotOpen: true, selectedReport: report({}) })
    expect(dialog.isOpen).toBe(false)
  })

  it('opens the image in a new tab with window.open, out of reach of SharePoint link handling', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null)
    renderDialog({ isSnapshotOpen: true, selectedReport: report({}, { snapshotUrl }) })
    dialog.openInNewTab()
    expect(open).toHaveBeenCalledWith(snapshotUrl, '_blank', 'noopener')
    open.mockRestore()
  })

  it('takes the surface to full screen and back, following the document', () => {
    renderDialog({ isSnapshotOpen: true, selectedReport: report({}, { snapshotUrl }) })
    expect(dialog.canFullscreen).toBe(true)
    const surface = dialog.surfaceRef.current
    dialog.toggleFullscreen()
    expect(surface.requestFullscreen).toHaveBeenCalledTimes(1)
    fullscreenChange(surface)
    expect(dialog.isFullscreen).toBe(true)
    dialog.toggleFullscreen()
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1)
    // Esc leaves full screen in the browser, without the dialog's own button.
    fullscreenChange(null)
    expect(dialog.isFullscreen).toBe(false)
  })

  it('leaves full screen when it is dismissed', () => {
    renderDialog({ isSnapshotOpen: true, selectedReport: report({}, { snapshotUrl }) })
    fullscreenChange(dialog.surfaceRef.current)
    dialog.onDismiss()
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'CLOSE_SNAPSHOT' }))
  })
})
