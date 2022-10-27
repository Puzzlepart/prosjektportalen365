import {
  DetailsList,
  IDetailsRowProps,
  ScrollablePane,
  SearchBox,
  SelectAllVisibility,
  SelectionMode,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import { ProjectExtension } from 'models'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { CheckLocked } from '../CheckLocked'
import { TemplateSelectDialogContext } from '../context'
import { TemplateListContentConfigMessage } from '../TemplateListContentConfigMessage'
import { TemplateSelectDialogSectionComponent } from '../types'
import { useSelectionList } from '../useSelectionList'
import styles from './ExtensionsSection.module.scss'
import { useColumns } from './useColumns'

export const ExtensionsSection: TemplateSelectDialogSectionComponent = (props) => {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = context.state.selectedExtensions.map((lc) => lc.key)
  const { selection, onSearch, searchTerm } = useSelectionList(selectedKeys)
  const items = context.props.data.extensions.filter((ext) => !ext.hidden)
  const columns = useColumns()

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
            const ext = detailsRowProps.item as ProjectExtension
            detailsRowProps.disabled = ext.isLocked(context.state.selectedTemplate)
            if (detailsRowProps.disabled)
              detailsRowProps.onRenderCheck = (props) => <CheckLocked {...props} />
            if (
              ext.text.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1 &&
              !selectedKeys.includes(ext.key)
            )
              return null
            return defaultRender(detailsRowProps)
          }}
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
