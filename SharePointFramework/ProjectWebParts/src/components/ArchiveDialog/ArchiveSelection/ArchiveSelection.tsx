import * as strings from 'ProjectWebPartsStrings'
import React, { FC, ReactNode, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  makeStyles,
  Menu,
  MenuDivider,
  MenuItem,
  MenuItemCheckbox,
  MenuList,
  MenuPopover,
  MenuTrigger,
  mergeClasses,
  SearchBoxProps,
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
  tokens,
  Tooltip,
  createTableColumn,
  TableColumnDefinition,
  TableColumnSizingOptions
} from '@fluentui/react-components'
import {
  ChevronDown16Regular,
  DocumentMultiple20Regular,
  Filter16Regular,
  Info16Regular,
  Info20Regular,
  ListBar20Regular
} from '@fluentui/react-icons'
import styles from './ArchiveSelection.module.scss'
import { useArchiveSelection } from './useArchiveSelection'
import { useArchiveTable } from './useArchiveTable'
import { IArchiveItem, IArchiveSection, IArchiveSelectionProps } from './types'
import { format } from '@fluentui/react'
import { FileTypeIcon, formatDate, ListMenuItem, Toolbar } from 'pp365-shared-library'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const useSelectionStyles = makeStyles({
  /** Green info indicator for archivable documents. */
  indicatorArchivable: {
    color: tokens.colorStatusSuccessForeground1,
    width: '16px',
    height: '16px',
    verticalAlign: 'middle'
  },
  /** Orange (warning) info indicator for non-archivable items. */
  indicatorNotArchivable: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    width: '16px',
    height: '16px',
    verticalAlign: 'middle'
  },
  filterButton: {
    minWidth: 'unset',
    marginLeft: tokens.spacingHorizontalXS
  },
  filterButtonActive: {
    color: tokens.colorBrandForeground1
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalXXS,
    marginTop: tokens.spacingVerticalXS
  },
  metaLabel: {
    fontWeight: tokens.fontWeightSemibold
  },
  emptyFilterText: {
    padding: '16px 4px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  }
})

const selectCellStyle: React.CSSProperties = {
  width: 32,
  minWidth: 32,
  maxWidth: 32,
  paddingLeft: 0,
  paddingRight: 0
}

const itemCountCellStyle: React.CSSProperties = {
  width: 32,
  minWidth: 32,
  maxWidth: 32
}

