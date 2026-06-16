import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import {
  Badge,
  Skeleton,
  SkeletonItem,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableSelectionCell,
  Text,
  Tooltip,
  createTableColumn,
  TableColumnDefinition,
  TableColumnSizingOptions
} from '@fluentui/react-components'
import {
  ChevronDown16Regular,
  DocumentMultiple20Regular,
  Info16Regular,
  Info20Regular,
  ListBar20Regular
} from '@fluentui/react-icons'
import styles from './ArchiveSelection.module.scss'
import { useArchiveSelection } from './useArchiveSelection'
import { useArchiveTable } from './useArchiveTable'
import { IArchiveItem, IArchiveSection, IArchiveSelectionProps } from './types'
import { format } from '@fluentui/react'
import { FileTypeIcon } from 'pp365-shared-library'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const formatShortDate = (value?: string): string => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const selectCellStyle: React.CSSProperties = {
  width: 32,
  minWidth: 32,
  maxWidth: 32,
  paddingLeft: 0,
  paddingRight: 0
}

const indicatorCellStyle: React.CSSProperties = {
  width: 36,
  minWidth: 36,
  maxWidth: 36,
  textAlign: 'center'
}

const itemCountCellStyle: React.CSSProperties = {
  width: 32,
  minWidth: 32,
  maxWidth: 32
}

const getStatusClass = (status: string): string => {
  switch (status) {
    case strings.ArchiveLogStatusSuccess:
      return styles.success
    case strings.ArchiveLogStatusError:
      return styles.error
    case strings.ArchiveLogStatusWarning:
      return styles.warning
    case strings.ArchiveLogStatusInProgress:
      return styles.inProgress
    default:
      return ''
  }
}

const wasModifiedAfterArchive = (item: IArchiveItem): boolean => {
  if (!item.previousArchive || !item.dateModified) return false
  return new Date(item.dateModified).getTime() > item.previousArchive.date.getTime()
}

const ModifiedAfterArchiveBadge: FC<{ item: IArchiveItem }> = ({ item }) => {
  if (!wasModifiedAfterArchive(item)) return null
  return (
    <Badge appearance='outline' color='warning' size='small'>
      {strings.ArchiveItemModifiedAfterArchive}
    </Badge>
  )
}

const PreviousArchiveLabel: FC<{ item: IArchiveItem }> = ({ item }) => {
  if (!item.previousArchive) return null
  const dateLabel = item.previousArchive.date.toLocaleDateString()
  const renamedLabel =
    item.previousArchive.titleAtTimeOfArchive &&
    item.previousArchive.titleAtTimeOfArchive !== item.title
      ? ` ${format(
          strings.ArchiveItemPreviouslyArchivedAs,
          item.previousArchive.titleAtTimeOfArchive
        )}`
      : ''
  return (
    <Text
      size={200}
      className={`${styles.previousArchive} ${getStatusClass(item.previousArchive.status)}`}
    >
      {format(strings.ArchiveItemPreviouslyArchived, dateLabel, item.previousArchive.status)}
      {renamedLabel}
    </Text>
  )
}

