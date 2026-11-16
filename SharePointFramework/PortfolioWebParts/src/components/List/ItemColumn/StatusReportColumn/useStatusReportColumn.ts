import {
  mergeClasses,
  OnOpenChangeData,
  OpenPopoverEvents,
  PositioningProps,
  useId
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import {
  format,
  formatDayMonth,
  getScopeSeriesKey,
  getStatusColorClass,
  useFocusContentProps
} from 'pp365-shared-library'
import resource from 'SharedResources'
import {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react'
import { getStatusReportColumnData } from './data'
import { getOpenSurface, setOpenSurface, subscribe } from './previewStore'
import styles from './StatusColumn.module.scss'
import {
  IStatusColumnProps,
  IStatusReport,
  IStatusReportColumnData,
  IStatusReportSection
} from './types'

/** How long the pointer rests on the strip before the details show, in milliseconds. */
const PREVIEW_DELAY = 500

/** How long the details stay once the pointer has left the strip and them, in milliseconds. */
const MOUSE_LEAVE_DELAY = 200

/**
 * Beside the cell, where the details hide no other row's strip; before it, below or above it where
 * there is no room. No arrow: it would be cut off as the details scroll.
 */
const POSITIONING: PositioningProps = {
  position: 'after',
  align: 'top',
  fallbackPositions: ['before', 'below', 'above']
}

/** What a section's status counts as in the strip's name. */
type StatusCountKind = 'red' | 'yellow' | 'other' | 'empty' | 'green'

/** The order the counts are named in: what needs attention first, the green last. */
const COUNT_ORDER: StatusCountKind[] = ['red', 'yellow', 'other', 'empty', 'green']

/** Each count's text for one, and for any other number. */
const COUNT_TEXTS: Record<StatusCountKind, [string, string]> = {
  red: [strings.StatusCountRedOne, strings.StatusCountRedOther],
  yellow: [strings.StatusCountYellowOne, strings.StatusCountYellowOther],
  other: [strings.StatusCountOther, strings.StatusCountOther],
  empty: [strings.StatusCountEmpty, strings.StatusCountEmpty],
  green: [strings.StatusCountGreenOne, strings.StatusCountGreenOther]
}

/** How the details show: not at all, as a preview while the pointer rests, or as a dialog. */
export type StatusReportSurfaceMode = 'closed' | 'preview' | 'pinned'

/** Whether a surface other than this cell's is open: then this cell's closes. */
function isOpenElsewhere(id: string): boolean {
  const open = getOpenSurface()
  return !!open && open.id !== id
}

/** Whether a surface other than this cell's is pinned: then the pointer opens no preview. */
function isPinnedElsewhere(id: string): boolean {
  const open = getOpenSurface()
  return !!open && open.pinned && open.id !== id
}

/**
 * The row's report: the one its `StatusReportId` names, if it is the report of the row's project
 * (the site ids compared in any case) and of the row's report series ("delprosjekt").
 */
function findReport(
  data: IStatusReportColumnData | undefined,
  item: Record<string, any>
): IStatusReport | undefined {
  const siteId = String(item.SiteId ?? '').toLowerCase()
  const seriesKey = getScopeSeriesKey(item.ScopeKey)
  return data?.reports.find(
    (report) =>
      report.id === Number(item.StatusReportId) &&
      report.siteId.toLowerCase() === siteId &&
      getScopeSeriesKey(report.scopeKey) === seriesKey
  )
}

/** The sections counted by colour, in `COUNT_ORDER`: «1 rød, 4 gule, 3 grønne». */
function getStatusCounts(sections: IStatusReportSection[]): string {
  const counts: Partial<Record<StatusCountKind, number>> = {}
  for (const section of sections) {
    const kind: StatusCountKind = section.value ? getStatusColorClass(section.color) : 'empty'
    counts[kind] = (counts[kind] ?? 0) + 1
  }
  const named = COUNT_ORDER.filter((kind) => counts[kind] > 0)
  const texts = named.map((kind) => {
    const [one, other] = COUNT_TEXTS[kind]
    return format(counts[kind] === 1 ? one : other, counts[kind])
  })
  return texts.join(', ')
}

/** The project's status page with the report selected; none without the row's site address. */
function getReportLink(report: IStatusReport, item: Record<string, any>): string | undefined {
  const siteUrl: string = item.Path || item.SPWebUrl
  if (!siteUrl) return undefined
  const pageUrl = `${siteUrl.replace(/\/$/, '')}/${resource.Navigation_ProjectStatus_Url}`
  return `${pageUrl}?selectedReport=${report.id}`
}

/** What the strip and the details tell of a report, in SharePoint's language. */
function getReportTexts(report: IStatusReport, item: Record<string, any>) {
  const day = formatDayMonth(report.publishedDate, true)
  const sentences = report.sections.map((section) => {
    const value = section.value ?? strings.StatusSectionNoValue
    return format(strings.StatusSectionSentence, section.name, value)
  })
  return {
    name: format(strings.StatusReportButtonLabel, day, getStatusCounts(report.sections)),
    description: sentences.join(' '),
    date: formatDayMonth(report.publishedDate),
    reportedText: format(strings.StatusReportedText, day),
    link: getReportLink(report, item)
  }
}

/**
 * Component logic hook for `StatusReportColumn`: the row's report, the strip's name and
 * description, and the details in two modes. The pointer resting on the strip for half a second
 * shows a preview that leaves the focus where it is (where the column's setting allows it). A
 * click, Enter or Space pins the details as a dialog that takes the focus and keeps it until
 * Escape, «Lukk» or a click outside. A click on the strip while the preview shows comes as a
 * close: it pins the details by closing them and opening them again, so Fluent focuses the dialog
 * and makes it modal. One surface is open at a time across the cells (`previewStore`).
 *
 * @param props The cell's props, the column's defaults merged in
 */
export function useStatusReportColumn(props: IStatusColumnProps) {
  const item: Record<string, any> = props.item ?? {}
  const data = getStatusReportColumnData(props.column)
  const report = findReport(data, item)
  const openOnHover = props.openOnHover !== false
  const [mode, setMode] = useState<StatusReportSurfaceMode>('closed')
  const [pendingPin, setPendingPin] = useState(false)
  const openTimer = useRef<number>()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const surfaceId = useId('status-report')
  const descriptionId = useId('status-report-description')
  const titleId = useId('status-report-title')
  const subtitleId = useId('status-report-subtitle')
  const overallId = useId('status-report-overall')
  const focusContent = useFocusContentProps()
  const openElsewhere = useSyncExternalStore(subscribe, () => isOpenElsewhere(surfaceId))

  const onOpenChange = useCallback(
    (event: OpenPopoverEvents, { open }: OnOpenChangeData) => {
      window.clearTimeout(openTimer.current)
      if (open && event.type === 'mouseenter') {
        // A preview once the pointer has rested, unless a cell's details are pinned.
        if (!openOnHover || mode !== 'closed' || isPinnedElsewhere(surfaceId)) return
        openTimer.current = window.setTimeout(() => {
          if (!isPinnedElsewhere(surfaceId)) setMode('preview')
        }, PREVIEW_DELAY)
        return
      }
      if (open) {
        setMode('pinned')
        return
      }
      if (event.type === 'mouseleave') {
        // The pointer has left the strip and the details: a pinned dialog stays.
        if (mode === 'preview') setMode('closed')
        return
      }
      const onTrigger = !!triggerRef.current?.contains(event.target as Node)
      if (mode === 'preview' && event.type === 'click' && onTrigger) {
        // A click on the strip while the preview shows comes as a close, since Fluent's trigger
        // toggles: the details are pinned by closing them and opening them again in the next
        // commit, so Fluent focuses the dialog and makes it modal.
        setPendingPin(true)
      }
      setMode('closed')
    },
    [mode, openOnHover, surfaceId]
  )

  const cancelPendingOpen = useCallback(() => {
    window.clearTimeout(openTimer.current)
  }, [])

  const onClose = useCallback(() => setMode('closed'), [])

  // Escape closes the preview wherever the focus is, unless something has taken the key (the
  // strip's own Escape, a menu's); the key is never taken here.
  useEffect(() => {
    if (mode !== 'preview') return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) setMode('closed')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mode])

  useEffect(() => {
    if (!pendingPin || mode !== 'closed') return
    setPendingPin(false)
    setMode('pinned')
  }, [pendingPin, mode])

  // This cell's surface is the one open across the cells while it is open.
  useEffect(() => {
    if (mode !== 'closed') {
      setOpenSurface({ id: surfaceId, pinned: mode === 'pinned' })
    } else if (getOpenSurface()?.id === surfaceId) {
      setOpenSurface(undefined)
    }
  }, [mode, surfaceId])

  // Another cell's surface has opened: this one closes.
  useEffect(() => {
    if (openElsewhere) setMode('closed')
  }, [openElsewhere])

  useEffect(() => {
    return () => {
      window.clearTimeout(openTimer.current)
      if (getOpenSurface()?.id === surfaceId) setOpenSurface(undefined)
    }
  }, [surfaceId])

  const pinned = mode === 'pinned'
  const texts = report ? getReportTexts(report, item) : undefined
  const surfaceClassName = pinned
    ? mergeClasses(styles.popoverSurface, focusContent.className)
    : styles.popoverSurface

  return {
    report,
    noReport: !!data && !item._hubId && !item.StatusReportId,
    name: texts?.name,
    description: texts?.description,
    date: texts?.date,
    descriptionId,
    triggerRef,
    pinned,
    stripStyle: { '--n': report?.sections.length ?? 0 } as CSSProperties,
    cancelPendingOpen,
    popover: {
      open: mode !== 'closed',
      trapFocus: pinned,
      openOnHover,
      mouseLeaveDelay: MOUSE_LEAVE_DELAY,
      unstable_disableAutoFocus: mode === 'preview',
      closeOnScroll: mode === 'preview',
      positioning: POSITIONING,
      onOpenChange
    },
    surface: {
      className: surfaceClassName,
      tabIndex: pinned ? focusContent.tabIndex : undefined,
      'aria-labelledby': pinned ? `${titleId} ${subtitleId}` : titleId,
      'aria-describedby': pinned && report?.overallStatus ? overallId : undefined
    },
    details: {
      title: item.Title,
      reportedText: texts?.reportedText,
      report,
      overallStatusName: data?.overallStatusName,
      link: texts?.link,
      pinned,
      titleId,
      subtitleId,
      overallId,
      onClose
    }
  }
}
