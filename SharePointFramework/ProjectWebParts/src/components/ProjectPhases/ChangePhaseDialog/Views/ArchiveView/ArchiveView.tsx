import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import {
  Checkbox,
  Text,
  Button,
  Spinner
} from '@fluentui/react-components'
import {
  ChevronRight16Regular,
  Document16Regular,
  List16Regular,
  Folder16Regular
} from '@fluentui/react-icons'
import styles from './ArchiveView.module.scss'
import { useArchiveView } from './useArchiveView'
import { IArchiveItem } from './types'

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
      <Text size={500} weight="semibold">
        {strings.ArchiveViewTitle}
      </Text>

      <Text size={300}>
        {strings.ArchiveViewDescription}
      </Text>

      {sections.map((section) => (
        <div key={section.key} className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(section.key)}
            role="button"
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
            <Text size={400} weight="semibold">
              {section.title} ({section.items.filter(item => item.selected).length}/{section.items.length})
            </Text>
          </div>

          {section.expanded && (
            <div className={styles.sectionContent}>
              {section.items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <Checkbox
                    checked={item.selected}
                    onChange={() => toggleItemSelection(section.key, item.id)}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getItemIcon(item)}
                        <Text className={styles.itemTitle}>
                          {item.title}
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

      {selectedCount > 0 && (
        <div className={styles.selectedItemsInfo}>
          <Text size={300} weight="semibold">
            {strings.ArchiveSelectedItemsInfo.replace('{0}', selectedCount.toString()).replace('{1}', selectedCount !== 1 ? 'er' : '')}
          </Text>
        </div>
      )}
    </div>
  )
}