const InfoCard: FC = () => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={styles.infoCard}>
      <button
        type='button'
        className={styles.infoCardHeader}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <Info20Regular className={styles.infoIcon} />
        <span className={styles.infoHeaderText}>
          <Text className={styles.infoTitle}>{strings.ArchiveInformationTitle}</Text>
          <Text className={styles.infoIntro}>{strings.ArchiveInformationIntro}</Text>
        </span>
        <span className={styles.infoToggle}>
          {expanded ? strings.ArchiveInformationShowLess : strings.ArchiveInformationShowMore}
          <ChevronDown16Regular
            className={`${styles.infoChevron} ${expanded ? styles.expanded : ''}`}
          />
        </span>
      </button>
      {expanded && (
        <div className={styles.infoBody}>
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {strings.ArchiveInformationText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

/**
 * Per-variant configuration for {@link ArchiveTable}. Documents and lists share
 * the same table shape (selection + name + one extra column + a disabled
 * indicator) and differ only in the values captured here.
 */
interface IArchiveTableConfig {
  ariaLabel: string
  columns: TableColumnDefinition<IArchiveItem>[]
  columnSizing: TableColumnSizingOptions
  /** Show a file-type icon + "modified after archive" badge in the name cell (documents). */
  showFileMeta: boolean
  secondColumn: {
    columnId: string
    header: string
    /** When set, the header is wrapped in a tooltip and gets this aria-label. */
    headerTooltip?: string
    headerStyle?: React.CSSProperties
    cellStyle?: React.CSSProperties
    renderCell: (item: IArchiveItem) => React.ReactNode
  }
  getDisabledTooltip: (item: IArchiveItem) => string
}

const DOCUMENTS_TABLE_CONFIG: IArchiveTableConfig = {
  ariaLabel: strings.ArchiveDocumentsSection,
  columns: [
    createTableColumn<IArchiveItem>({
      columnId: 'name',
      compare: (a, b) => a.title.localeCompare(b.title)
    }),
    createTableColumn<IArchiveItem>({
      columnId: 'modified',
      compare: (a, b) => (a.dateModified || '').localeCompare(b.dateModified || '')
    })
  ],
  columnSizing: {
    name: { defaultWidth: 220, minWidth: 140, idealWidth: 320 },
    modified: { defaultWidth: 100, minWidth: 90, idealWidth: 100 }
  },
  showFileMeta: true,
  secondColumn: {
    columnId: 'modified',
    header: strings.ArchiveTableColumnModified,
    renderCell: (item) => formatShortDate(item.dateModified)
  },
  getDisabledTooltip: () => strings.ArchiveNotArchivableText
}

const LISTS_TABLE_CONFIG: IArchiveTableConfig = {
  ariaLabel: strings.ArchiveListsSection,
  columns: [
    createTableColumn<IArchiveItem>({
      columnId: 'name',
      compare: (a, b) => a.title.localeCompare(b.title)
    }),
    createTableColumn<IArchiveItem>({
      columnId: 'itemCount',
      compare: (a, b) => (a.itemCount ?? 0) - (b.itemCount ?? 0)
    })
  ],
  columnSizing: {
    name: { defaultWidth: 260, minWidth: 140, idealWidth: 300 },
    itemCount: { defaultWidth: 32, minWidth: 32, idealWidth: 32 }
  },
  showFileMeta: false,
  secondColumn: {
    columnId: 'itemCount',
    header: '#',
    headerTooltip: strings.ArchiveTableColumnItemCount,
    headerStyle: itemCountCellStyle,
    cellStyle: itemCountCellStyle,
    renderCell: (item) => item.itemCount ?? 0
  },
  getDisabledTooltip: (item) =>
    item.itemCount === 0 ? strings.ArchiveNotArchivableListText : strings.ArchiveNotArchivableText
}

const NameCell: FC<{ item: IArchiveItem; showFileMeta: boolean }> = ({ item, showFileMeta }) => {
  const text = (
    <div className={styles.nameCellText}>
      <span className={styles.itemTitleRow}>
        <span className={styles.itemTitle} title={item.title}>
          {item.title}
        </span>
        {showFileMeta && <ModifiedAfterArchiveBadge item={item} />}
      </span>
      <PreviousArchiveLabel item={item} />
    </div>
  )
  if (!showFileMeta) return text
  return (
    <div className={styles.nameCell}>
      <FileTypeIcon extension={item.title} size={16} className={styles.itemIcon} />
      {text}
    </div>
  )
}

interface IArchiveTableProps {
  items: IArchiveItem[]
  sectionKey: string
  allSelected: boolean
  someSelected: boolean
  onToggleItem: (sectionKey: string, itemId: string | number) => void
  onToggleSelectAll: (sectionKey: string) => void
  config: IArchiveTableConfig
}

/**
 * Selectable, sortable table of archivable items. Shared by the documents and
 * lists sections — see {@link IArchiveTableConfig} for the per-variant pieces.
 */
const ArchiveTable: FC<IArchiveTableProps> = ({
  items,
  sectionKey,
  allSelected,
  someSelected,
  onToggleItem,
  onToggleSelectAll,
  config
}) => {
  const { sortedRows, headerSortProps, columnSizing_unstable, tableRef } = useArchiveTable(
    items,
    config.columns,
    config.columnSizing
  )
  const { secondColumn } = config

  const secondHeaderCell = (
    <TableHeaderCell
      {...headerSortProps(secondColumn.columnId)}
      {...columnSizing_unstable.getTableHeaderCellProps(secondColumn.columnId)}
      style={secondColumn.headerStyle}
      aria-label={secondColumn.headerTooltip}
    >
      {secondColumn.header}
    </TableHeaderCell>
  )

  return (
    <Table
      ref={tableRef}
      size='small'
      sortable
      aria-label={config.ariaLabel}
      {...columnSizing_unstable.getTableProps()}
    >
      <TableHeader>
        <TableRow>
          <TableSelectionCell
            type='checkbox'
            checked={allSelected ? true : someSelected ? 'mixed' : false}
            onClick={() => onToggleSelectAll(sectionKey)}
            style={selectCellStyle}
          />
          <TableHeaderCell
            {...headerSortProps('name')}
            {...columnSizing_unstable.getTableHeaderCellProps('name')}
          >
            {strings.ArchiveTableColumnName}
          </TableHeaderCell>
          {secondColumn.headerTooltip ? (
            <Tooltip content={secondColumn.headerTooltip} relationship='label' withArrow>
              {secondHeaderCell}
            </Tooltip>
          ) : (
            secondHeaderCell
          )}
          <TableHeaderCell className={styles.indicatorCell} style={indicatorCellStyle} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map(({ item }) => (
          <TableRow
            key={item.id}
            className={item.selected ? styles.selectedRow : undefined}
            aria-disabled={item.disabled}
          >
            <TableSelectionCell
              type='checkbox'
              checked={item.selected}
              onClick={() => !item.disabled && onToggleItem(sectionKey, item.id)}
              style={selectCellStyle}
            />
            <TableCell
              {...columnSizing_unstable.getTableCellProps('name')}
              className={item.disabled ? styles.disabledRow : undefined}
            >
              <NameCell item={item} showFileMeta={config.showFileMeta} />
            </TableCell>
            <TableCell
              {...columnSizing_unstable.getTableCellProps(secondColumn.columnId)}
              style={secondColumn.cellStyle}
              className={item.disabled ? styles.disabledRow : undefined}
            >
              {secondColumn.renderCell(item)}
            </TableCell>
            <TableCell className={styles.indicatorCell} style={indicatorCellStyle}>
              {item.disabled && (
                <Tooltip content={config.getDisabledTooltip(item)} relationship='label' withArrow>
                  <Info16Regular className={styles.indicatorIcon} />
                </Tooltip>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface ISectionCardProps {
  section: IArchiveSection
  config: IArchiveTableConfig
  HeaderIcon: FC<{ className?: string }>
  onToggleItem: (sectionKey: string, itemId: string | number) => void
  onToggleSelectAll: (sectionKey: string) => void
}

const SectionCard: FC<ISectionCardProps> = ({
  section,
  config,
  HeaderIcon,
  onToggleItem,
  onToggleSelectAll
}) => (
  <div className={styles.sectionCard}>
    <div className={styles.sectionHeader}>
      <HeaderIcon className={styles.sectionIcon} />
      <Text size={400} className={styles.title}>
        {section.title}
      </Text>
      <span
        className={`${styles.countBadge} ${section.selectedCount > 0 ? styles.hasSelection : ''}`}
        aria-label={format(
          strings.ArchiveSectionSelectedCountAria,
          section.selectedCount,
          section.items.length
        )}
      >
        {section.selectedCount}/{section.items.length}
      </span>
    </div>

    <div className={styles.sectionContent}>
      <ArchiveTable
        items={section.items}
        sectionKey={section.key}
        allSelected={section.allSelected}
        someSelected={section.someSelected}
        onToggleItem={onToggleItem}
        onToggleSelectAll={onToggleSelectAll}
        config={config}
      />
    </div>
  </div>
)

const SectionSkeleton: FC = () => (
  <div className={styles.sectionCard}>
    <div className={styles.sectionHeader}>
      <SkeletonItem shape='square' size={20} style={{ width: 20, flexShrink: 0 }} />
      <SkeletonItem size={20} style={{ width: '40%' }} />
      <SkeletonItem size={16} style={{ width: 40, flexShrink: 0 }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 4px' }}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
          <SkeletonItem shape='square' size={16} style={{ width: 16, flexShrink: 0 }} />
          <SkeletonItem size={16} style={{ flexGrow: 1, maxWidth: `${85 - idx * 6}%` }} />
        </div>
      ))}
    </div>
  </div>
)

const ArchiveSelectionSkeleton: FC = () => (
  <Skeleton className={styles.archiveSelection} aria-label={strings.ArchiveLoadingText}>
    <div className={styles.infoCard} style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <SkeletonItem shape='square' size={20} style={{ width: 20, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonItem size={16} style={{ width: '30%' }} />
          <SkeletonItem size={12} style={{ width: '80%' }} />
        </div>
      </div>
    </div>
    <div className={styles.sectionsGrid}>
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  </Skeleton>
)

export const ArchiveSelection: FC<IArchiveSelectionProps> = (props) => {
  const { sections, toggleItemSelection, toggleSectionSelectAll } = useArchiveSelection(props)

  if (props.isLoading) {
    return <ArchiveSelectionSkeleton />
  }

  const documentsSection = sections.find((s) => s.key === 'documents')
  const listsSection = sections.find((s) => s.key === 'lists')

  return (
    <div className={styles.archiveSelection}>
      <InfoCard />

      <div className={styles.sectionsGrid}>
        {documentsSection && (
          <SectionCard
            section={documentsSection}
            config={DOCUMENTS_TABLE_CONFIG}
            HeaderIcon={DocumentMultiple20Regular}
            onToggleItem={toggleItemSelection}
            onToggleSelectAll={toggleSectionSelectAll}
          />
        )}
        {listsSection && (
          <SectionCard
            section={listsSection}
            config={LISTS_TABLE_CONFIG}
            HeaderIcon={ListBar20Regular}
            onToggleItem={toggleItemSelection}
            onToggleSelectAll={toggleSectionSelectAll}
          />
        )}
      </div>
    </div>
  )
}
