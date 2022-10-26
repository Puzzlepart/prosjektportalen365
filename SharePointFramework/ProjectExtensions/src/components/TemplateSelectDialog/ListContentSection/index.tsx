import { DetailsList, SearchBox, SelectionMode } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import styles from './ListContentSection.module.scss'
import { useListContentSection } from './useListContentSection'

export const ListContentSection: FunctionComponent = () => {
  const { selection, items, onSearch, setKey } = useListContentSection()

  // eslint-disable-next-line no-console
  console.log(setKey)

  return (
    <div className={styles.root}>
      <SearchBox
        placeholder={strings.ListContentSectionSearchPlaceholder}
        onChange={(_, newValue) => onSearch(newValue)}
        onSearch={(newValue) => onSearch(newValue)}
      />
      <DetailsList
        setKey={setKey}
        selection={selection}
        selectionMode={SelectionMode.multiple}
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
