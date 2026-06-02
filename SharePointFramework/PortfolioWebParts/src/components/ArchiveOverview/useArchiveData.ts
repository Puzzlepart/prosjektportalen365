import '@pnp/sp/items/get-all'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import '@pnp/sp/webs'
import { format } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { useEffect, useState } from 'react'
import { IArchiveOverviewProps } from './types'

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────

const ARCHIVE_LIST_NAME = 'Arkiveringslogg'
const PROJECTS_LIST_NAME = 'Prosjekter'

const getStatusMap = (): Record<string, { label: string; color: string }> => ({
  Arkivert: { label: strings.ArchiveOverview.StatusLabelArchived, color: '#75b964' },
  'Til arkiv': { label: strings.ArchiveOverview.StatusLabelToArchive, color: '#6b8fba' },
  Feil: { label: strings.ArchiveOverview.StatusLabelFailed, color: '#de534a' },
  Advarsel: { label: strings.ArchiveOverview.StatusLabelWarning, color: '#efc33d' }
})

const STATUS_ORDER = ['Arkivert', 'Til arkiv', 'Feil', 'Advarsel']

const PROJECT_COLORS = [
  '#107C10',
  '#0078D4',
  '#7719AA',
  '#FFB900',
  '#D13438',
  '#00B7C3',
  '#038387',
  '#8764B8',
  '#69797E',
  '#C239B3'
]

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface IArchiveLogItem {
  Id: number
  Created: string
  GtLogWebUrl: string
  GtLogStatus: string
}

interface IProjectItem {
  Id: number
  Title: string
  GtSiteUrl: string
}

export type ActivityLevel = 'high' | 'medium' | 'low' | 'none'
export type ProjectStatus = 'updated' | 'warning' | 'never'

export interface IProjectSummary {
  id: number
  name: string
  color: string
  siteUrl: string
  lastArchived: string
  lastArchivedMs: number
  activity: ActivityLevel
  status: ProjectStatus
  nextArchive: string
  archivedCount: number
  pendingCount: number
  failedCount: number
}

export interface IArchiveStatusEntry {
  label: string
  count: number
  percent: number
  color: string
}

export interface IQuickStat {
  label: string
  value: number
  positive: boolean
}

export interface IPendingCounts {
  toArchive: { count: number }
  failed: { count: number }
}

