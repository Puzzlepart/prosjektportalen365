import {
  DetailsList,
  ScrollablePane,
  SelectionMode,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React from 'react'
import { ListHeaderSearch } from '../ListHeaderSearch'
import { TemplateConfigMessage } from '../TemplateConfigMessage'
import { TemplateSelectDialogSectionComponent } from '../types'
import styles from './ExtensionsSection.module.scss'
import { useExtensionsSection } from './useExtensionsSection'

/**
 * Section for selection of project extensions.
 *
 * @param props Props
 */
export const ExtensionsSection: TemplateSelectDialogSectionComponent = (props) => {
  const { selection, selectedCount, items, columns, onSearch, onRenderRow } = useExtensionsSection()

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
              selectedCount={selectedCount}
              search={{
                placeholder: strings.ExtensionsSectionSearchPlaceholder,
                onSearch,
                hidden: items.length < 5
              }}
            />
          )}
          onRenderDetailsFooter={() => (
            <Sticky stickyPosition={StickyPositionType.Footer}>
              <TemplateConfigMessage section='ExtensionsSection' />
            </Sticky>
          )}
          items={items}
          columns={columns}
        />
      </ScrollablePane>
    </div>
  )
}
