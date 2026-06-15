import {
  Button,
  Caption1,
  Divider,
  FluentProvider,
  IdPrefixProvider,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Nav,
  NavItem,
  Spinner,
  Subtitle2,
  Text,
  Title3,
  useId
} from '@fluentui/react-components'
import {
  ArchiveRegular,
  ArrowClockwiseRegular,
  CalendarMonthRegular,
  ChevronRightRegular,
  DocumentRegular,
  FolderRegular,
  GridRegular,
  HistoryRegular,
  HomeRegular,
  InfoRegular,
  QuestionCircleRegular,
  SettingsRegular,
  WarningRegular
} from '@fluentui/react-icons'
import { format } from '@fluentui/react'
import { DonutChart, IChartProps, ILineChartPoints, LineChart } from '@fluentui/react-charting'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { Toolbar } from 'pp365-shared-library'
import { ActivityBars } from './ActivityBars'
import styles from './ArchiveOverview.module.scss'
import { LogStatusBadge } from './LogStatusBadge'
import { StatusBadge } from './StatusBadge'
import { IArchiveOverviewProps } from './types'
import { IDailyActivity, IDocumentLogItem, IProjectSummary, IQuickStat } from './useArchiveData'
import { scaledTheme, useArchiveOverview } from './useArchiveOverview'

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

/** Converts a 6-digit hex colour to rgba, allowing opacity control for backgrounds. */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Tallies items by each GtLogStatus value. */
function countByStatus(items: IDocumentLogItem[]) {
  const sv = strings.ArchiveOverview
  let arkivert = 0, tilArkiv = 0, feil = 0, advarsel = 0
  for (const item of items) {
    if (item.status === sv.StatusValueArchived)       arkivert++
    else if (item.status === sv.StatusValueToArchive) tilArkiv++
    else if (item.status === sv.StatusValueFailed)    feil++
    else if (item.status === sv.StatusValueWarning)   advarsel++
  }
  return { total: items.length, arkivert, tilArkiv, feil, advarsel }
}

/** Status-count summary cards displayed above the dokumenter / lister tables (display only). */
const StatCards: FC<{ items: IDocumentLogItem[] }> = ({ items }) => {
  const c = countByStatus(items)
  return (
    <div className={styles.statGrid}>
      <div className={styles.statCard}>
        <div className={styles.statCardNumber} style={{ color: '#0078D4' }}>{c.total}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatTotalLabel}</Caption1>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statCardNumber} style={{ color: '#107C10' }}>{c.arkivert}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatusLabelArchived}</Caption1>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statCardNumber} style={{ color: '#0078D4' }}>{c.tilArkiv}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatusLabelToArchive}</Caption1>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statCardNumber} style={{ color: '#D13438' }}>{c.feil}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatusLabelFailed}</Caption1>
      </div>
      <div className={styles.statCardLastRow}>
        <div className={styles.statCardNumber} style={{ color: '#D86C00' }}>{c.advarsel}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatusLabelWarning}</Caption1>
      </div>
    </div>
  )
}

/** Status-count summary cards displayed above the prosjekter table (display only). */
const ProsjekterStatCards: FC<{ projects: IProjectSummary[] }> = ({ projects }) => {
  let updated = 0, warning = 0, never = 0
  for (const p of projects) {
    if (p.status === 'updated') updated++
    else if (p.status === 'warning') warning++
    else if (p.status === 'never') never++
  }
  return (
    <div className={styles.statGrid4}>
      <div className={styles.statCard}>
        <div className={styles.statCardNumber} style={{ color: '#0078D4' }}>{projects.length}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatTotalLabel}</Caption1>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statCardNumber} style={{ color: '#107C10' }}>{updated}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatusUpdated}</Caption1>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statCardNumber} style={{ color: '#D86C00' }}>{warning}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatusWarning}</Caption1>
      </div>
      <div className={styles.statCardLastRow}>
        <div className={styles.statCardNumber} style={{ color: '#D13438' }}>{never}</div>
        <Caption1 style={{ color: '#605e5c' }}>{strings.ArchiveOverview.StatusNeverArchived}</Caption1>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Static presentation constants
