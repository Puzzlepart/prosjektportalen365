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
  MoreHorizontalRegular,
  QuestionCircleRegular,
  SettingsRegular,
  WarningRegular
} from '@fluentui/react-icons'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC, useEffect, useState } from 'react'
import styles from './ArchiveOverview.module.scss'
import { IArchiveOverviewProps } from './types'
import {
  ActivityLevel,
  IArchiveStatusEntry,
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
// DonutChartSvg — custom SVG donut chart
// ─────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const os = polarToCartesian(cx, cy, outerR, startAngle)
  const oe = polarToCartesian(cx, cy, outerR, endAngle)
  const ie = polarToCartesian(cx, cy, innerR, endAngle)
  const is_ = polarToCartesian(cx, cy, innerR, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${os.x.toFixed(2)} ${os.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(2)} ${oe.y.toFixed(2)}`,
    `L ${ie.x.toFixed(2)} ${ie.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${is_.x.toFixed(2)} ${is_.y.toFixed(2)}`,
    'Z'
  ].join(' ')
}

const DonutChartSvg: FC<{ segments: IArchiveStatusEntry[]; total: number }> = ({
  segments,
  total
}) => {
  const cx = 85
  const cy = 85
  const outerR = 80
  const innerR = 52
  const gap = 1.5
  let angle = 0

  return (
    <svg width={170} height={170} viewBox='0 0 170 170' aria-hidden='true'>
      {segments.map((seg, i) => {
        const sweep = (seg.count / total) * 360 - gap
        const start = angle + gap / 2
        const end = start + sweep
        angle += (seg.count / total) * 360
        return (
          <path key={i} d={arcPath(cx, cy, outerR, innerR, start, end)} fill={seg.color} />
        )
      })}
      <text
        x={cx}
        y={cy - 6}
        textAnchor='middle'
        fontSize={26}
        fontWeight='700'
        fill='#242424'
        fontFamily='inherit'
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor='middle'
        fontSize={11}
        fill='#605e5c'
        fontFamily='inherit'
      >
        Totalt
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────

const StatusBadge: FC<{ status: IProjectSummary['status'] }> = ({ status }) => {
  if (status === 'updated')
    return (
      <Badge appearance='filled' color='success' size='small'>
        Oppdatert
      </Badge>
    )
  if (status === 'warning')
    return (
      <Badge appearance='filled' color='warning' size='small'>
        Advarsel
      </Badge>
    )
  return (
    <Badge appearance='filled' color='danger' size='small'>
      Aldri arkivert
    </Badge>
  )
}

// ─────────────────────────────────────────────────────
// Quick stats icon map
// ─────────────────────────────────────────────────────

const QUICK_STAT_ICONS = [
  <ArchiveRegular key='0' fontSize={18} />,
  <ArrowClockwiseRegular key='1' fontSize={18} />,
  <DocumentRegular key='2' fontSize={18} />,
  <WarningRegular key='3' fontSize={18} />
]

// ─────────────────────────────────────────────────────
// ArchiveOverview — main component
// ─────────────────────────────────────────────────────

const PAGE_SIZE = 5

export const ArchiveOverview: FC<IArchiveOverviewProps> = (props) => {
  const fluentProviderId = useId('fp-archive-overview')
  const [selectedNav, setSelectedNav] = useState<string>('oversikt')
  const [currentPage, setCurrentPage] = useState(0)

  const { loading, error, pending, archiveStatus, archiveTotal, projects, quickStats } =
    useArchiveData(props)

  // Reset to page 1 whenever the project list changes
  useEffect(() => {
    setCurrentPage(0)
  }, [projects.length])

  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE))
  const pagedProjects = projects.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
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
                <ArchiveRegular fontSize={28} />
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

                    <table className={styles.projectTable}>
                      <thead>
                        <tr>
                          <th>Prosjektnavn</th>
                          <th>Sist arkivert</th>
                          <th>Aktivitetsnivå</th>
                          <th>Status</th>
                          <th>Neste arkivering</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {pagedProjects.map((p) => (
                          <tr key={p.id}>
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
                            <td>
                              <Button
                                appearance='subtle'
                                icon={<MoreHorizontalRegular />}
                                size='small'
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div className={styles.pagination}>
                      <Button
                        appearance='subtle'
                        size='small'
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        ‹ Forrige
                      </Button>
                      <Caption1 style={{ color: '#605e5c' }}>
                        Side {currentPage + 1} av {pageCount}{' '}
                        <span style={{ color: '#a0a0a0' }}>({projects.length} prosjekter)</span>
                      </Caption1>
                      <Button
                        appearance='subtle'
                        size='small'
                        disabled={currentPage >= pageCount - 1}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Neste ›
                      </Button>
                    </div>

                    {/* Activity legend */}
                    <div className={styles.activityLegend}>
                      <Caption1 style={{ color: '#605e5c' }}>Aktivitetsnivå:</Caption1>
                      {(
                        [
                          { level: 'high', label: 'Høy' },
                          { level: 'medium', label: 'Middels' },
                          { level: 'low', label: 'Lav' },
                          { level: 'none', label: 'Ingen aktivitet' }
                        ] as { level: ActivityLevel; label: string }[]
                      ).map((item) => (
                        <div key={item.level} className={styles.legendEntry}>
                          <ActivityBars level={item.level} />
                          <Caption1 style={{ color: '#605e5c' }}>{item.label}</Caption1>
                        </div>
                      ))}
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
                        <DonutChartSvg segments={archiveStatus} total={archiveTotal} />
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

                  {/* KL-assistent — reserved, empty for now */}
                  <div className={styles.sideSection} />

                  {/* Hurtigoversikt */}
                  <div className={styles.sideSection}>
                    <Subtitle2>Hurtigoversikt</Subtitle2>
                    <div className={styles.quickList}>
                      {quickStats.map((s: IQuickStat, i: number) => (
                        <div key={i} className={styles.quickRow}>
                          <div className={styles.quickRowIcon}>{QUICK_STAT_ICONS[i]}</div>
                          <span className={styles.quickRowLabel}>{s.label}</span>
                          <span className={styles.quickRowValue}>{s.value}</span>
                          <ChevronRightRegular fontSize={14} style={{ color: '#a0a0a0' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Om arkivstatus */}
                  <div className={styles.sideSection}>
                    <div className={styles.omArkivHeader}>
                      <InfoRegular fontSize={16} />
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
