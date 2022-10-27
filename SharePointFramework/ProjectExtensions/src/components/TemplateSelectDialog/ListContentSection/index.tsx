import {
  DetailsList,
  IDetailsRowProps,
  ScrollablePane,
  SelectionMode,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import { ListContentConfig } from 'models'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { CheckLocked } from '../CheckLocked'
import { TemplateSelectDialogContext } from '../context'
import { ListHeaderSearch } from '../ListHeaderSearch'
import { TemplateListContentConfigMessage } from '../TemplateListContentConfigMessage'
import { TemplateSelectDialogSectionComponent } from '../types'
import styles from './ListContentSection.module.scss'
import { useListContentSection } from './useListContentSection'

export const ListContentSection: TemplateSelectDialogSectionComponent = (props) => {
  const context = useContext(TemplateSelectDialogContext)
  const { selection, selectedKeys, items, columns, onSearch, searchTerm } = useListContentSection()

  return (
    <div className={styles.root} style={props.style}>
      <ScrollablePane>
        <DetailsList
          setKey='set'
          selection={selection}
          selectionMode={SelectionMode.multiple}
          selectionPreservedOnEmptyClick={true}
          onRenderRow={(
            detailsRowProps: IDetailsRowProps,
            defaultRender: (props?: IDetailsRowProps) => JSX.Element
          ) => {
            const lcc = detailsRowProps.item as ListContentConfig
            const isLocked = lcc.isLocked(context.state.selectedTemplate)
            detailsRowProps.disabled = isLocked
            if (isLocked) {
              detailsRowProps.onRenderCheck = (props) => (
                <CheckLocked {...props} tooltip={{ text: strings.ListContentLockedTooltipText }} />
              )
              if (lcc.isDefault) {
                detailsRowProps.styles = {
                  root: { background: 'rgb(237, 235, 233)', color: 'rgb(50, 49, 48)' }
                }
              }
            }
            if (
              lcc.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
              selectedKeys.includes(lcc.key) ||
              (isLocked && lcc.isDefault)
            ) {
              return defaultRender(detailsRowProps)
            } else {
              return null
            }
          }}
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
