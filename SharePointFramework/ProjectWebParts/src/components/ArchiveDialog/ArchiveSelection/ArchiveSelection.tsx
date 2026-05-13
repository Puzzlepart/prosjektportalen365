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

interface ISectionCardProps {
  section: IArchiveSection
  variant: 'documents' | 'lists'
  HeaderIcon: FC<{ className?: string }>
  onToggleItem: (sectionKey: string, itemId: string | number) => void
  onToggleSelectAll: (sectionKey: string) => void
}

const docColumns: TableColumnDefinition<IArchiveItem>[] = [
  createTableColumn<IArchiveItem>({
    columnId: 'name',
    compare: (a, b) => a.title.localeCompare(b.title)
  }),
  createTableColumn<IArchiveItem>({
    columnId: 'modified',
    compare: (a, b) => (a.dateModified || '').localeCompare(b.dateModified || '')
  })
]

const docColumnSizing: TableColumnSizingOptions = {
  name: { defaultWidth: 220, minWidth: 140, idealWidth: 320 },
  modified: { defaultWidth: 100, minWidth: 90, idealWidth: 100 }
}

const listColumns: TableColumnDefinition<IArchiveItem>[] = [
  createTableColumn<IArchiveItem>({
    columnId: 'name',
    compare: (a, b) => a.title.localeCompare(b.title)
  }),
  createTableColumn<IArchiveItem>({
    columnId: 'itemCount',
    compare: (a, b) => (a.itemCount ?? 0) - (b.itemCount ?? 0)
  })
]

const listColumnSizing: TableColumnSizingOptions = {
  name: { defaultWidth: 260, minWidth: 140, idealWidth: 300 },
  itemCount: { defaultWidth: 32, minWidth: 32, idealWidth: 32 }
}

const itemCountCellStyle: React.CSSProperties = {
  width: 32,
  minWidth: 32,
  maxWidth: 32
}

interface IDocumentsTableProps {
  items: IArchiveItem[]
  sectionKey: string
  onToggleItem: (sectionKey: string, itemId: string | number) => void
  onToggleSelectAll: (sectionKey: string) => void
  allSelected: boolean
  someSelected: boolean
}

