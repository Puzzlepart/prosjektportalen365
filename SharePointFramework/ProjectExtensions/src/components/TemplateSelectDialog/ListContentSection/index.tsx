import { DetailsList, ScrollablePane, SearchBox, SelectionMode, Sticky, StickyPositionType } from '@fluentui/react'
import { SearchableList } from 'components/SearchableList'
import strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import styles from './ListContentSection.module.scss'
import { useListContentSection } from './useListContentSection'

export const ListContentSection: FunctionComponent = () => {
  const { selection, items, onSearch, onRenderRow } = useListContentSection()

  return (
    <div className={styles.root}>
          <SearchableList
           searchBox={{
            placeholder: 
           }}
          onSelectionChanged={}
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
    </div>
  )
}
