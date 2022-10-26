import { DetailsList, ScrollablePane, SearchBox, SelectionMode } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import styles from './ListContentSection.module.scss'
import { useListContentSection } from './useListContentSection'

export const ListContentSection: FunctionComponent = () => {
  const { selection, items, onSearch, onRenderRow } = useListContentSection()

  return (
    <div className={styles.root}>
      <SearchBox
        placeholder={strings.ListContentSectionSearchPlaceholder}
        onChange={(_, newValue) => onSearch(newValue)}
        onSearch={(newValue) => onSearch(newValue)}
      />
      <div style={{ height: 300 }}>
        <ScrollablePane>
          <DetailsList
            setKey='set'
            selection={selection}
            selectionMode={SelectionMode.multiple}
            selectionPreservedOnEmptyClick={true}
            onRenderRow={onRenderRow}
            items={items}
            columns={[
              {
                key: 'text',
                fieldName: 'text',
                name: strings.TitleLabel,
                minWidth: 150,
                maxWidth: 150
              },
              {
                key: 'subText',
                fieldName: 'subText',
                name: strings.DescriptionLabel,
                minWidth: 250
              }
            ]}
          />
        </ScrollablePane>
      </div>
    </div>
  )
}