export interface IArchiveData {
  loading: boolean
  error: Error | null
  pending: IPendingCounts
  archiveStatus: IArchiveStatusEntry[]
  archiveTotal: number
  projects: IProjectSummary[]
  quickStats: IQuickStat[]
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

function extractSiteName(url: string): string {
  if (!url) return ''
  const match = url.match(/\/sites\/([^/?#]+)/)
  return match ? match[1].toLowerCase() : url.toLowerCase()
}

function formatArchiveDate(dateStr: string): string {
  if (!dateStr) return strings.ArchiveOverview.NeverArchivedLabel
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`

  if (diffDays === 0) return format(strings.ArchiveOverview.TodayAtLabel, timeStr)
  if (diffDays === 1) return format(strings.ArchiveOverview.YesterdayAtLabel, timeStr)
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getActivityLevel(lastArchivedMs: number): ActivityLevel {
  if (!lastArchivedMs) return 'none'
  const diffDays = (Date.now() - lastArchivedMs) / (1000 * 60 * 60 * 24)
  if (diffDays <= 1) return 'high'
  if (diffDays <= 7) return 'medium'
  if (diffDays <= 30) return 'low'
  return 'none'
}

function getProjectStatus(siteItems: IArchiveLogItem[]): ProjectStatus {
  if (!siteItems.length) return 'never'
  if (siteItems.some((i) => i.GtLogStatus === 'Feil' || i.GtLogStatus === 'Advarsel'))
    return 'warning'
  return 'updated'
}

// ─────────────────────────────────────────────────────
// Data processing
// ─────────────────────────────────────────────────────

function processData(
  projectItems: IProjectItem[],
  archiveItems: IArchiveLogItem[]
): Omit<IArchiveData, 'loading' | 'error'> {
  const statusMap = getStatusMap()

  const archiveMap = new Map<string, IArchiveLogItem[]>()
  for (const item of archiveItems) {
    const key = extractSiteName(item.GtLogWebUrl)
    if (!key) continue
    if (!archiveMap.has(key)) archiveMap.set(key, [])
    archiveMap.get(key).push(item)
  }

  const statusCounts: Record<string, number> = {}
  for (const item of archiveItems) {
    const s = item.GtLogStatus ?? 'Ukjent'
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
  }

  const archiveTotal = archiveItems.length

  const archiveStatus: IArchiveStatusEntry[] = STATUS_ORDER.map((key) => ({
    label: statusMap[key]?.label ?? key,
    count: statusCounts[key] ?? 0,
    percent:
      archiveTotal > 0
        ? Math.round(((statusCounts[key] ?? 0) / archiveTotal) * 1000) / 10
        : 0,
    color: statusMap[key]?.color ?? '#888'
  })).filter((s) => s.count > 0)

  const pending: IPendingCounts = {
    toArchive: { count: statusCounts['Til arkiv'] ?? 0 },
    failed: { count: statusCounts['Feil'] ?? 0 }
  }

  const projects: IProjectSummary[] = projectItems.map((proj, idx) => {
    const key = extractSiteName(proj.GtSiteUrl)
    const siteItems = archiveMap.get(key) ?? []

    const latestMs =
      siteItems.length > 0
        ? Math.max(...siteItems.map((i) => new Date(i.Created).getTime()))
        : 0

    const latestDate = latestMs > 0 ? new Date(latestMs).toISOString() : ''

    return {
      id: proj.Id,
      name: proj.Title || key || '(ukjent)',
      color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
      siteUrl: proj.GtSiteUrl || '',
      lastArchived: latestDate
        ? formatArchiveDate(latestDate)
        : strings.ArchiveOverview.NeverArchivedLabel,
      lastArchivedMs: latestMs,
      activity: getActivityLevel(latestMs),
      status: getProjectStatus(siteItems),
      nextArchive: '–',
      archivedCount: siteItems.filter((i) => i.GtLogStatus === 'Arkivert').length,
      pendingCount: siteItems.filter((i) => i.GtLogStatus === 'Til arkiv').length,
      failedCount: siteItems.filter((i) => i.GtLogStatus === 'Feil').length
    }
  })

  projects.sort((a, b) => {
    if (a.lastArchivedMs > 0 && b.lastArchivedMs > 0)
      return b.lastArchivedMs - a.lastArchivedMs
    if (a.lastArchivedMs > 0) return -1
    if (b.lastArchivedMs > 0) return 1
    return a.name.localeCompare(b.name, 'nb')
  })

  // ── Quick stats ──
  const quickStats: IQuickStat[] = [
    {
      label: strings.ArchiveOverview.QuickStatArchivedLabel,
      value: statusCounts['Arkivert'] ?? 0,
      positive: true
    },
    {
      label: strings.ArchiveOverview.QuickStatToArchiveLabel,
      value: statusCounts['Til arkiv'] ?? 0,
      positive: true
    },
    {
      label: strings.ArchiveOverview.QuickStatFailedLabel,
      value: statusCounts['Feil'] ?? 0,
      positive: (statusCounts['Feil'] ?? 0) === 0
    },
    {
      label: strings.ArchiveOverview.QuickStatWarningLabel,
      value: statusCounts['Advarsel'] ?? 0,
      positive: false
    }
  ]

  return { pending, archiveStatus, archiveTotal, projects, quickStats }
}

// ─────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────

const INITIAL_STATE: IArchiveData = {
  loading: true,
  error: null,
  pending: { toArchive: { count: 0 }, failed: { count: 0 } },
  archiveStatus: [],
  archiveTotal: 0,
  projects: [],
  quickStats: []
}

export function useArchiveData(props: IArchiveOverviewProps): IArchiveData {
  const [state, setState] = useState<IArchiveData>(INITIAL_STATE)

  useEffect(() => {
    if (!props.sp) return

    Promise.all([
      props.sp.web.lists
        .getByTitle(ARCHIVE_LIST_NAME)
        .items.select('Id', 'Created', 'GtLogWebUrl', 'GtLogStatus')
        .getAll() as Promise<IArchiveLogItem[]>,
      props.sp.web.lists
        .getByTitle(PROJECTS_LIST_NAME)
        .items.select('Id', 'Title', 'GtSiteUrl')
        .getAll() as Promise<IProjectItem[]>
    ])
      .then(([archiveItems, projectItems]) => {
        setState({ loading: false, error: null, ...processData(projectItems, archiveItems) })
      })
      .catch((error: Error) => {
        setState((prev) => ({ ...prev, loading: false, error }))
      })
  }, [])

  return state
}
