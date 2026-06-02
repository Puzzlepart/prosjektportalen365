import {
  Button,
  Caption1,
  Divider,
  FluentProvider,
  IdPrefixProvider,
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
import { DonutChart, IChartProps } from '@fluentui/react-charting'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { ActivityBars } from './ActivityBars'
import styles from './ArchiveOverview.module.scss'
import { StatusBadge } from './StatusBadge'
import { IArchiveOverviewProps } from './types'
import { IQuickStat } from './useArchiveData'
import { scaledTheme, useArchiveOverview } from './useArchiveOverview'

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
    loading,
    error,
    pending,
    archiveStatus,
    archiveTotal,
    projects,
    quickStats
  } = useArchiveOverview(props)

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
            <div className={styles.navFooter}>
              <NavItem icon={<QuestionCircleRegular />} value='hjelp' href='#'>
                {strings.ArchiveOverview.NavHjelp}
              </NavItem>
            </div>
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
                <Button
                  appearance='subtle'
                  icon={<CalendarMonthRegular />}
                  iconPosition='before'
                  size='small'
                >
                  {strings.ArchiveOverview.AllElementsLabel}
                </Button>
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
                        <Button appearance='outline' size='small' className={styles.cardBtn}>
                          {strings.ArchiveOverview.ViewDetailsLabel}
                        </Button>
                      </div>
                      <div className={styles.card}>
                        <Text size={300} weight='semibold'>
                          {strings.ArchiveOverview.FailedCardTitle}
                        </Text>
                        <div className={styles.cardNumber}>{pending.failed.count}</div>
                        <Caption1 style={{ color: '#605e5c' }}>
                          {strings.ArchiveOverview.FailedCardDescription}
                        </Caption1>
                        <Button appearance='outline' size='small' className={styles.cardBtn}>
                          {strings.ArchiveOverview.ViewDetailsLabel}
                        </Button>
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
                            <th>{strings.ArchiveOverview.ColumnNextArchive}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.map((p) => (
                            <tr
                              key={p.id}
                              onClick={() => p.siteUrl && window.open(p.siteUrl, '_blank')}
                              style={{ cursor: p.siteUrl ? 'pointer' : 'default' }}
                            >
                              <td>
                                <div className={styles.projectCell}>
                                  <div
                                    className={styles.projectIcon}
                                    style={{ backgroundColor: p.color }}
                                  />
                                  <Text size={200}>{p.name}</Text>
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
                              <td>
                                <Caption1 style={{ color: '#605e5c' }}>{p.nextArchive}</Caption1>
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
