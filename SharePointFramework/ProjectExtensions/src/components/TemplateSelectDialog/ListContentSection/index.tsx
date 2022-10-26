import { DetailsList, ScrollablePane, SearchBox, SelectionMode, Sticky, StickyPositionType } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import styles from './ListContentSection.module.scss'
import { useListContentSection } from './useListContentSection'

export const ListContentSection: FunctionComponent = () => {
  const { selection, items, onSearch, onRenderRow } = useListContentSection()

  return (
    <div className={styles.root}>
      <div style={{ height: 300 }}>
        <ScrollablePane>
          <DetailsList
            setKey='set'
            selection={selection}
            selectionMode={SelectionMode.multiple}
            selectionPreservedOnEmptyClick={true}
            onRenderRow={onRenderRow}
            onRenderDetailsHeader={(props_, defaultRender) => (
              <Sticky stickyPosition={StickyPositionType.Header} >
                <SearchBox
                  className={styles.searchBox}
                  placeholder={strings.ListContentSectionSearchPlaceholder}
                  onChange={(_, newValue) => onSearch(newValue)}
                  onSearch={(newValue) => onSearch(newValue)}
                />
                {defaultRender(props_)}
              </Sticky>
            )}
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
