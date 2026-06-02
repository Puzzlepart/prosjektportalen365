import {
  Badge,
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
import { customLightTheme } from 'pp365-shared-library'
import React, { FC, useState } from 'react'

// ─────────────────────────────────────────────────────
// Scale all fontSize / lineHeight tokens in a FluentUI theme
// ─────────────────────────────────────────────────────
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

const scaledTheme = scaleThemeFonts(customLightTheme, 1.3)
import styles from './ArchiveOverview.module.scss'
import { IArchiveOverviewProps } from './types'
import {
  ActivityLevel,
  IProjectSummary,
  IQuickStat,
  useArchiveData
} from './useArchiveData'

// ─────────────────────────────────────────────────────
// ActivityBars — sparkline-style bar indicator
// ─────────────────────────────────────────────────────

const BAR_HEIGHTS = [30, 60, 100, 65] // relative heights (%)

function getBarColor(level: ActivityLevel, barIdx: number): string {
  if (level === 'none') return '#C8C6C4'
  if (level === 'high') return '#107C10'
  if (level === 'medium') return barIdx < 3 ? '#107C10' : '#C8C6C4'
  if (level === 'low') return barIdx < 2 ? '#FFB900' : '#C8C6C4'
  return '#C8C6C4'
}

const ActivityBars: FC<{ level: ActivityLevel }> = ({ level }) => (
  <div className={styles.activityBarsWrap}>
    {BAR_HEIGHTS.map((h, i) => (
      <div
        key={i}
        className={styles.activityBar}
        style={{ height: `${h}%`, backgroundColor: getBarColor(level, i) }}
      />
    ))}
  </div>
)


// ─────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────

const StatusBadge: FC<{ status: IProjectSummary['status'] }> = ({ status }) => {
  if (status === 'updated')
    return (
      <Badge appearance='tint' color='success'>
        Oppdatert
      </Badge>
    )
  if (status === 'warning')
    return (
      <Badge appearance='tint' color='warning'>
        Advarsel
      </Badge>
    )
  return (
    <Badge appearance='tint' color='danger'>
      Aldri arkivert
    </Badge>
  )
}

// ─────────────────────────────────────────────────────
// Quick stats icon map
// ─────────────────────────────────────────────────────

const QUICK_STAT_ICONS = [
  <ArchiveRegular key='0' fontSize={23} />,
  <ArrowClockwiseRegular key='1' fontSize={23} />,
  <DocumentRegular key='2' fontSize={23} />,
  <WarningRegular key='3' fontSize={23} />
]

// ─────────────────────────────────────────────────────
// ArchiveOverview — main component
// ─────────────────────────────────────────────────────

export const ArchiveOverview: FC<IArchiveOverviewProps> = (props) => {
  const fluentProviderId = useId('fp-archive-overview')
  const [selectedNav, setSelectedNav] = useState<string>('oversikt')

  const { loading, error, pending, archiveStatus, archiveTotal, projects, quickStats } =
    useArchiveData(props)

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
                Oversikt
              </NavItem>
              <NavItem icon={<FolderRegular />} value='prosjekter' href='#'>
                Prosjekter
              </NavItem>
              <NavItem icon={<DocumentRegular />} value='dokumenter' href='#'>
                Dokumenter
              </NavItem>
              <NavItem icon={<GridRegular />} value='lister' href='#'>
                Lister
              </NavItem>
              <NavItem icon={<HistoryRegular />} value='arkivlogg' href='#'>
                Arkivlogg
              </NavItem>
              <NavItem icon={<SettingsRegular />} value='innstillinger' href='#'>
                Innstillinger
              </NavItem>
            </Nav>

          </nav>

          {/* ── Main content ── */}
          <div className={styles.content}>
            {/* ── Header ── */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <ArchiveRegular fontSize={36} />
                <Title3>Arkiv-dashboard</Title3>
              </div>
              <div className={styles.headerRight}>
                <Button appearance='subtle' icon={<ArrowClockwiseRegular />} size='small'>
                  {loading ? 'Laster...' : 'Oppdater'}
                </Button>
                <Divider vertical style={{ height: 20, margin: '0 4px' }} />
                <Button
                  appearance='subtle'
                  icon={<CalendarMonthRegular />}
                  iconPosition='before'
                  size='small'
                >
                  Alle elementer
                </Button>
              </div>
            </div>

            {/* ── Loading / Error / Body ── */}
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 24px'
                }}
              >
                <Spinner label='Henter arkivdata...' />
              </div>
            ) : error ? (
              <div style={{ padding: '24px', color: '#D13438' }}>
                <Text weight='semibold'>Kunne ikke hente arkivdata</Text>
                <br />
                <Caption1>{error.message}</Caption1>
              </div>
            ) : (
              <div className={styles.body}>
                {/* ══ Left column ══ */}
                <div className={styles.mainColumn}>
                  {/* Pending */}
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <Subtitle2>Pending</Subtitle2>
                    </div>

                    <div className={styles.pendingGrid}>
                      {/* Til arkivering */}
                      <div className={styles.card}>
                        <Text size={300} weight='semibold'>
                          Til arkivering
                        </Text>
                        <div className={styles.cardNumber}>{pending.toArchive.count}</div>
                        <Caption1 style={{ color: '#605e5c' }}>
                          Disse elementene er klare for arkivering.
                        </Caption1>
                        <Button appearance='outline' size='small' className={styles.cardBtn}>
                          Se detaljer
                        </Button>
                      </div>

                      {/* Feilet arkivering */}
                      <div className={styles.card}>
                        <Text size={300} weight='semibold'>
                          Feilet arkivering
                        </Text>
                        <div className={styles.cardNumber}>{pending.failed.count}</div>
                        <Caption1 style={{ color: '#605e5c' }}>
                          Disse elementene kunne ikke arkiveres.
                        </Caption1>
                        <Button appearance='outline' size='small' className={styles.cardBtn}>
                          Se detaljer
                        </Button>
                      </div>

                    </div>
                  </div>

                  {/* Project overview */}
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <Subtitle2>Prosjektoversikt</Subtitle2>
                    </div>

                    <div className={styles.projectTableWrap}>
                      <table className={styles.projectTable}>
                        <thead>
                          <tr>
                            <th>Prosjektnavn</th>
                            <th>
                              Sist arkivert{' '}
                              <span style={{ fontSize: 14, verticalAlign: 'middle' }}>↓</span>
                            </th>
                            <th>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                Aktivitetsnivå
                                <InfoRegular fontSize={17} style={{ color: '#605e5c', flexShrink: 0 }} />
                              </span>
                            </th>
                            <th>Status</th>
                            <th>Neste arkivering</th>
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
                                      ? 'Høy'
                                      : p.activity === 'medium'
                                        ? 'Middels'
                                        : p.activity === 'low'
                                          ? 'Lav'
                                          : 'Ingen aktivitet'}
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

                    {/* Footer link */}
                    <div className={styles.tableFooter}>
                      <Button
                        appearance='transparent'
                        icon={<ChevronRightRegular />}
                        iconPosition='after'
                        size='small'
                        style={{ color: '#0078D4', padding: 0 }}
                      >
                        Se alle prosjekter
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ══ Right sidebar ══ */}
                <div className={styles.sidebar}>
                  {/* Arkivstatus */}
                  <div className={styles.sideSection}>
                    <Subtitle2>Arkivstatus</Subtitle2>
                    {archiveStatus.length > 0 && archiveTotal > 0 ? (
                      <div className={styles.donutContainer}>
                        <DonutChart
                          data={
                            {
                              chartTitle: 'Arkivstatus',
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
                        Ingen arkivdata funnet.
                      </Caption1>
                    )}
                    <Button
                      appearance='transparent'
                      icon={<ChevronRightRegular />}
                      iconPosition='after'
                      size='small'
                      style={{ color: '#0078D4', padding: 0 }}
                    >
                      Se alle elementer
                    </Button>
                  </div>

                  {/* Hurtigoversikt */}
                  <div className={styles.sideSection}>
                    <Subtitle2>Hurtigoversikt</Subtitle2>
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
                      <Text weight='semibold' size={300}>Om arkivstatus</Text>
                    </div>
                    <Caption1 style={{ color: '#605e5c', display: 'block', marginBottom: 10 }}>
                      Statusene viser hvor elementene befinner seg i arkiveringsprosessen.
                    </Caption1>
                    <Button
                      appearance='transparent'
                      icon={<ChevronRightRegular />}
                      iconPosition='after'
                      size='small'
                      style={{ color: '#0078D4', padding: 0 }}
                    >
                      Les mer om arkivstatus
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
