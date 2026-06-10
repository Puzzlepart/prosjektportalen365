import { IColumn } from '@fluentui/react'
import { customLightTheme, IFilterPanelProps, ListMenuItem } from 'pp365-shared-library'
import { IFilterItemProps, IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import strings from 'PortfolioWebPartsStrings'
import { useMemo, useState } from 'react'
import { IArchiveOverviewProps } from './types'
import { useArchiveData } from './useArchiveData'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scaleThemeFonts(theme: any, factor: number): any {
  const scaled: Record<string, string> = {}
  for (const key of Object.keys(theme)) {
    const val: unknown = theme[key]
    if (
      (key.startsWith('fontSize') || key.startsWith('lineHeight')) &&
      typeof val === 'string' &&
      val.endsWith('px')
    ) {
      scaled[key] = `${Math.round(parseFloat(val) * factor)}px`
    }
  }
  return { ...theme, ...scaled }
}

export const scaledTheme = scaleThemeFonts(customLightTheme, 1.3)

const ACTIVITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 }
const STATUS_ORDER: Record<string, number> = { updated: 2, warning: 1, never: 0 }

// ─────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────

export function useArchiveOverview(props: IArchiveOverviewProps) {
  const [selectedNav, setSelectedNav] = useState<string>('oversikt')
  const [dayRange, setDayRange] = useState<number>(30)
  const archiveData = useArchiveData(props, dayRange)
  const { projects, documentItems, listItems, logItems } = archiveData

  // ── Project sort ──────────────────────────────────────
  const [projectSort, setProjectSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({
    col: 'lastArchived',
    dir: 'desc'
  })

  const handleProjectSort = (col: string) =>
    setProjectSort((prev) => ({
      col,
      dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc'
    }))

  const sortArrow = (col: string) =>
    projectSort.col === col ? (projectSort.dir === 'asc' ? ' ↑' : ' ↓') : ''

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) => {
        const d = projectSort.dir === 'asc' ? 1 : -1
        switch (projectSort.col) {
          case 'name':         return d * a.name.localeCompare(b.name, 'nb')
          case 'lastArchived': return d * (a.lastArchivedMs - b.lastArchivedMs)
          case 'activity':     return d * ((ACTIVITY_ORDER[a.activity] ?? 0) - (ACTIVITY_ORDER[b.activity] ?? 0))
          case 'status':       return d * ((STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0))
          default:             return 0
        }
      }),
    [projects, projectSort]
  )

  // ── Dokumenter toolbar ────────────────────────────────
  const [dokumenterSearch, setDokumenterSearch] = useState('')
  const [dokumenterActiveFilters, setDokumenterActiveFilters] = useState<Record<string, string[]>>({})
  const [isDokumenterFilterOpen, setIsDokumenterFilterOpen] = useState(false)

  const dokumenterFilterData: IFilterProps[] = [
    {
      column: { key: 'status', name: strings.ArchiveOverview.ColumnStatus, fieldName: 'status', minWidth: 0 } as IColumn,
      items: [
        { name: strings.ArchiveOverview.StatusLabelArchived,  value: 'Arkivert',  selected: dokumenterActiveFilters.status?.includes('Arkivert')  ?? false },
        { name: strings.ArchiveOverview.StatusLabelToArchive, value: 'Til arkiv', selected: dokumenterActiveFilters.status?.includes('Til arkiv') ?? false },
        { name: strings.ArchiveOverview.StatusLabelFailed,    value: 'Feil',      selected: dokumenterActiveFilters.status?.includes('Feil')      ?? false },
        { name: strings.ArchiveOverview.StatusLabelWarning,   value: 'Advarsel',  selected: dokumenterActiveFilters.status?.includes('Advarsel')  ?? false },
      ]
    }
  ]

  const handleDokumenterFilterChange = (column: IColumn, selectedItems: IFilterItemProps[]) => {
    setDokumenterActiveFilters((prev) => ({
      ...prev,
      [column.fieldName]: selectedItems.filter((i) => i.selected).map((i) => i.value)
    }))
  }

  const filteredDocs = useMemo(
    () =>
      documentItems
        .filter((d) => !dokumenterSearch || d.projectName.toLowerCase().includes(dokumenterSearch.toLowerCase()) || d.title.toLowerCase().includes(dokumenterSearch.toLowerCase()))
        .filter((d) => !dokumenterActiveFilters.status?.length || dokumenterActiveFilters.status.includes(d.status)),
    [documentItems, dokumenterSearch, dokumenterActiveFilters]
  )

  const handleExportDokumenter = () => {
    ExcelExportService.configure({ name: strings.ArchiveOverview.NavDokumenter })
    const exportCols: IColumn[] = [
      { key: 'projectName',  name: strings.ArchiveOverview.ColumnProjectName,  fieldName: 'projectName',  minWidth: 0 },
      { key: 'title',        name: strings.ArchiveOverview.ColumnDocument,      fieldName: 'title',        minWidth: 0 },
      { key: 'dateArchived', name: strings.ArchiveOverview.ColumnDateArchived,  fieldName: 'dateArchived', minWidth: 0 },
      { key: 'status',       name: strings.ArchiveOverview.ColumnStatus,        fieldName: 'status',       minWidth: 0 },
    ]
    ExcelExportService.export(filteredDocs, exportCols)
  }

  const dokumenterToolbarItems: ListMenuItem[] = [
    new ListMenuItem().setSearchBox({
      placeholder: strings.ArchiveOverview.DokumenterSearchPlaceholder,
      onChange:    (_, data) => setDokumenterSearch(data?.value ?? ''),
      value:       dokumenterSearch,
    }),
  ]

  const dokumenterFarItems: ListMenuItem[] = [
    new ListMenuItem(null, strings.ArchiveOverview.FilterButtonLabel)
      .setIcon('Filter')
      .setOnClick(() => setIsDokumenterFilterOpen(true)),
    new ListMenuItem(null, strings.ArchiveOverview.ExportButtonLabel)
      .setIcon('ExcelLogoInverse')
      .setStyle({ color: '#10793F' })
      .setOnClick(handleExportDokumenter),
  ]

  const dokumenterFilterPanelProps: IFilterPanelProps = {
    isOpen:         isDokumenterFilterOpen,
    onDismiss:      () => setIsDokumenterFilterOpen(false),
    filters:        dokumenterFilterData,
    onFilterChange: handleDokumenterFilterChange,
  }

  // ── Lister toolbar ────────────────────────────────────
  const [listerSearch, setListerSearch] = useState('')
  const [listerActiveFilters, setListerActiveFilters] = useState<Record<string, string[]>>({})
  const [isListerFilterOpen, setIsListerFilterOpen] = useState(false)

  const listerFilterData: IFilterProps[] = [
    {
      column: { key: 'status', name: strings.ArchiveOverview.ColumnStatus, fieldName: 'status', minWidth: 0 } as IColumn,
      items: [
        { name: strings.ArchiveOverview.StatusLabelArchived,  value: 'Arkivert',  selected: listerActiveFilters.status?.includes('Arkivert')  ?? false },
        { name: strings.ArchiveOverview.StatusLabelToArchive, value: 'Til arkiv', selected: listerActiveFilters.status?.includes('Til arkiv') ?? false },
        { name: strings.ArchiveOverview.StatusLabelFailed,    value: 'Feil',      selected: listerActiveFilters.status?.includes('Feil')      ?? false },
        { name: strings.ArchiveOverview.StatusLabelWarning,   value: 'Advarsel',  selected: listerActiveFilters.status?.includes('Advarsel')  ?? false },
      ]
    }
  ]

  const handleListerFilterChange = (column: IColumn, selectedItems: IFilterItemProps[]) => {
    setListerActiveFilters((prev) => ({
      ...prev,
      [column.fieldName]: selectedItems.filter((i) => i.selected).map((i) => i.value)
    }))
  }

  const filteredLists = useMemo(
    () =>
      listItems
        .filter((i) => !listerSearch || i.projectName.toLowerCase().includes(listerSearch.toLowerCase()) || i.title.toLowerCase().includes(listerSearch.toLowerCase()))
        .filter((i) => !listerActiveFilters.status?.length || listerActiveFilters.status.includes(i.status)),
    [listItems, listerSearch, listerActiveFilters]
  )

  const handleExportLister = () => {
    ExcelExportService.configure({ name: strings.ArchiveOverview.NavLister })
    const exportCols: IColumn[] = [
      { key: 'projectName',  name: strings.ArchiveOverview.ColumnProjectName,  fieldName: 'projectName',  minWidth: 0 },
      { key: 'title',        name: strings.ArchiveOverview.ColumnList,          fieldName: 'title',        minWidth: 0 },
      { key: 'dateArchived', name: strings.ArchiveOverview.ColumnDateArchived,  fieldName: 'dateArchived', minWidth: 0 },
      { key: 'status',       name: strings.ArchiveOverview.ColumnStatus,        fieldName: 'status',       minWidth: 0 },
    ]
    ExcelExportService.export(filteredLists, exportCols)
  }

  const listerToolbarItems: ListMenuItem[] = [
    new ListMenuItem().setSearchBox({
      placeholder: strings.ArchiveOverview.ListerSearchPlaceholder,
      onChange:    (_, data) => setListerSearch(data?.value ?? ''),
      value:       listerSearch,
    }),
  ]

  const listerFarItems: ListMenuItem[] = [
    new ListMenuItem(null, strings.ArchiveOverview.FilterButtonLabel)
      .setIcon('Filter')
      .setOnClick(() => setIsListerFilterOpen(true)),
    new ListMenuItem(null, strings.ArchiveOverview.ExportButtonLabel)
      .setIcon('ExcelLogoInverse')
      .setStyle({ color: '#10793F' })
      .setOnClick(handleExportLister),
  ]

  const listerFilterPanelProps: IFilterPanelProps = {
    isOpen:         isListerFilterOpen,
    onDismiss:      () => setIsListerFilterOpen(false),
    filters:        listerFilterData,
    onFilterChange: handleListerFilterChange,
  }

  // ── Prosjekter toolbar ────────────────────────────────
  const [prosjekterSearch, setProsjekterSearch] = useState('')
  const [prosjekterActiveFilters, setProsjekterActiveFilters] = useState<Record<string, string[]>>({})
  const [isProsjekterFilterOpen, setIsProsjekterFilterOpen] = useState(false)

  const prosjekterFilterData: IFilterProps[] = [
    {
      column: { key: 'status', name: strings.ArchiveOverview.ColumnStatus, fieldName: 'status', minWidth: 0 } as IColumn,
      items: [
        { name: strings.ArchiveOverview.StatusUpdated,       value: 'updated', selected: prosjekterActiveFilters.status?.includes('updated') ?? false },
        { name: strings.ArchiveOverview.StatusWarning,       value: 'warning', selected: prosjekterActiveFilters.status?.includes('warning') ?? false },
        { name: strings.ArchiveOverview.StatusNeverArchived, value: 'never',   selected: prosjekterActiveFilters.status?.includes('never')   ?? false },
      ]
    },
    {
      column: { key: 'activity', name: strings.ArchiveOverview.ColumnActivityLevel, fieldName: 'activity', minWidth: 0 } as IColumn,
      items: [
        { name: strings.ArchiveOverview.ActivityHigh,   value: 'high',   selected: prosjekterActiveFilters.activity?.includes('high')   ?? false },
        { name: strings.ArchiveOverview.ActivityMedium, value: 'medium', selected: prosjekterActiveFilters.activity?.includes('medium') ?? false },
        { name: strings.ArchiveOverview.ActivityLow,    value: 'low',    selected: prosjekterActiveFilters.activity?.includes('low')    ?? false },
        { name: strings.ArchiveOverview.ActivityNone,   value: 'none',   selected: prosjekterActiveFilters.activity?.includes('none')   ?? false },
      ]
    }
  ]

  const handleProsjekterFilterChange = (column: IColumn, selectedItems: IFilterItemProps[]) => {
    setProsjekterActiveFilters((prev) => ({
      ...prev,
      [column.fieldName]: selectedItems.filter((i) => i.selected).map((i) => i.value)
    }))
  }

  const filteredProjects = useMemo(
    () =>
      sortedProjects
        .filter((p) => !prosjekterSearch || p.name.toLowerCase().includes(prosjekterSearch.toLowerCase()))
        .filter((p) => {
          if (prosjekterActiveFilters.status?.length && !prosjekterActiveFilters.status.includes(p.status)) return false
          if (prosjekterActiveFilters.activity?.length && !prosjekterActiveFilters.activity.includes(p.activity)) return false
          return true
        }),
    [sortedProjects, prosjekterSearch, prosjekterActiveFilters]
  )

  const handleExportProsjekter = () => {
    ExcelExportService.configure({ name: strings.ArchiveOverview.NavProsjekter })
    const exportCols: IColumn[] = [
      { key: 'name',          name: strings.ArchiveOverview.ColumnProjectName,  fieldName: 'name',          minWidth: 0 },
      { key: 'lastArchived',  name: strings.ArchiveOverview.ColumnLastArchived,  fieldName: 'lastArchived',  minWidth: 0 },
      { key: 'activityLabel', name: strings.ArchiveOverview.ColumnActivityLevel, fieldName: 'activityLabel', minWidth: 0 },
      { key: 'statusLabel',   name: strings.ArchiveOverview.ColumnStatus,        fieldName: 'statusLabel',   minWidth: 0 },
      { key: 'nextArchive',   name: strings.ArchiveOverview.ColumnNextArchive,   fieldName: 'nextArchive',   minWidth: 0 },
    ]
    const exportItems = filteredProjects.map((p) => ({
      name:          p.name,
      lastArchived:  p.lastArchived,
      activityLabel: p.activity === 'high'   ? strings.ArchiveOverview.ActivityHigh
                   : p.activity === 'medium' ? strings.ArchiveOverview.ActivityMedium
                   : p.activity === 'low'    ? strings.ArchiveOverview.ActivityLow
                                             : strings.ArchiveOverview.ActivityNone,
      statusLabel:   p.status === 'updated' ? strings.ArchiveOverview.StatusUpdated
                   : p.status === 'warning' ? strings.ArchiveOverview.StatusWarning
                                            : strings.ArchiveOverview.StatusNeverArchived,
      nextArchive:   p.nextArchive,
    }))
    ExcelExportService.export(exportItems, exportCols)
  }

  const prosjekterToolbarItems: ListMenuItem[] = [
    new ListMenuItem().setSearchBox({
      placeholder: strings.ArchiveOverview.ProsjekterSearchPlaceholder,
      onChange:    (_, data) => setProsjekterSearch(data?.value ?? ''),
      value:       prosjekterSearch,
    }),
  ]

  const prosjekterFarItems: ListMenuItem[] = [
    new ListMenuItem(null, strings.ArchiveOverview.FilterButtonLabel)
      .setIcon('Filter')
      .setOnClick(() => setIsProsjekterFilterOpen(true)),
    new ListMenuItem(null, strings.ArchiveOverview.ExportButtonLabel)
      .setIcon('ExcelLogoInverse')
      .setStyle({ color: '#10793F' })
      .setOnClick(handleExportProsjekter),
  ]

  const prosjekterFilterPanelProps: IFilterPanelProps = {
    isOpen:         isProsjekterFilterOpen,
    onDismiss:      () => setIsProsjekterFilterOpen(false),
    filters:        prosjekterFilterData,
    onFilterChange: handleProsjekterFilterChange,
  }

  // ── Arkivlogg toolbar ─────────────────────────────────
  const [arkivloggSearch, setArkivloggSearch] = useState('')
  const [arkivloggActiveFilters, setArkivloggActiveFilters] = useState<Record<string, string[]>>({})
  const [isArkivloggFilterOpen, setIsArkivloggFilterOpen] = useState(false)

  const arkivloggFilterData: IFilterProps[] = [
    {
      column: { key: 'status', name: strings.ArchiveOverview.ColumnStatus, fieldName: 'status', minWidth: 0 } as IColumn,
      items: [
        { name: strings.ArchiveOverview.StatusLabelArchived,  value: 'Arkivert',  selected: arkivloggActiveFilters.status?.includes('Arkivert')  ?? false },
        { name: strings.ArchiveOverview.StatusLabelToArchive, value: 'Til arkiv', selected: arkivloggActiveFilters.status?.includes('Til arkiv') ?? false },
        { name: strings.ArchiveOverview.StatusLabelFailed,    value: 'Feil',      selected: arkivloggActiveFilters.status?.includes('Feil')      ?? false },
        { name: strings.ArchiveOverview.StatusLabelWarning,   value: 'Advarsel',  selected: arkivloggActiveFilters.status?.includes('Advarsel')  ?? false },
      ]
    },
    {
      column: { key: 'scope', name: strings.ArchiveOverview.ColumnScope, fieldName: 'scope', minWidth: 0 } as IColumn,
      items: [
        { name: strings.ArchiveOverview.ScopeLabelDocument, value: 'Dokument', selected: arkivloggActiveFilters.scope?.includes('Dokument') ?? false },
        { name: strings.ArchiveOverview.ScopeLabelList,     value: 'Liste',    selected: arkivloggActiveFilters.scope?.includes('Liste')    ?? false },
      ]
    }
  ]

  const handleArkivloggFilterChange = (column: IColumn, selectedItems: IFilterItemProps[]) => {
    setArkivloggActiveFilters((prev) => ({
      ...prev,
      [column.fieldName]: selectedItems.filter((i) => i.selected).map((i) => i.value)
    }))
  }

  const filteredLog = useMemo(
    () =>
      logItems
        .filter((i) => !arkivloggSearch ||
          i.projectName.toLowerCase().includes(arkivloggSearch.toLowerCase()) ||
          i.title.toLowerCase().includes(arkivloggSearch.toLowerCase()))
        .filter((i) => !arkivloggActiveFilters.status?.length || arkivloggActiveFilters.status.includes(i.status))
        .filter((i) => !arkivloggActiveFilters.scope?.length  || arkivloggActiveFilters.scope.includes(i.scope)),
    [logItems, arkivloggSearch, arkivloggActiveFilters]
  )

  const handleExportArkivlogg = () => {
    ExcelExportService.configure({ name: strings.ArchiveOverview.NavArkivlogg })
    const exportCols: IColumn[] = [
      { key: 'projectName',  name: strings.ArchiveOverview.ColumnProjectName,  fieldName: 'projectName',  minWidth: 0 },
      { key: 'title',        name: strings.ArchiveOverview.ColumnElement,       fieldName: 'title',        minWidth: 0 },
      { key: 'scope',        name: strings.ArchiveOverview.ColumnScope,         fieldName: 'scope',        minWidth: 0 },
      { key: 'dateArchived', name: strings.ArchiveOverview.ColumnDateArchived,  fieldName: 'dateArchived', minWidth: 0 },
      { key: 'status',       name: strings.ArchiveOverview.ColumnStatus,        fieldName: 'status',       minWidth: 0 },
    ]
    ExcelExportService.export(filteredLog, exportCols)
  }

  const arkivloggToolbarItems: ListMenuItem[] = [
    new ListMenuItem().setSearchBox({
      placeholder: strings.ArchiveOverview.ArkivloggSearchPlaceholder,
      onChange:    (_, data) => setArkivloggSearch(data?.value ?? ''),
      value:       arkivloggSearch,
    }),
  ]

  const arkivloggFarItems: ListMenuItem[] = [
    new ListMenuItem(null, strings.ArchiveOverview.FilterButtonLabel)
      .setIcon('Filter')
      .setOnClick(() => setIsArkivloggFilterOpen(true)),
    new ListMenuItem(null, strings.ArchiveOverview.ExportButtonLabel)
      .setIcon('ExcelLogoInverse')
      .setStyle({ color: '#10793F' })
      .setOnClick(handleExportArkivlogg),
  ]

  const arkivloggFilterPanelProps: IFilterPanelProps = {
    isOpen:         isArkivloggFilterOpen,
    onDismiss:      () => setIsArkivloggFilterOpen(false),
    filters:        arkivloggFilterData,
    onFilterChange: handleArkivloggFilterChange,
  }

  return {
    selectedNav,
    setSelectedNav,
    dayRange,
    setDayRange,
    ...archiveData,
    // Project sort
    sortedProjects,
    handleProjectSort,
    sortArrow,
    // Filtered collections
    filteredProjects,
    filteredDocs,
    filteredLists,
    filteredLog,
    // Dokumenter toolbar
    dokumenterToolbarItems,
    dokumenterFarItems,
    dokumenterFilterPanelProps,
    // Lister toolbar
    listerToolbarItems,
    listerFarItems,
    listerFilterPanelProps,
    // Prosjekter toolbar
    prosjekterToolbarItems,
    prosjekterFarItems,
    prosjekterFilterPanelProps,
    // Arkivlogg toolbar
    arkivloggToolbarItems,
    arkivloggFarItems,
    arkivloggFilterPanelProps,
  }
}
