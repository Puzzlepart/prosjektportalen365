import {
  Badge,
  Button,
  Caption1,
  Divider,
  FluentProvider,
  IdPrefixProvider,
  Nav,
  NavItem,
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
  MoreHorizontalRegular,
  QuestionCircleRegular,
  SettingsRegular,
  WarningRegular
} from '@fluentui/react-icons'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC, useState } from 'react'
import styles from './ArchiveOverview.module.scss'
import { IArchiveOverviewProps } from './types'

// ─────────────────────────────────────────────────────
// Placeholder data
// ─────────────────────────────────────────────────────

const PENDING = {
  toArchive: { count: 11, docs: 7, lists: 4 },
  failed: { count: 2, docs: 1, lists: 1 }
}

const ARCHIVE_STATUS = [
  { label: 'Arkivert', count: 132, percent: 66.7, color: '#107C10' },
  { label: 'Til arkiv', count: 42, percent: 21.2, color: '#0078D4' },
  { label: 'Feilet', count: 14, percent: 7.1, color: '#D13438' },
  { label: 'Advarsel', count: 10, percent: 5.0, color: '#FFB900' }
]
const ARCHIVE_TOTAL = 198

const PROJECTS = [
  {
    id: 1,
    name: 'Byutvikling Sentrum',
    color: '#107C10',
    lastArchived: 'i dag, 11:15',
    activity: 'high' as const,
    status: 'updated' as const,
    nextArchive: '12. mai 2026'
  },
  {
    id: 2,
    name: 'Kulturhusprosjektet',
    color: '#0078D4',
    lastArchived: 'i går, 14:32',
    activity: 'medium' as const,
    status: 'updated' as const,
    nextArchive: '13. mai 2026'
  },
  {
    id: 3,
    name: 'Skolebygg Planfase',
    color: '#7719AA',
    lastArchived: '9. mai 2026',
    activity: 'medium' as const,
    status: 'updated' as const,
    nextArchive: '16. mai 2026'
  },
  {
    id: 4,
    name: 'Digitaliseringsprogrammet',
    color: '#FFB900',
    lastArchived: '3. mai 2026',
    activity: 'low' as const,
    status: 'warning' as const,
    nextArchive: '20. mai 2026'
  },
  {
    id: 5,
    name: 'Idrettspark Utvikling',
    color: '#D13438',
    lastArchived: 'Aldri arkivert',
    activity: 'none' as const,
    status: 'never' as const,
    nextArchive: '–'
  }
]

const QUICK_STATS = [
  {
    icon: <DocumentRegular fontSize={18} />,
    label: 'Dokumenter arkivert',
    value: 132,
    delta: '+8 denne uken',
    positive: true
  },
  {
    icon: <GridRegular fontSize={18} />,
    label: 'Lister arkivert',
    value: 66,
    delta: '+5 denne uken',
    positive: true
  },
  {
    icon: <WarningRegular fontSize={18} />,
    label: 'Feilede elementer',
    value: 14,
    delta: '-2 denne uken',
    positive: true
  },
  {
    icon: <WarningRegular fontSize={18} />,
    label: 'Advarsler',
    value: 10,
    delta: '+1 denne uken',
    positive: false
  }
]

// ─────────────────────────────────────────────────────
// ActivityBars
// ─────────────────────────────────────────────────────

type ActivityLevel = 'high' | 'medium' | 'low' | 'none'

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
// DonutChartSvg
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

