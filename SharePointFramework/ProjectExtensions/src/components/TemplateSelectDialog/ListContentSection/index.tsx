import {
  DetailsList,
  ScrollablePane,
  SelectionMode,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { ListHeaderSearch } from '../ListHeaderSearch'
import { TemplateListContentConfigMessage } from '../TemplateListContentConfigMessage'
import { TemplateSelectDialogSectionComponent } from '../types'
import styles from './ListContentSection.module.scss'
import { useListContentSection } from './useListContentSection'

export const ListContentSection: TemplateSelectDialogSectionComponent = (props) => {
  const context = useContext(TemplateSelectDialogContext)
  const { selection, items, columns, onSearch, onRenderRow } = useListContentSection()

  return (
    <div className={styles.root} style={props.style}>
      <ScrollablePane>
        <DetailsList
          setKey='set'
          selection={selection}
          selectionMode={SelectionMode.multiple}
          selectionPreservedOnEmptyClick={true}
          onRenderRow={onRenderRow}
          onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
            <ListHeaderSearch
              detailsHeaderProps={detailsHeaderProps}
              defaultRender={defaultRender}
              search={{
                placeholder: strings.ListContentSectionSearchPlaceholder,
                onSearch,
                hidden: items.length < 5
              }}
            />
          )}
          onRenderDetailsFooter={() => (
            <Sticky stickyPosition={StickyPositionType.Footer}>
              {context.state.selectedTemplate?.extensionIds && <TemplateListContentConfigMessage />}
            </Sticky>
          )}
          items={items}
          columns={columns}
        />
      </ScrollablePane>
    </div>
  )
}
