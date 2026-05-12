import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import { Checkbox, Text, Spinner, ToggleButton } from '@fluentui/react-components'
import {
  ChevronDown16Regular,
  ChevronRight16Regular,
  DocumentMultiple20Regular,
  DocumentMultiple16Regular,
  Info20Regular,
  List16Regular,
  ListBar20Regular,
  ListBar16Regular,
  Folder16Regular
} from '@fluentui/react-icons'
import styles from './ArchiveSelection.module.scss'
import { useArchiveSelection } from './useArchiveSelection'
import { IArchiveItem, IArchiveSection, IArchiveSelectionProps } from './types'
import { format } from '@fluentui/react'
import { FileTypeIcon, getFluentIcon } from 'pp365-shared-library'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const getItemIcon = (item: IArchiveItem) => {
  switch (item.type) {
    case 'file':
      return <FileTypeIcon extension={item.title} size={16} className={styles.itemIcon} />
    case 'list':
      return <List16Regular className={styles.itemIcon} />
    case 'folder':
      return <Folder16Regular className={styles.itemIcon} />
    default:
      return <FileTypeIcon extension={item.title} size={16} className={styles.itemIcon} />
  }
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
  HeaderIcon: FC<{ className?: string }>
  onToggleSection: (key: string) => void
  onToggleItem: (sectionKey: string, itemId: string | number) => void
  onToggleSelectAll: (sectionKey: string) => void
}

const SectionCard: FC<ISectionCardProps> = ({
  section,
  HeaderIcon,
  onToggleSection,
  onToggleItem,
  onToggleSelectAll
}) => {
  const selectedCount = section.items.filter((item) => item.selected).length
  const enabledItems = section.items.filter((item) => !item.disabled)
  const allEnabledSelected = enabledItems.length > 0 && enabledItems.every((item) => item.selected)

  return (
    <div className={styles.sectionCard}>
      <div
        className={styles.sectionHeader}
        onClick={() => onToggleSection(section.key)}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleSection(section.key)
          }
        }}
      >
        <ChevronRight16Regular
          className={`${styles.chevron} ${section.expanded ? styles.expanded : ''}`}
        />
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

      {section.expanded && enabledItems.length > 1 && (
        <div className={styles.selectAllButton}>
          <ToggleButton
            appearance='subtle'
            size='small'
            checked={allEnabledSelected}
            icon={allEnabledSelected ? getFluentIcon('SelectAllOn') : getFluentIcon('SelectAllOff')}
            onClick={() => onToggleSelectAll(section.key)}
          >
            {strings.ArchiveSelectAllText}
          </ToggleButton>
        </div>
      )}

      {section.expanded && (
        <div className={styles.sectionContent}>
          {section.items.length === 0 && (
            <Text size={200} className={styles.emptyState}>
              {strings.ArchiveLoadingText}
            </Text>
          )}
          {section.items.map((item) => (
            <div key={item.id} className={`${styles.item} ${item.selected ? styles.selected : ''}`}>
              <Checkbox
                checked={item.selected}
                disabled={item.disabled}
                onChange={() => !item.disabled && onToggleItem(section.key, item.id)}
                label={
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {getItemIcon(item)}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <Text
                        className={`${styles.itemTitle} ${
                          item.disabled ? styles.disabledItem : ''
                        }`}
                      >
                        {item.title}
                        {item.disabled && (
                          <Text size={200} className={styles.notArchivableText}>
                            {item.type === 'list' && item.itemCount === 0
                              ? ` (${strings.ArchiveNotArchivableListText})`
                              : ` (${strings.ArchiveNotArchivableText})`}
                          </Text>
                        )}
                      </Text>
                      <PreviousArchiveLabel item={item} />
                    </div>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export interface ISelectionSummaryProps {
  total: number
  documentsSelected: number
  listsSelected: number
  /**
   * Items to list on the right side (icon + title). Pass selected documents + lists
   * when rendering the summary on a confirm step.
   */
  selectedItems?: IArchiveItem[]
}

export const SelectionSummary: FC<ISelectionSummaryProps> = ({
  total,
  documentsSelected,
  listsSelected,
  selectedItems
}) => {
  const isEmpty = total === 0
  const showItems = !!selectedItems && selectedItems.length > 0
  return (
    <div className={`${styles.summary} ${isEmpty ? styles.empty : ''}`}>
      <div className={styles.summaryLeft}>
        <Text className={styles.summaryNumber}>{total}</Text>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryBody}>
          <Text className={styles.summaryLabel}>
            {isEmpty ? strings.ArchiveSummaryEmpty : strings.ArchiveSummarySelectedLabel}
          </Text>
          {!isEmpty && (
            <div className={styles.summaryBreakdown}>
              <span className={styles.breakdownItem}>
                <DocumentMultiple16Regular className={styles.breakdownIcon} />
                <span>{format(strings.ArchiveSummaryDocumentCount, documentsSelected)}</span>
              </span>
              <span className={styles.dot}>·</span>
              <span className={styles.breakdownItem}>
                <ListBar16Regular className={styles.breakdownIcon} />
                <span>{format(strings.ArchiveSummaryListCount, listsSelected)}</span>
              </span>
            </div>
          )}
          <Text className={styles.summaryHelp}>
            {isEmpty ? strings.ArchiveSummaryEmptyHelp : strings.ArchiveSummaryHelpText}
          </Text>
        </div>
      </div>
      {showItems && (
        <>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryRight}>
            <Text className={styles.summaryItemsHeader}>
              {strings.ArchiveSummarySelectedItemsHeader}
            </Text>
            <div className={styles.summaryItemsList}>
              {selectedItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className={styles.summaryItem}>
                  {item.type === 'list' ? (
                    <ListBar16Regular className={styles.summaryItemIcon} />
                  ) : (
                    <FileTypeIcon
                      extension={item.title}
                      size={16}
                      className={styles.summaryItemIcon}
                    />
                  )}
                  <span className={styles.summaryItemTitle} title={item.title}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const ArchiveSelection: FC<IArchiveSelectionProps> = (props) => {
  const { sections, toggleSection, toggleItemSelection, toggleSectionSelectAll } =
    useArchiveSelection(props)

  if (props.isLoading) {
    return (
      <div className={styles.archiveSelection}>
        <Spinner label={strings.ArchiveLoadingText} />
      </div>
    )
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
            HeaderIcon={DocumentMultiple20Regular}
            onToggleSection={toggleSection}
            onToggleItem={toggleItemSelection}
            onToggleSelectAll={toggleSectionSelectAll}
          />
        )}
        {listsSection && (
          <SectionCard
            section={listsSection}
            HeaderIcon={ListBar20Regular}
            onToggleSection={toggleSection}
            onToggleItem={toggleItemSelection}
            onToggleSelectAll={toggleSectionSelectAll}
          />
        )}
      </div>
    </div>
  )
}
