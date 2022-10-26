import {
  DetailsList,
  Icon,
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
          onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
            <Sticky stickyPosition={StickyPositionType.Header}>
              <div className={styles.searchBox} hidden={items.length < 5}>
                <SearchBox
                  placeholder={strings.ExtensionsSectionSearchPlaceholder}
                  onChange={(_, newValue) => onSearch(newValue)}
                  onSearch={(newValue) => onSearch(newValue)}
                />
              </div>
              {defaultRender(detailsHeaderProps)}
            </Sticky>
          )}
          onRenderDetailsFooter={() => (
            <Sticky stickyPosition={StickyPositionType.Footer}>
              {context.state.selectedTemplate?.extensionIds && <TemplateListContentConfigMessage />}
            </Sticky>
          )}
          items={items}
          columns={[
            {
              key: 'text',
              fieldName: 'text',
              name: strings.TitleLabel,
              minWidth: 150,
              maxWidth: 150,
              onRender: (item) => {
                const isLocked =
                  context.state.selectedTemplate?.isDefaultExtensionsLocked &&
                  context.state.selectedTemplate?.extensionIds.includes(item.id)
                return (
                  <div className={styles.titleColumn}>
                    {isLocked && <Icon iconName='Lock' className={styles.lockIcon} />}
                    <span>{item.text}</span>
                  </div>
                )
              }
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
