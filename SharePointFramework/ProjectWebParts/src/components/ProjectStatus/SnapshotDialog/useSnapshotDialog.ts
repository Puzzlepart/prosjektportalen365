import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import { useEffect, useRef, useState } from 'react'
import { useProjectStatusContext } from '../context'
import { CLOSE_SNAPSHOT } from '../reducer'

/**
 * Component logic hook for `SnapshotDialog`. Provides the snapshot URL and title of the
 * selected report, whether the dialog is open, the dismiss handler, and the browser's
 * full screen mode for the dialog surface.
 */
export function useSnapshotDialog() {
  const { state, dispatch } = useProjectStatusContext()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const report = state.selectedReport
  const snapshotUrl = report?.snapshotUrl

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

  return {
    isOpen: !!state.isSnapshotOpen && !!snapshotUrl,
    snapshotUrl,
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
    onDismiss: () => {
      exitFullscreen()
      dispatch(CLOSE_SNAPSHOT())
    }
  }
}
