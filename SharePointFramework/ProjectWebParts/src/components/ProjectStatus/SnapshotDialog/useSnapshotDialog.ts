import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { StatusReport } from 'pp365-shared-library/lib/models'
import { formatDate, getUrlParam } from 'pp365-shared-library/lib/util'
import { useEffect, useRef, useState } from 'react'
import { useProjectStatusContext } from '../context'
import { CLOSE_SNAPSHOT, OPEN_SNAPSHOT } from '../reducer'
import { CopyLinkStatus } from './CopyLinkDialog'

/**
 * URL parameter that opens the snapshot of the report named by `selectedReport` on load.
 */
export const SNAPSHOT_URL_PARAM = 'snapshot'

/**
 * Link to this page that opens with the report selected and its snapshot shown, for the
 * report's series when it belongs to a sub-project ("delprosjekt").
 *
 * @param report The report whose snapshot the link shows
 */
function getSnapshotPageLink(report: StatusReport): string {
  const scope = report.scopeKey ? `&scope=${encodeURIComponent(report.scopeKey)}` : ''
  const { origin, pathname } = window.location
  return `${origin}${pathname}?selectedReport=${report.id}${scope}&${SNAPSHOT_URL_PARAM}=1`
}

/**
 * Component logic hook for `SnapshotDialog`. Provides the snapshot URL and title of the
 * selected report, whether the dialog is open, the dismiss handler, the browser's full
 * screen mode for the dialog surface, and copying links to the snapshot. Opens the dialog
 * on load for a link made by `getSnapshotPageLink`.
 */
export function useSnapshotDialog() {
  const { state, dispatch } = useProjectStatusContext()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const urlParamHandledRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCopyLinkOpen, setIsCopyLinkOpen] = useState(false)
  const [copyLinkStatus, setCopyLinkStatus] = useState<CopyLinkStatus>()
  const report = state.selectedReport
  const snapshotUrl = report?.snapshotUrl
  // The file URL is server relative; a link to share has to work outside the page.
  const imageLink = snapshotUrl ? new URL(snapshotUrl, window.location.origin).href : ''
  const pageLink = snapshotUrl ? getSnapshotPageLink(report) : ''

  useEffect(() => {
    // Decided once, on the first load: a refetch (after publishing or editing) must not reopen
    // a snapshot the user has closed.
    if (urlParamHandledRef.current || !state.isDataLoaded) return
    urlParamHandledRef.current = true
    const reportId = parseInt(getUrlParam('selectedReport'), 10)
    if (getUrlParam(SNAPSHOT_URL_PARAM) === '1' && snapshotUrl && report?.id === reportId) {
      dispatch(OPEN_SNAPSHOT())
    }
  }, [state.isDataLoaded])

  useEffect(() => {
    // Esc and the browser's own controls leave full screen too, so follow the document.
    const onFullscreenChange = () =>
      setIsFullscreen(!!surfaceRef.current && document.fullscreenElement === surfaceRef.current)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function exitFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) exitFullscreen()
    else void surfaceRef.current?.requestFullscreen().catch(() => undefined)
  }

  async function copy(link: string) {
    setCopyLinkStatus(undefined)
    setIsCopyLinkOpen(true)
    try {
      await navigator.clipboard.writeText(link)
      setCopyLinkStatus('copied')
    } catch {
      // No clipboard outside a secure context or in an iframe without clipboard-write; the
      // dialog then shows the links to copy by hand.
      setCopyLinkStatus('failed')
    }
  }

  return {
    isOpen: !!state.isSnapshotOpen && !!snapshotUrl,
    snapshotUrl,
    pageLink,
    imageLink,
    title: format(
      strings.SnapshotDialogTitle,
      formatDate(report?.publishedDate ?? report?.modified, true)
    ),
    surfaceRef,
    // False in an iframe without `allow="fullscreen"`, such as some Teams hosts.
    canFullscreen: document.fullscreenEnabled === true,
    isFullscreen,
    toggleFullscreen,
    // window.open rather than a link: SharePoint intercepts clicks on links to its own pages and
    // files and navigates in the same tab, `target="_blank"` notwithstanding.
    openInNewTab: () => window.open(snapshotUrl, '_blank', 'noopener'),
    isCopyLinkOpen,
    copyLinkStatus,
    copyPageLink: () => copy(pageLink),
    copyImageLink: () => copy(imageLink),
    dismissCopyLink: () => setIsCopyLinkOpen(false),
    onDismiss: () => {
      exitFullscreen()
      dispatch(CLOSE_SNAPSHOT())
    }
  }
}
