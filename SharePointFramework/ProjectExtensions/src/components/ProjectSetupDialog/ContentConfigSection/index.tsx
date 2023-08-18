import {
  DetailsList,
  ScrollablePane,
  SelectionMode,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { ListHeaderSearch } from '../ListHeaderSearch'
import { TemplateConfigMessage } from '../TemplateConfigMessage'
import { TemplateSelectDialogContext } from '../context'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './ContentConfigSection.module.scss'
import { useContentConfigSection } from './useContentConfigSection'

/**
 * Section for selection of content configurations.
 *
 * @param props Props
 */
export const ContentConfigSection: ProjectSetupDialogSectionComponent = (props) => {
  const context = useContext(TemplateSelectDialogContext)
  const { selection, items, columns, onSearch, onRenderRow } = useContentConfigSection()

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
              selectedItems={context.state.selectedContentConfig}
              detailsHeaderProps={detailsHeaderProps}
              defaultRender={defaultRender}
              search={{
                placeholder: strings.ContentConfigSectionSearchPlaceholder,
                onSearch,
                hidden: items.length < 5
              }}
            />
          )}
          onRenderDetailsFooter={() => (
            <Sticky stickyPosition={StickyPositionType.Footer}>
              <TemplateConfigMessage section='ContentConfigSection' />
            </Sticky>
          )}
          items={items}
          columns={columns}
        />
      </ScrollablePane>
    </div>
  )
}