/** Maps an archive-log status to its coloured previous-archive style. */
function getStatusClass(status: string): string {
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

/** True when the item was modified after it was last archived. */
function wasModifiedAfterArchive(item: IArchiveItem): boolean {
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
  const dateLabel = formatDate(item.previousArchive.date)
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

/**
 * Tooltip content for the green "archivable" indicator: a heading plus the
 * document metadata rows that have data (phase, author, created, modified by,
 * modified).
 */
const ArchivableTooltipContent: FC<{ item: IArchiveItem }> = ({ item }) => {
  const cls = useSelectionStyles()
  const rows: [string, string][] = []
  if (item.phaseName) rows.push([strings.ArchiveMetaPhaseLabel, item.phaseName])
  if (item.author) rows.push([strings.ArchiveMetaCreatedByLabel, item.author])
  if (item.dateCreated) rows.push([strings.ArchiveMetaCreatedLabel, formatDate(item.dateCreated)])
  if (item.modifiedBy) rows.push([strings.ArchiveMetaModifiedByLabel, item.modifiedBy])
  if (item.dateModified) {
    rows.push([strings.ArchiveMetaModifiedLabel, formatDate(item.dateModified)])
  }
  return (
    <div>
      <Text weight='semibold' block>
        {strings.ArchiveArchivableText}
      </Text>
      {rows.length > 0 && (
        <div className={cls.metaGrid}>
          {rows.map(([label, value]) => (
            <React.Fragment key={label}>
              <span className={cls.metaLabel}>{label}</span>
              <span>{value}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
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
 * An extra (non-name) column in an {@link ArchiveTable}.
 */
interface IArchiveTableExtraColumn {
  columnId: string
  header: string
  /** When set, the header is wrapped in a tooltip and gets this aria-label. */
  headerTooltip?: string
  headerStyle?: React.CSSProperties
  cellStyle?: React.CSSProperties
  renderCell: (item: IArchiveItem) => ReactNode
  /** Extra header content rendered after the label (e.g. the filter kebab). */
  renderHeaderExtra?: () => ReactNode
}

/**
 * Per-variant configuration for {@link ArchiveTable}. Documents and lists share
 * the same table shape (selection + name + extra columns + an indicator) and
 * differ only in the values captured here.
 */
interface IArchiveTableConfig {
  ariaLabel: string
  columns: TableColumnDefinition<IArchiveItem>[]
  columnSizing: TableColumnSizingOptions
  /** Show a file-type icon + "modified after archive" badge in the name cell (documents). */
  showFileMeta: boolean
  extraColumns: IArchiveTableExtraColumn[]
  getDisabledTooltip: (item: IArchiveItem) => string
  /**
   * When provided, archivable (enabled) rows get a green info indicator whose
   * tooltip renders this content (documents only).
   */
  renderArchivableTooltip?: (item: IArchiveItem) => JSX.Element
}

/**
 * Builds the documents-table config. Dynamic because the "Dokumenttype" column
 * only shows when the library has the field, and its filter kebab needs the
 * current filter state.
 */
function buildDocumentsTableConfig(
  showDocumentType: boolean,
  renderDocumentTypeFilter: (() => ReactNode) | undefined
): IArchiveTableConfig {
  const columns = [
    createTableColumn<IArchiveItem>({
      columnId: 'name',
      compare: (a, b) => a.title.localeCompare(b.title)
    }),
    ...(showDocumentType
      ? [
          createTableColumn<IArchiveItem>({
            columnId: 'documentType',
            compare: (a, b) => (a.documentTypeName || '').localeCompare(b.documentTypeName || '')
          })
        ]
      : []),
    createTableColumn<IArchiveItem>({
      columnId: 'modified',
      compare: (a, b) => (a.dateModified || '').localeCompare(b.dateModified || '')
    })
  ]
  const columnSizing: TableColumnSizingOptions = {
    name: { defaultWidth: 220, minWidth: 140, idealWidth: 320 },
    ...(showDocumentType
      ? { documentType: { defaultWidth: 140, minWidth: 100, idealWidth: 160 } }
      : {}),
    modified: { defaultWidth: 150, minWidth: 120, idealWidth: 170 }
  }
  const extraColumns: IArchiveTableExtraColumn[] = [
    ...(showDocumentType
      ? [
          {
            columnId: 'documentType',
            header: strings.ArchiveTableColumnDocumentType,
            renderCell: (item: IArchiveItem) => item.documentTypeName || '',
            renderHeaderExtra: renderDocumentTypeFilter
          }
        ]
      : []),
    {
      columnId: 'modified',
      header: strings.ArchiveTableColumnModified,
      renderCell: (item: IArchiveItem) => formatDate(item.dateModified)
    }
  ]
  return {
    ariaLabel: strings.ArchiveDocumentsSection,
    columns,
    columnSizing,
    showFileMeta: true,
    extraColumns,
    getDisabledTooltip: (item) => {
      if (item.documentTypeName) {
        return format(strings.ArchiveNotArchivableDocumentText, item.documentTypeName)
      }
      if (!item.documentTypeId) {
        return strings.ArchiveNotArchivableNoDocumentTypeText
      }
      return strings.ArchiveNotArchivableText
    },
    renderArchivableTooltip: (item) => <ArchivableTooltipContent item={item} />
  }
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
  extraColumns: [
    {
      columnId: 'itemCount',
      header: '#',
      headerTooltip: strings.ArchiveTableColumnItemCount,
      headerStyle: itemCountCellStyle,
      cellStyle: itemCountCellStyle,
      renderCell: (item) => item.itemCount ?? 0
    }
  ],
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
  const cls = useSelectionStyles()
  const { sortedRows, headerSortProps, columnSizing_unstable, tableRef } = useArchiveTable(
    items,
    config.columns,
    config.columnSizing
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
          {config.extraColumns.map((column) => {
            const cell = (
              <TableHeaderCell
                key={column.columnId}
                {...headerSortProps(column.columnId)}
                {...columnSizing_unstable.getTableHeaderCellProps(column.columnId)}
                style={column.headerStyle}
                aria-label={column.headerTooltip}
              >
                {column.header}
                {column.renderHeaderExtra?.()}
              </TableHeaderCell>
            )
            return column.headerTooltip ? (
              <Tooltip
                key={column.columnId}
                content={column.headerTooltip}
                relationship='label'
                withArrow
              >
                {cell}
              </Tooltip>
            ) : (
              cell
            )
          })}
          <TableHeaderCell className={styles.indicatorCell} />
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
            {config.extraColumns.map((column) => (
              <TableCell
                key={column.columnId}
                {...columnSizing_unstable.getTableCellProps(column.columnId)}
                style={column.cellStyle}
                className={item.disabled ? styles.disabledRow : undefined}
              >
                {column.renderCell(item)}
              </TableCell>
            ))}
            <TableCell className={styles.indicatorCell}>
              {item.disabled ? (
                <Tooltip content={config.getDisabledTooltip(item)} relationship='label' withArrow>
                  <Info16Regular className={cls.indicatorNotArchivable} />
                </Tooltip>
              ) : config.renderArchivableTooltip ? (
                <Tooltip
                  content={config.renderArchivableTooltip(item)}
                  relationship='description'
                  withArrow
                >
                  <Info16Regular className={cls.indicatorArchivable} />
                </Tooltip>
              ) : null}
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
  /** Optional toolbar (search/filters) rendered between the header and the table. */
  toolbar?: ReactNode
  /** Shown instead of the table when there are no rows (e.g. no filter matches). */
  emptyText?: string
}

const SectionCard: FC<ISectionCardProps> = ({
  section,
  config,
  HeaderIcon,
  onToggleItem,
  onToggleSelectAll,
  toolbar,
  emptyText
}) => {
  const cls = useSelectionStyles()
  return (
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

      {toolbar}

      <div className={styles.sectionContent}>
        {section.items.length === 0 && emptyText ? (
          <Text size={200} className={cls.emptyFilterText}>
            {emptyText}
          </Text>
        ) : (
          <ArchiveTable
            items={section.items}
            sectionKey={section.key}
            allSelected={section.allSelected}
            someSelected={section.someSelected}
            onToggleItem={onToggleItem}
            onToggleSelectAll={onToggleSelectAll}
            config={config}
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

/**
 * The shared documents/lists picker for archiving — used by both the manual
 * {@link ArchiveDialog} and the phase-change flow. Renders an info card plus one
 * selectable, sortable table per scope; selection is reported up via
 * `onConfigurationChange` (see {@link useArchiveSelection}). The documents
 * section has a search toolbar and an optional, filterable "Dokumenttype"
 * column; filtering only narrows the view, never the emitted selection.
 */
export const ArchiveSelection: FC<IArchiveSelectionProps> = (props) => {
  const cls = useSelectionStyles()
  const [searchTerm, setSearchTerm] = useState('')
  const [documentTypeIds, setDocumentTypeIds] = useState<string[]>([])
  const { sections, toggleItemSelection, toggleSectionSelectAll } = useArchiveSelection(props, {
    searchTerm,
    documentTypeIds
  })

  const showDocumentType =
    props.hasDocumentTypes ??
    props.documents.some((doc) => !!doc.documentTypeId || !!doc.documentTypeName)

  // Distinct document types present on the documents, for the filter menu.
  const documentTypeOptions = useMemo(() => {
    const nameById = new Map<string, string>()
    props.documents.forEach((doc) => {
      if (doc.documentTypeId) {
        nameById.set(doc.documentTypeId, doc.documentTypeName || doc.documentTypeId)
      }
    })
    return Array.from(nameById.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [props.documents])

  if (props.isLoading) {
    return <ArchiveSelectionSkeleton />
  }

  const documentsSection = sections.find((s) => s.key === 'documents')
  const listsSection = sections.find((s) => s.key === 'lists')
  const filtersActive = searchTerm.trim() !== '' || documentTypeIds.length > 0

  const renderDocumentTypeFilter =
    documentTypeOptions.length > 0
      ? () => (
          <Menu
            checkedValues={{ documentType: documentTypeIds }}
            onCheckedValueChange={(_, data) => setDocumentTypeIds(data.checkedItems)}
          >
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance='transparent'
                size='small'
                icon={<Filter16Regular />}
                aria-label={strings.ArchiveFilterDocumentTypeTooltip}
                title={strings.ArchiveFilterDocumentTypeTooltip}
                className={mergeClasses(
                  cls.filterButton,
                  documentTypeIds.length > 0 && cls.filterButtonActive
                )}
                onClick={(e) => e.stopPropagation()}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {documentTypeOptions.map((option) => (
                  <MenuItemCheckbox key={option.id} name='documentType' value={option.id}>
                    {option.name}
                  </MenuItemCheckbox>
                ))}
                <MenuDivider />
                <MenuItem
                  disabled={documentTypeIds.length === 0}
                  onClick={() => setDocumentTypeIds([])}
                >
                  {strings.ArchiveFilterClearText}
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        )
      : undefined

  const documentsConfig = buildDocumentsTableConfig(showDocumentType, renderDocumentTypeFilter)
  const documentsToolbar = (
    <Toolbar
      items={[
        new ListMenuItem().setSearchBox({
          value: searchTerm,
          placeholder: strings.ArchiveSearchDocumentsPlaceholder,
          'aria-label': strings.ArchiveSearchDocumentsPlaceholder,
          onChange: (_, data) => setSearchTerm(data.value)
        } as SearchBoxProps)
      ]}
    />
  )

  return (
    <div className={styles.archiveSelection}>
      <InfoCard />

      <div className={styles.sectionsGrid}>
        {documentsSection && (
          <SectionCard
            section={documentsSection}
            config={documentsConfig}
            HeaderIcon={DocumentMultiple20Regular}
            onToggleItem={toggleItemSelection}
            onToggleSelectAll={toggleSectionSelectAll}
            toolbar={documentsToolbar}
            emptyText={filtersActive ? strings.ArchiveNoFilterResultsText : undefined}
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