// ─────────────────────────────────────────────────────

const QUICK_STAT_ICONS = [
  <ArchiveRegular key='0' fontSize={23} />,
  <ArrowClockwiseRegular key='1' fontSize={23} />,
  <DocumentRegular key='2' fontSize={23} />,
  <WarningRegular key='3' fontSize={23} />
]

// ─────────────────────────────────────────────────────
// ArchiveOverview
// ─────────────────────────────────────────────────────

export const ArchiveOverview: FC<IArchiveOverviewProps> = (props) => {
  const fluentProviderId = useId('fp-archive-overview')
  const {
    selectedNav,
    setSelectedNav,
    dayRange,
    setDayRange,
    loading,
    error,
    pending,
    archiveStatus,
    archiveTotal,
    projects,
    quickStats,
    dailyActivity,
    documentItems,
    listItems,
    sortedProjects,
    handleProjectSort,
    sortArrow,
    filteredProjects,
    filteredDocs,
    filteredLists,
    filteredLog,
    logItems,
    prosjekterColWidths, prosjekterStartResize,
    dokumenterColWidths, dokumenterStartResize,
    listerColWidths,     listerStartResize,
    arkivloggColWidths,  arkivloggStartResize,
    dokumenterSort, handleDokumenterSort,
    listerSort,     handleListerSort,
    arkivloggSort,  handleArkivloggSort,
    dokumenterToolbarItems,
    dokumenterFarItems,
    dokumenterFilterPanelProps,
    listerToolbarItems,
    listerFarItems,
    listerFilterPanelProps,
    prosjekterToolbarItems,
    prosjekterFarItems,
    prosjekterFilterPanelProps,
    arkivloggToolbarItems,
    arkivloggFarItems,
    arkivloggFilterPanelProps,
  } = useArchiveOverview(props)

  const sortArrowFor = (sort: { col: string; dir: 'asc' | 'desc' }, col: string) =>
    sort.col === col ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={scaledTheme} style={{ background: 'transparent' }}>
        <div className={styles.root}>
          {/* ── Left nav ── */}
          <nav className={styles.navSidebar}>
            <Nav
              selectedValue={selectedNav}
              onNavItemSelect={(_ev, data) => setSelectedNav(data.value as string)}
            >
              <NavItem icon={<HomeRegular />} value='oversikt' href='#'>
                {strings.ArchiveOverview.NavOversikt}
              </NavItem>
              <NavItem icon={<FolderRegular />} value='prosjekter' href='#'>
                {strings.ArchiveOverview.NavProsjekter}
              </NavItem>
              <NavItem icon={<DocumentRegular />} value='dokumenter' href='#'>
                {strings.ArchiveOverview.NavDokumenter}
              </NavItem>
              <NavItem icon={<GridRegular />} value='lister' href='#'>
                {strings.ArchiveOverview.NavLister}
              </NavItem>
              <NavItem icon={<HistoryRegular />} value='arkivlogg' href='#'>
                {strings.ArchiveOverview.NavArkivlogg}
              </NavItem>
              <NavItem icon={<SettingsRegular />} value='innstillinger' href='#'>
                {strings.ArchiveOverview.NavInnstillinger}
              </NavItem>
            </Nav>
          </nav>

          {/* ── Main content ── */}
          <div className={styles.content}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <ArchiveRegular fontSize={36} />
                <Title3>{strings.ArchiveOverview.DashboardTitle}</Title3>
              </div>
              <div className={styles.headerRight}>
                <Button appearance='subtle' icon={<ArrowClockwiseRegular />} size='small'>
                  {loading
                    ? strings.ArchiveOverview.LoadingLabel
                    : strings.ArchiveOverview.RefreshLabel}
                </Button>
                <Divider vertical style={{ height: 20, margin: '0 4px' }} />
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <MenuButton
                      appearance='subtle'
                      icon={<CalendarMonthRegular />}
                      size='small'
                    >
                      {dayRange === 7
                        ? strings.ArchiveOverview.DayRange7Label
                        : dayRange === 16
                          ? strings.ArchiveOverview.DayRange16Label
                          : dayRange === 30
                            ? strings.ArchiveOverview.DayRange30Label
                            : dayRange === 180
                              ? strings.ArchiveOverview.DayRange180Label
                              : strings.ArchiveOverview.DayRange365Label}
                    </MenuButton>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem onClick={() => setDayRange(7)}>
                        {strings.ArchiveOverview.DayRange7Label}
                      </MenuItem>
                      <MenuItem onClick={() => setDayRange(16)}>
                        {strings.ArchiveOverview.DayRange16Label}
                      </MenuItem>
                      <MenuItem onClick={() => setDayRange(30)}>
                        {strings.ArchiveOverview.DayRange30Label}
                      </MenuItem>
                      <MenuItem onClick={() => setDayRange(180)}>
                        {strings.ArchiveOverview.DayRange180Label}
                      </MenuItem>
                      <MenuItem onClick={() => setDayRange(365)}>
                        {strings.ArchiveOverview.DayRange365Label}
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>
            </div>

            {/* Loading / Error / Body */}
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 24px'
                }}
              >
                <Spinner label={strings.ArchiveOverview.LoadingDataLabel} />
              </div>
            ) : error ? (
              <div style={{ padding: '24px', color: '#D13438' }}>
                <Text weight='semibold'>{strings.ArchiveOverview.ErrorTitle}</Text>
                <br />
                <Caption1>{error.message}</Caption1>
              </div>
            ) : selectedNav === 'prosjekter' ? (
              <div className={styles.tableViewBody}>
                <div className={styles.sectionHeader}>
                  <Subtitle2>{strings.ArchiveOverview.NavProsjekter}</Subtitle2>
                </div>
                <ProsjekterStatCards projects={projects} />
                <Toolbar
                  items={prosjekterToolbarItems}
                  farItems={prosjekterFarItems}
                  filterPanel={prosjekterFilterPanelProps}
                />
                <div className={styles.projectTableWrap}>
                  <table
                    className={styles.projectTable}
                    style={Object.keys(prosjekterColWidths).length ? { tableLayout: 'fixed' } : undefined}
                  >
                    {Object.keys(prosjekterColWidths).length > 0 && (
                      <colgroup>
                        {['name', 'lastArchived', 'activity', 'status'].map(k => (
                          <col key={k} style={{ width: prosjekterColWidths[k] }} />
                        ))}
                      </colgroup>
                    )}
                    <thead>
                      <tr>
                        <th data-col-key='name' onClick={() => handleProjectSort('name')}>
                          {strings.ArchiveOverview.ColumnProjectName}
                          {sortArrow('name')}
                          <div className={styles.resizeHandle} onMouseDown={(e) => prosjekterStartResize('name', e)} />
                        </th>
                        <th data-col-key='lastArchived' onClick={() => handleProjectSort('lastArchived')}>
                          {strings.ArchiveOverview.ColumnLastArchived}
                          {sortArrow('lastArchived')}
                          <div className={styles.resizeHandle} onMouseDown={(e) => prosjekterStartResize('lastArchived', e)} />
                        </th>
                        <th data-col-key='activity' onClick={() => handleProjectSort('activity')}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {strings.ArchiveOverview.ColumnActivityLevel}
                            <InfoRegular fontSize={17} style={{ color: '#605e5c', flexShrink: 0 }} />
                          </span>
                          {sortArrow('activity')}
                          <div className={styles.resizeHandle} onMouseDown={(e) => prosjekterStartResize('activity', e)} />
                        </th>
                        <th data-col-key='status' onClick={() => handleProjectSort('status')}>
                          {strings.ArchiveOverview.ColumnStatus}
                          {sortArrow('status')}
                          <div className={styles.resizeHandle} onMouseDown={(e) => prosjekterStartResize('status', e)} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className={styles.projectCell}>
                              <div
                                className={styles.projectIcon}
                                style={{ backgroundColor: hexToRgba(p.color, 0.18) }}
                              >
                                <FolderRegular fontSize={14} style={{ color: p.color }} />
                              </div>
                              {p.siteUrl ? (
                                <Link href={p.siteUrl} target='_blank'>
                                  <Text size={200}>{p.name}</Text>
                                </Link>
                              ) : (
                                <Text size={200}>{p.name}</Text>
                              )}
                            </div>
                          </td>
                          <td>
                            <Caption1 style={{ color: '#605e5c' }}>{p.lastArchived}</Caption1>
                          </td>
                          <td>
                            <div className={styles.activityCell}>
                              <ActivityBars level={p.activity} />
                              <Caption1 style={{ color: '#605e5c' }}>
                                {p.activity === 'high'
                                  ? strings.ArchiveOverview.ActivityHigh
                                  : p.activity === 'medium'
                                    ? strings.ArchiveOverview.ActivityMedium
                                    : p.activity === 'low'
                                      ? strings.ArchiveOverview.ActivityLow
                                      : strings.ArchiveOverview.ActivityNone}
                              </Caption1>
                            </div>
                          </td>
                          <td><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedNav === 'dokumenter' ? (
              <div className={styles.tableViewBody}>
                <div className={styles.sectionHeader}>
                  <Subtitle2>{strings.ArchiveOverview.NavDokumenter}</Subtitle2>
                </div>
                <StatCards items={documentItems} />
                <Toolbar
                  items={dokumenterToolbarItems}
                  farItems={dokumenterFarItems}
                  filterPanel={dokumenterFilterPanelProps}
                />
                {documentItems.length === 0 ? (
                  <Caption1 style={{ color: '#605e5c', display: 'block', marginTop: 12 }}>
                    {strings.ArchiveOverview.NoDocumentsLabel}
                  </Caption1>
                ) : (
                  <div className={styles.projectTableWrap}>
                    <table
                      className={styles.projectTable}
                      style={Object.keys(dokumenterColWidths).length ? { tableLayout: 'fixed' } : undefined}
                    >
                      {Object.keys(dokumenterColWidths).length > 0 && (
                        <colgroup>
                          {['projectName', 'title', 'dateArchived', 'status'].map(k => (
                            <col key={k} style={{ width: dokumenterColWidths[k] }} />
                          ))}
                        </colgroup>
                      )}
                      <thead>
                        <tr>
                          <th data-col-key='projectName' onClick={() => handleDokumenterSort('projectName')}>
                            {strings.ArchiveOverview.ColumnProjectName}
                            {sortArrowFor(dokumenterSort, 'projectName')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => dokumenterStartResize('projectName', e)} />
                          </th>
                          <th data-col-key='title' onClick={() => handleDokumenterSort('title')}>
                            {strings.ArchiveOverview.ColumnDocument}
                            {sortArrowFor(dokumenterSort, 'title')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => dokumenterStartResize('title', e)} />
                          </th>
                          <th data-col-key='dateArchived' onClick={() => handleDokumenterSort('dateArchived')}>
                            {strings.ArchiveOverview.ColumnDateArchived}
                            {sortArrowFor(dokumenterSort, 'dateArchived')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => dokumenterStartResize('dateArchived', e)} />
                          </th>
                          <th data-col-key='status' onClick={() => handleDokumenterSort('status')}>
                            {strings.ArchiveOverview.ColumnStatus}
                            {sortArrowFor(dokumenterSort, 'status')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => dokumenterStartResize('status', e)} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocs.map((doc: IDocumentLogItem) => (
                          <tr key={doc.id}>
                            <td>
                              <div className={styles.projectCell}>
                                <div className={styles.projectIcon}>
                                  <FolderRegular fontSize={14} />
                                </div>
                                {doc.projectSiteUrl ? (
                                  <Link href={doc.projectSiteUrl} target='_blank'>
                                    <Text size={200}>{doc.projectName}</Text>
                                  </Link>
                                ) : (
                                  <Text size={200}>{doc.projectName}</Text>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <DocumentRegular fontSize={14} style={{ color: '#605e5c', flexShrink: 0 }} />
                                <Text size={200}>{doc.title}</Text>
                              </div>
                            </td>
                            <td>
                              <Caption1 style={{ color: '#605e5c' }}>{doc.dateArchived}</Caption1>
                            </td>
                            <td>
                              <LogStatusBadge status={doc.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : selectedNav === 'lister' ? (
              <div className={styles.tableViewBody}>
                <div className={styles.sectionHeader}>
                  <Subtitle2>{strings.ArchiveOverview.ListerViewTitle}</Subtitle2>
                </div>
                <StatCards items={listItems} />
                <Toolbar
                  items={listerToolbarItems}
                  farItems={listerFarItems}
                  filterPanel={listerFilterPanelProps}
                />
                {listItems.length === 0 ? (
                  <Caption1 style={{ color: '#605e5c', display: 'block', marginTop: 12 }}>
                    {strings.ArchiveOverview.NoListsLabel}
                  </Caption1>
                ) : (
                  <div className={styles.projectTableWrap}>
                    <table
                      className={styles.projectTable}
                      style={Object.keys(listerColWidths).length ? { tableLayout: 'fixed' } : undefined}
                    >
                      {Object.keys(listerColWidths).length > 0 && (
                        <colgroup>
                          {['projectName', 'title', 'dateArchived', 'status'].map(k => (
                            <col key={k} style={{ width: listerColWidths[k] }} />
                          ))}
                        </colgroup>
                      )}
                      <thead>
                        <tr>
                          <th data-col-key='projectName' onClick={() => handleListerSort('projectName')}>
                            {strings.ArchiveOverview.ColumnProjectName}
                            {sortArrowFor(listerSort, 'projectName')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => listerStartResize('projectName', e)} />
                          </th>
                          <th data-col-key='title' onClick={() => handleListerSort('title')}>
                            {strings.ArchiveOverview.ColumnList}
                            {sortArrowFor(listerSort, 'title')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => listerStartResize('title', e)} />
                          </th>
                          <th data-col-key='dateArchived' onClick={() => handleListerSort('dateArchived')}>
                            {strings.ArchiveOverview.ColumnDateArchived}
                            {sortArrowFor(listerSort, 'dateArchived')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => listerStartResize('dateArchived', e)} />
                          </th>
                          <th data-col-key='status' onClick={() => handleListerSort('status')}>
                            {strings.ArchiveOverview.ColumnStatus}
                            {sortArrowFor(listerSort, 'status')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => listerStartResize('status', e)} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLists.map((item: IDocumentLogItem) => (
                          <tr key={item.id}>
                            <td>
                              <div className={styles.projectCell}>
                                <div className={styles.projectIcon}>
                                  <FolderRegular fontSize={14} />
                                </div>
                                {item.projectSiteUrl ? (
                                  <Link href={item.projectSiteUrl} target='_blank'>
                                    <Text size={200}>{item.projectName}</Text>
                                  </Link>
                                ) : (
                                  <Text size={200}>{item.projectName}</Text>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <GridRegular fontSize={14} style={{ color: '#605e5c', flexShrink: 0 }} />
                                <Text size={200}>{item.title}</Text>
                              </div>
                            </td>
                            <td>
                              <Caption1 style={{ color: '#605e5c' }}>{item.dateArchived}</Caption1>
                            </td>
                            <td>
                              <LogStatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : selectedNav === 'arkivlogg' ? (
              <div className={styles.tableViewBody}>
                <div className={styles.sectionHeader}>
                  <Subtitle2>{strings.ArchiveOverview.NavArkivlogg}</Subtitle2>
                </div>
                <StatCards items={logItems} />
                <Toolbar
                  items={arkivloggToolbarItems}
                  farItems={arkivloggFarItems}
                  filterPanel={arkivloggFilterPanelProps}
                />
                {logItems.length === 0 ? (
                  <Caption1 style={{ color: '#605e5c', display: 'block', marginTop: 12 }}>
                    {strings.ArchiveOverview.NoLogItemsLabel}
                  </Caption1>
                ) : (
                  <div className={styles.projectTableWrap}>
                    <table
                      className={styles.projectTable}
                      style={Object.keys(arkivloggColWidths).length ? { tableLayout: 'fixed' } : undefined}
                    >
                      {Object.keys(arkivloggColWidths).length > 0 && (
                        <colgroup>
                          {['projectName', 'title', 'scope', 'dateArchived', 'status'].map(k => (
                            <col key={k} style={{ width: arkivloggColWidths[k] }} />
                          ))}
                        </colgroup>
                      )}
                      <thead>
                        <tr>
                          <th data-col-key='projectName' onClick={() => handleArkivloggSort('projectName')}>
                            {strings.ArchiveOverview.ColumnProjectName}
                            {sortArrowFor(arkivloggSort, 'projectName')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => arkivloggStartResize('projectName', e)} />
                          </th>
                          <th data-col-key='title' onClick={() => handleArkivloggSort('title')}>
                            {strings.ArchiveOverview.ColumnElement}
                            {sortArrowFor(arkivloggSort, 'title')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => arkivloggStartResize('title', e)} />
                          </th>
                          <th data-col-key='scope' onClick={() => handleArkivloggSort('scope')}>
                            {strings.ArchiveOverview.ColumnScope}
                            {sortArrowFor(arkivloggSort, 'scope')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => arkivloggStartResize('scope', e)} />
                          </th>
                          <th data-col-key='dateArchived' onClick={() => handleArkivloggSort('dateArchived')}>
                            {strings.ArchiveOverview.ColumnDateArchived}
                            {sortArrowFor(arkivloggSort, 'dateArchived')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => arkivloggStartResize('dateArchived', e)} />
                          </th>
                          <th data-col-key='status' onClick={() => handleArkivloggSort('status')}>
                            {strings.ArchiveOverview.ColumnStatus}
                            {sortArrowFor(arkivloggSort, 'status')}
                            <div className={styles.resizeHandle} onMouseDown={(e) => arkivloggStartResize('status', e)} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLog.map((item: IDocumentLogItem) => (
                          <tr key={item.id}>
                            <td>
                              <div className={styles.projectCell}>
                                <div className={styles.projectIcon}>
                                  <FolderRegular fontSize={14} />
                                </div>
                                {item.projectSiteUrl ? (
                                  <Link href={item.projectSiteUrl} target='_blank'>
                                    <Text size={200}>{item.projectName}</Text>
                                  </Link>
                                ) : (
                                  <Text size={200}>{item.projectName}</Text>
                                )}
                              </div>
                            </td>
                            <td>
                              <Text size={200}>{item.title}</Text>
                            </td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {item.scope === 'Dokument'
                                  ? <DocumentRegular fontSize={14} style={{ color: '#605e5c', flexShrink: 0 }} />
                                  : <GridRegular fontSize={14} style={{ color: '#605e5c', flexShrink: 0 }} />}
                                <Caption1 style={{ color: '#605e5c' }}>
                                  {item.scope === 'Dokument'
                                    ? strings.ArchiveOverview.ScopeLabelDocument
                                    : strings.ArchiveOverview.ScopeLabelList}
                                </Caption1>
                              </div>
                            </td>
                            <td>
                              <Caption1 style={{ color: '#605e5c' }}>{item.dateArchived}</Caption1>
                            </td>
                            <td>
                              <LogStatusBadge status={item.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.body}>
                {/* ══ Main column ══ */}
                <div className={styles.mainColumn}>
                  {/* Pending */}
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>

                    </div>
                    <div className={styles.pendingGrid}>
                      <div className={styles.card}>
                        <Text size={300} weight='semibold'>
                          {strings.ArchiveOverview.ToArchiveCardTitle}
                        </Text>
                        <div className={styles.cardNumber}>{pending.toArchive.count}</div>
                        <Caption1 style={{ color: '#605e5c' }}>
                          {strings.ArchiveOverview.ToArchiveCardDescription}
                        </Caption1>
                      </div>
                      <div className={styles.card}>
                        <Text size={300} weight='semibold'>
                          {strings.ArchiveOverview.FailedCardTitle}
                        </Text>
                        <div className={styles.cardNumber}>{pending.failed.count}</div>
                        <Caption1 style={{ color: '#605e5c' }}>
                          {strings.ArchiveOverview.FailedCardDescription}
                        </Caption1>
                      </div>
                      <div className={styles.chartCard}>
                        <Text size={300} weight='semibold'>
                          {format(strings.ArchiveOverview.ActivityChartTitle, dayRange)}
                        </Text>
                        <LineChart
                          data={{
                            lineChartData: [
                              {
                                legend: strings.ArchiveOverview.ActivityChartLegend,
                                data: dailyActivity.map((d: IDailyActivity) => ({
                                  x: d.date,
                                  y: d.count,
                                  xAxisCalloutData: d.date.toLocaleDateString('nb-NO', {
                                    day: 'numeric',
                                    month: 'short'
                                  })
                                })),
                                color: '#0078D4'
                              } as ILineChartPoints
                            ]
                          } as IChartProps}
                          height={150}
                          hideLegend={true}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project overview */}
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <Subtitle2>{strings.ArchiveOverview.ProjectOverviewTitle}</Subtitle2>
                    </div>
                    <div className={styles.projectTableWrap}>
                      <table className={styles.projectTable}>
                        <thead>
                          <tr>
                            <th>{strings.ArchiveOverview.ColumnProjectName}</th>
                            <th>
                              {strings.ArchiveOverview.ColumnLastArchived}{' '}
                              <span style={{ fontSize: 14, verticalAlign: 'middle' }}>↓</span>
                            </th>
                            <th>
                              <span
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                {strings.ArchiveOverview.ColumnActivityLevel}
                                <InfoRegular
                                  fontSize={17}
                                  style={{ color: '#605e5c', flexShrink: 0 }}
                                />
                              </span>
                            </th>
                            <th>{strings.ArchiveOverview.ColumnStatus}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.slice(0, 5).map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className={styles.projectCell}>
                                  <div
                                    className={styles.projectIcon}
                                    style={{ backgroundColor: hexToRgba(p.color, 0.18) }}
                                  >
                                    <FolderRegular fontSize={14} style={{ color: p.color }} />
                                  </div>
                                  {p.siteUrl ? (
                                    <Link href={p.siteUrl} target='_blank'>
                                      <Text size={200}>{p.name}</Text>
                                    </Link>
                                  ) : (
                                    <Text size={200}>{p.name}</Text>
                                  )}
                                </div>
                              </td>
                              <td>
                                <Caption1 style={{ color: '#605e5c' }}>{p.lastArchived}</Caption1>
                              </td>
                              <td>
                                <div className={styles.activityCell}>
                                  <ActivityBars level={p.activity} />
                                  <Caption1 style={{ color: '#605e5c' }}>
                                    {p.activity === 'high'
                                      ? strings.ArchiveOverview.ActivityHigh
                                      : p.activity === 'medium'
                                        ? strings.ArchiveOverview.ActivityMedium
                                        : p.activity === 'low'
                                          ? strings.ArchiveOverview.ActivityLow
                                          : strings.ArchiveOverview.ActivityNone}
                                  </Caption1>
                                </div>
                              </td>
                              <td>
                                <StatusBadge status={p.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.tableFooter}>
                      <Button
                        appearance='transparent'
                        icon={<ChevronRightRegular />}
                        iconPosition='after'
                        size='small'
                        style={{ color: '#0078D4', padding: 0 }}
                      >
                        {strings.ArchiveOverview.SeeAllProjectsLabel}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ══ Right sidebar ══ */}
                <div className={styles.sidebar}>
                  {/* Arkivstatus */}
                  <div className={styles.sideSection}>
                    <Subtitle2>{strings.ArchiveOverview.ArchiveStatusTitle}</Subtitle2>
                    {archiveStatus.length > 0 && archiveTotal > 0 ? (
                      <div className={styles.donutContainer}>
                        <DonutChart
                          data={
                            {
                              chartTitle: strings.ArchiveOverview.ArchiveStatusTitle,
                              chartData: archiveStatus.map((s) => ({
                                legend: s.label,
                                data: s.count,
                                color: s.color
                              }))
                            } as IChartProps
                          }
                          innerRadius={52}
                          width={220}
                          height={220}
                          valueInsideDonut={archiveTotal}
                          hideLegend={true}
                        />
                        <div className={styles.statusLegend}>
                          {archiveStatus.map((s) => (
                            <div key={s.label} className={styles.statusLegendRow}>
                              <span
                                className={styles.legendDot}
                                style={{ backgroundColor: s.color }}
                              />
                              <span className={styles.legendLabel}>{s.label}</span>
                              <span className={styles.legendCount}>{s.count}</span>
                              <span className={styles.legendPct}>({s.percent}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Caption1 style={{ color: '#605e5c', display: 'block', marginTop: 12 }}>
                        {strings.ArchiveOverview.NoArchiveDataLabel}
                      </Caption1>
                    )}
                    <Button
                      appearance='transparent'
                      icon={<ChevronRightRegular />}
                      iconPosition='after'
                      size='small'
                      style={{ color: '#0078D4', padding: 0 }}
                    >
                      {strings.ArchiveOverview.SeeAllElementsLabel}
                    </Button>
                  </div>

                  {/* Hurtigoversikt */}
                  <div className={styles.sideSection}>
                    <Subtitle2>{strings.ArchiveOverview.QuickOverviewTitle}</Subtitle2>
                    <div className={styles.quickList}>
                      {quickStats.map((s: IQuickStat, i: number) => (
                        <div key={i} className={styles.quickRow}>
                          <div className={styles.quickRowIcon}>{QUICK_STAT_ICONS[i]}</div>
                          <span className={styles.quickRowLabel}>{s.label}</span>
                          <span className={styles.quickRowValue}>{s.value}</span>
                          <ChevronRightRegular fontSize={18} style={{ color: '#a0a0a0' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Om arkivstatus */}
                  <div className={styles.sideSection}>
                    <div className={styles.omArkivHeader}>
                      <InfoRegular fontSize={21} />
                      <Text weight='semibold' size={300}>
                        {strings.ArchiveOverview.AboutArchiveStatusTitle}
                      </Text>
                    </div>
                    <Caption1 style={{ color: '#605e5c', display: 'block', marginBottom: 10 }}>
                      {strings.ArchiveOverview.AboutArchiveStatusDescription}
                    </Caption1>
                    <Button
                      appearance='transparent'
                      icon={<ChevronRightRegular />}
                      iconPosition='after'
                      size='small'
                      style={{ color: '#0078D4', padding: 0 }}
                    >
                      {strings.ArchiveOverview.ReadMoreLabel}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

ArchiveOverview.defaultProps = {
  title: 'Archive'
}
