import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { Checkbox, Text, Spinner, ToggleButton, Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-components'
import {
  ChevronRight16Regular,
  Document16Regular,
  List16Regular,
  Folder16Regular
} from '@fluentui/react-icons'
import styles from './ArchiveView.module.scss'
import { useArchiveView } from './useArchiveView'
import { IArchiveItem } from './types'
import { format } from '@fluentui/react'
import { getFluentIcon, UserMessage } from 'pp365-shared-library'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const getItemIcon = (item: IArchiveItem) => {
  switch (item.type) {
    case 'file':
      return <Document16Regular className={styles.itemIcon} />
    case 'list':
      return <List16Regular className={styles.itemIcon} />
    case 'folder':
      return <Folder16Regular className={styles.itemIcon} />
    default:
      return <Document16Regular className={styles.itemIcon} />
  }
}

export const ArchiveView: FC = () => {
  const {
    sections,
    isLoading,
    toggleSection,
    toggleItemSelection,
    toggleSectionSelectAll,
    getSelectedItemsCount
  } = useArchiveView()

  if (isLoading) {
    return (
      <div className={styles.archiveView}>
        <Spinner label={strings.ArchiveLoadingText} />
      </div>
    )
  }

  const selectedCount = getSelectedItemsCount()

  return (
    <div className={styles.archiveView}>
      <UserMessage
        title={strings.ArchiveInformationTitle}
      >
        <Accordion collapsible>
          <AccordionItem value='1'>
            <AccordionHeader className={styles.accordionHeader}>
              <Text weight='bold'>{strings.ArchiveMoreInformationText}</Text>
            </AccordionHeader>
            <AccordionPanel>
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {strings.ArchiveInformationText}
              </ReactMarkdown>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </UserMessage>
      {sections.map((section) => (
        <div key={section.key} className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(section.key)}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleSection(section.key)
              }
            }}
          >
            <ChevronRight16Regular
              className={`${styles.icon} ${section.expanded ? styles.expanded : ''}`}
            />
            <Text size={400} weight='semibold'>
              {section.title} ({section.items.filter((item) => item.selected).length}/
              {section.items.length})
            </Text>
          </div>

          {section.expanded && section.items.filter((item) => !item.disabled).length > 1 && (
            <div className={styles.selectAllButton}>
              <ToggleButton
                appearance='subtle'
                size='small'
                checked={section.items.filter((item) => !item.disabled).every((item) => item.selected)}
                icon={
                  section.items.filter((item) => !item.disabled).every((item) => item.selected)
                    ? getFluentIcon('SelectAllOn')
                    : getFluentIcon('SelectAllOff')
                }
                onClick={() => toggleSectionSelectAll(section.key)}
              >
                {strings.ArchiveSelectAllText}
              </ToggleButton>
            </div>
          )}

          {section.expanded && (
            <div className={styles.sectionContent}>
              {section.items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <Checkbox
                    checked={item.selected}
                    disabled={item.disabled}
                    onChange={() => !item.disabled && toggleItemSelection(section.key, item.id)}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getItemIcon(item)}
                        <Text className={`${styles.itemTitle} ${item.disabled ? styles.disabledItem : ''}`}>
                          {item.title}
                          {item.disabled && (
                            <Text size={200} className={styles.notArchivableText}>
                              {` (${strings.ArchiveNotArchivableText})`}
                            </Text>
                          )}
                        </Text>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className={styles.selectedItemsInfo}>
        <Text size={300} weight='semibold'>
          {format(strings.ArchiveSelectedItemsInfo, selectedCount)}
        </Text>
      </div>
    </div>
  )
}
