import '@pnp/sp/items/get-all'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import '@pnp/sp/webs'
import { Web } from '@pnp/sp/webs'
import { useEffect, useState } from 'react'
import { IArchiveOverviewProps } from './types'

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────

const ARCHIVE_SITE_URL = 'https://q6nk.sharepoint.com/sites/prosjektportalen'
const ARCHIVE_LIST_NAME = 'Arkiveringslogg'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Arkivert: { label: 'Arkivert', color: '#107C10' },
  'Til arkiv': { label: 'Til arkiv', color: '#0078D4' },
  Feil: { label: 'Feilet', color: '#D13438' },
  Advarsel: { label: 'Advarsel', color: '#FFB900' }
}

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

export type ActivityLevel = 'high' | 'medium' | 'low' | 'none'
export type ProjectStatus = 'updated' | 'warning' | 'never'

export interface IProjectSummary {
  id: number
  name: string
  color: string
  lastArchived: string
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
  if (!url) return '(ukjent)'
  const match = url.match(/\/sites\/([^/?#]+)/)
  return match ? match[1] : url
}

function formatArchiveDate(dateStr: string): string {
  if (!dateStr) return 'Aldri arkivert'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`

  if (diffDays === 0) return `i dag, ${timeStr}`
  if (diffDays === 1) return `i går, ${timeStr}`
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

function processItems(
  items: IArchiveLogItem[]
): Omit<IArchiveData, 'loading' | 'error'> {
  // ── Status counts (for donut + quick stats) ──
  const statusCounts: Record<string, number> = {}
  for (const item of items) {
    const s = item.GtLogStatus ?? 'Ukjent'
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
  }

  const total = items.length

  const archiveStatus: IArchiveStatusEntry[] = STATUS_ORDER.map((key) => ({
    label: STATUS_MAP[key]?.label ?? key,
    count: statusCounts[key] ?? 0,
    percent:
      total > 0
        ? Math.round(((statusCounts[key] ?? 0) / total) * 1000) / 10
        : 0,
    color: STATUS_MAP[key]?.color ?? '#888'
  })).filter((s) => s.count > 0)

  // ── Pending ──
  const pending: IPendingCounts = {
    toArchive: { count: statusCounts['Til arkiv'] ?? 0 },
    failed: { count: statusCounts['Feil'] ?? 0 }
  }

  // ── Group by site ──
  const siteMap = new Map<string, IArchiveLogItem[]>()
  for (const item of items) {
    const name = extractSiteName(item.GtLogWebUrl)
    if (!siteMap.has(name)) siteMap.set(name, [])
    siteMap.get(name).push(item)
  }

  // ── Build project summaries ──
  let colorIdx = 0
  const projects: IProjectSummary[] = []

  for (const [siteName, siteItems] of Array.from(siteMap.entries())) {
    const sorted = [...siteItems].sort(
      (a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime()
    )
    const latestDate = sorted[0]?.Created
    const latestMs = latestDate ? new Date(latestDate).getTime() : 0

    projects.push({
      id: colorIdx + 1,
      name: siteName,
      color: PROJECT_COLORS[colorIdx % PROJECT_COLORS.length],
      lastArchived: latestDate ? formatArchiveDate(latestDate) : 'Aldri arkivert',
      activity: getActivityLevel(latestMs),
      status: getProjectStatus(siteItems),
      nextArchive: '–',
      archivedCount: siteItems.filter((i) => i.GtLogStatus === 'Arkivert').length,
      pendingCount: siteItems.filter((i) => i.GtLogStatus === 'Til arkiv').length,
      failedCount: siteItems.filter((i) => i.GtLogStatus === 'Feil').length
    })
    colorIdx++
  }

  // Sort: most recently archived first, never-archived last
  projects.sort((a, b) => {
    if (a.activity === 'none' && b.activity !== 'none') return 1
    if (a.activity !== 'none' && b.activity === 'none') return -1
    return 0
  })

  // ── Quick stats ──
  const quickStats: IQuickStat[] = [
    {
      label: 'Elementer arkivert',
      value: statusCounts['Arkivert'] ?? 0,
      positive: true
    },
    {
      label: 'Til arkivering',
      value: statusCounts['Til arkiv'] ?? 0,
      positive: true
    },
    {
      label: 'Feilede elementer',
      value: statusCounts['Feil'] ?? 0,
      positive: (statusCounts['Feil'] ?? 0) === 0
    },
    {
      label: 'Elementer med advarsel',
      value: statusCounts['Advarsel'] ?? 0,
      positive: false
    }
  ]

  return { pending, archiveStatus, archiveTotal: total, projects, quickStats }
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

    const archiveWeb = Web([props.sp.web, ARCHIVE_SITE_URL])

    archiveWeb.lists
      .getByTitle(ARCHIVE_LIST_NAME)
      .items.select('Id', 'Created', 'GtLogWebUrl', 'GtLogStatus')
      .getAll()
      .then((items: IArchiveLogItem[]) => {
        setState({ loading: false, error: null, ...processItems(items) })
      })
      .catch((error: Error) => {
        setState((prev) => ({ ...prev, loading: false, error }))
      })
  }, [])

  return state
}