const DocumentsTable: FC<IDocumentsTableProps> = ({
  items,
  sectionKey,
  onToggleItem,
  onToggleSelectAll,
  allSelected,
  someSelected
}) => {
  const { sortedRows, headerSortProps, columnSizing_unstable, tableRef } = useArchiveTable(
    items,
    docColumns,
    docColumnSizing
  )
  return (
    <Table
      ref={tableRef}
      size='small'
      sortable
      aria-label={strings.ArchiveDocumentsSection}
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
          <TableHeaderCell
            {...headerSortProps('modified')}
            {...columnSizing_unstable.getTableHeaderCellProps('modified')}
          >
            {strings.ArchiveTableColumnModified}
          </TableHeaderCell>
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
              <div className={styles.nameCell}>
                <FileTypeIcon extension={item.title} size={16} className={styles.itemIcon} />
                <div className={styles.nameCellText}>
                  <span className={styles.itemTitleRow}>
                    <span className={styles.itemTitle} title={item.title}>
                      {item.title}
                    </span>
                    <ModifiedAfterArchiveBadge item={item} />
                  </span>
                  <PreviousArchiveLabel item={item} />
                </div>
              </div>
            </TableCell>
            <TableCell
              {...columnSizing_unstable.getTableCellProps('modified')}
              className={item.disabled ? styles.disabledRow : undefined}
            >
              {formatShortDate(item.dateModified)}
            </TableCell>
            <TableCell className={styles.indicatorCell} style={indicatorCellStyle}>
              {item.disabled && (
                <Tooltip content={strings.ArchiveNotArchivableText} relationship='label' withArrow>
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

interface IListsTableProps {
  items: IArchiveItem[]
  sectionKey: string
  onToggleItem: (sectionKey: string, itemId: string | number) => void
  onToggleSelectAll: (sectionKey: string) => void
  allSelected: boolean
  someSelected: boolean
}

const ListsTable: FC<IListsTableProps> = ({
  items,
  sectionKey,
  onToggleItem,
  onToggleSelectAll,
  allSelected,
  someSelected
}) => {
  const { sortedRows, headerSortProps, columnSizing_unstable, tableRef } = useArchiveTable(
    items,
    listColumns,
    listColumnSizing
  )
  return (
    <Table
      ref={tableRef}
      size='small'
      sortable
      aria-label={strings.ArchiveListsSection}
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
          <Tooltip content={strings.ArchiveTableColumnItemCount} relationship='label' withArrow>
            <TableHeaderCell
              {...headerSortProps('itemCount')}
              {...columnSizing_unstable.getTableHeaderCellProps('itemCount')}
              style={itemCountCellStyle}
              aria-label={strings.ArchiveTableColumnItemCount}
            >
              #
            </TableHeaderCell>
          </Tooltip>
          <TableHeaderCell className={styles.indicatorCell} style={indicatorCellStyle} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map(({ item }) => {
          const tooltipText =
            item.itemCount === 0
              ? strings.ArchiveNotArchivableListText
              : strings.ArchiveNotArchivableText
          return (
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
                <div className={styles.nameCellText}>
                  <span className={styles.itemTitle} title={item.title}>
                    {item.title}
                  </span>
                  <PreviousArchiveLabel item={item} />
                </div>
              </TableCell>
              <TableCell
                {...columnSizing_unstable.getTableCellProps('itemCount')}
                style={itemCountCellStyle}
                className={item.disabled ? styles.disabledRow : undefined}
              >
                {item.itemCount ?? 0}
              </TableCell>
              <TableCell className={styles.indicatorCell} style={indicatorCellStyle}>
                {item.disabled && (
                  <Tooltip content={tooltipText} relationship='label' withArrow>
                    <Info16Regular className={styles.indicatorIcon} />
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

const SectionCard: FC<ISectionCardProps> = ({
  section,
  variant,
  HeaderIcon,
  onToggleItem,
  onToggleSelectAll
}) => {
  const selectedCount = section.items.filter((item) => item.selected).length
  const enabledItems = section.items.filter((item) => !item.disabled)
  const allSelected = enabledItems.length > 0 && enabledItems.every((item) => item.selected)
  const someSelected = selectedCount > 0 && !allSelected
  const isDocuments = variant === 'documents'

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <HeaderIcon className={styles.sectionIcon} />
        <Text size={400} className={styles.title}>
          {section.title}
        </Text>
        <span
          className={`${styles.countBadge} ${selectedCount > 0 ? styles.hasSelection : ''}`}
          aria-label={`${selectedCount} av ${section.items.length} valgt`}
        >
          {selectedCount}/{section.items.length}
        </span>
      </div>

      <div className={styles.sectionContent}>
        {isDocuments ? (
          <DocumentsTable
            items={section.items}
            sectionKey={section.key}
            onToggleItem={onToggleItem}
            onToggleSelectAll={onToggleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
          />
        ) : (
          <ListsTable
            items={section.items}
            sectionKey={section.key}
            onToggleItem={onToggleItem}
            onToggleSelectAll={onToggleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
          />
        )}
      </div>
    </div>
  )
}

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
            variant='documents'
            HeaderIcon={DocumentMultiple20Regular}
            onToggleItem={toggleItemSelection}
            onToggleSelectAll={toggleSectionSelectAll}
          />
        )}
        {listsSection && (
          <SectionCard
            section={listsSection}
            variant='lists'
            HeaderIcon={ListBar20Regular}
            onToggleItem={toggleItemSelection}
            onToggleSelectAll={toggleSectionSelectAll}
          />
        )}
      </div>
    </div>
  )
}
