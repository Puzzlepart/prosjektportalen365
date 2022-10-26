import {
  DetailsList,
  ScrollablePane,
  SearchBox,
  SelectionMode,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { TemplateListContentConfigMessage } from '../TemplateListContentConfigMessage'
import { TemplateSelectDialogSectionComponent } from '../types'
import styles from './ExtensionsSection.module.scss'
import { useExtensionsSection } from './useExtensionsSection'

export const ExtensionsSection: TemplateSelectDialogSectionComponent = (props) => {
  const context = useContext(TemplateSelectDialogContext)
  const { selection, items, onSearch, onRenderRow } = useExtensionsSection()

  return (
    <div className={styles.root} style={props.style}>
      <ScrollablePane>
        <DetailsList
          setKey='set'
          selection={selection}
          selectionMode={SelectionMode.multiple}
          selectionPreservedOnEmptyClick={true}
          onRenderRow={onRenderRow}
          onRenderDetailsHeader={(props_, defaultRender) => (
            <Sticky stickyPosition={StickyPositionType.Header}>
              <div className={styles.searchBox} hidden={items.length < 5}>
                <SearchBox
                  placeholder={strings.ExtensionsSectionSearchPlaceholder}
                  onChange={(_, newValue) => onSearch(newValue)}
                  onSearch={(newValue) => onSearch(newValue)}
                />
              </div>
              {defaultRender(props_)}
            </Sticky>
          )}
          onRenderDetailsFooter={() => (
            <Sticky stickyPosition={StickyPositionType.Footer}>
              {context.state.selectedTemplate?.listExtensionIds && <TemplateListContentConfigMessage />}
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
  )
}
