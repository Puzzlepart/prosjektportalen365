import {
  DetailsList, ScrollablePane,
  SearchBox,
  SelectAllVisibility,
  SelectionMode,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
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
            <Sticky stickyPosition={StickyPositionType.Header}>
              <div className={styles.searchBox} hidden={items.length < 5}>
                <SearchBox
                  placeholder={strings.ExtensionsSectionSearchPlaceholder}
                  onChange={(_, newValue) => onSearch(newValue)}
                  onSearch={(newValue) => onSearch(newValue)}
                />
              </div>
              {defaultRender({
                ...detailsHeaderProps,
                selectAllVisibility: SelectAllVisibility.hidden
              })}
            </Sticky>
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