const DonutChartSvg: FC<{
  segments: typeof ARCHIVE_STATUS
  total: number
}> = ({ segments, total }) => {
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

const StatusBadge: FC<{ status: 'updated' | 'warning' | 'never' }> = ({ status }) => {
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
// ArchiveOverview
// ─────────────────────────────────────────────────────

export const ArchiveOverview: FC<IArchiveOverviewProps> = () => {
  const fluentProviderId = useId('fp-archive-overview')
  const [selectedNav, setSelectedNav] = useState<string>('oversikt')

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
        <div className={styles.root}>
          {/* ── Left nav ── */}
          <nav className={styles.navSidebar}>
            <Nav
              className={styles.navItem}
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

            <div className={styles.navFooter}>
              <Nav
                selectedValue={selectedNav}
                onNavItemSelect={(_ev, data) => setSelectedNav(data.value as string)}
              >
                <NavItem icon={<QuestionCircleRegular />} value='hjelp' href='#'>
                  Hjelp
                </NavItem>
              </Nav>
            </div>
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
                  Sist oppdatert: i dag, 11:28
                </Button>
                <Divider vertical style={{ height: 20, margin: '0 4px' }} />
                <Button
                  appearance='subtle'
                  icon={<CalendarMonthRegular />}
                  iconPosition='before'
                  size='small'
                >
                  Siste 30 dager
                </Button>
              </div>
            </div>

            {/* ── Body ── */}
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
                      <div className={styles.cardNumber}>{PENDING.toArchive.count}</div>
                      <div className={styles.cardMeta}>
                        <DocumentRegular fontSize={14} />
                        <Caption1>{PENDING.toArchive.docs} dokumenter</Caption1>
                        <Caption1>•</Caption1>
                        <GridRegular fontSize={14} />
                        <Caption1>{PENDING.toArchive.lists} lister</Caption1>
                      </div>
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
                      <div className={styles.cardNumber}>{PENDING.failed.count}</div>
                      <div className={styles.cardMeta}>
                        <DocumentRegular fontSize={14} />
                        <Caption1>{PENDING.failed.docs} dokument</Caption1>
                        <Caption1>•</Caption1>
                        <GridRegular fontSize={14} />
                        <Caption1>{PENDING.failed.lists} liste</Caption1>
                      </div>
                      <Caption1 style={{ color: '#605e5c' }}>
                        Disse elementene kunne ikke arkiveres.
                      </Caption1>
                      <Button appearance='outline' size='small' className={styles.cardBtn}>
                        Se detaljer
                      </Button>
                    </div>

                    {/* Empty placeholder */}
                    <div className={styles.placeholderCard} />
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
                      {PROJECTS.map((p) => (
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

                  {/* Table footer */}
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
                    <Caption1
                      style={{ color: '#0078D4', cursor: 'pointer', marginLeft: 'auto' }}
                    >
                      Klikk på aktivitetsnivå for detaljer
                    </Caption1>
                  </div>
                </div>
              </div>

              {/* ══ Right sidebar ══ */}
              <div className={styles.sidebar}>
                {/* Arkivstatus */}
                <div className={styles.sideSection}>
                  <Subtitle2>Arkivstatus</Subtitle2>
                  <div className={styles.donutContainer}>
                    <DonutChartSvg segments={ARCHIVE_STATUS} total={ARCHIVE_TOTAL} />
                    <div className={styles.statusLegend}>
                      {ARCHIVE_STATUS.map((s) => (
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

                {/* Empty placeholder */}
                <div className={styles.sideSection} />

                {/* Hurtigoversikt */}
                <div className={styles.sideSection}>
                  <Subtitle2>Hurtigoversikt</Subtitle2>
                  <div className={styles.quickGrid}>
                    {QUICK_STATS.map((s, i) => (
                      <div key={i} className={styles.quickItem}>
                        <div className={styles.quickIcon}>{s.icon}</div>
                        <Caption1 style={{ color: '#605e5c' }}>{s.label}</Caption1>
                        <div className={styles.quickValue}>{s.value}</div>
                        <span className={s.positive ? styles.deltaGreen : styles.deltaRed}>
                          {s.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    appearance='transparent'
                    icon={<ChevronRightRegular />}
                    iconPosition='after'
                    size='small'
                    style={{ color: '#0078D4', padding: 0 }}
                  >
                    Se fullstendig rapport
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

ArchiveOverview.defaultProps = {
  title: 'Archive'
}
