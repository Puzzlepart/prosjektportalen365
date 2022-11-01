import { ICommandBarProps, ContextualMenuItemType, IContextualMenuItem } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { useState } from 'react'
import { ICommandsProps } from './types'

export function useCommands(props: ICommandsProps) {
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>(props.defaultGroupBy)

  const commandBarProps: ICommandBarProps = {
    items: [],
    farItems: []
  }

  if (props.isGroupByEnabled)
    commandBarProps.farItems.push({
      key: 'GroupBy',
      name: `${strings.GroupByLabel} ${selectedGroupBy}`,
      iconProps: { iconName: 'GroupedList' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Header,
      subMenuProps: {
        items: [
          {
            key: strings.ProjectLabel,
            name: strings.ProjectLabel,
            iconProps: { iconName: 'List' },
            canCheck: true,
            checked: selectedGroupBy === strings.ProjectLabel,
            onClick: () => {
              setSelectedGroupBy(strings.ProjectLabel)
              props.onGroupByChange(strings.ProjectLabel)
            }
          },
          {
            key: strings.CategoryFieldLabel,
            name: strings.CategoryFieldLabel,
            iconProps: { iconName: 'AlignLeft' },
            canCheck: true,
            checked: selectedGroupBy === strings.CategoryFieldLabel,
            onClick: () => {
              setSelectedGroupBy(strings.CategoryFieldLabel)
              props.onGroupByChange(strings.CategoryFieldLabel)
            }
          },
          {
            key: strings.TypeLabel,
            name: strings.TypeLabel,
            iconProps: { iconName: 'AlignLeft' },
            canCheck: true,
            checked: selectedGroupBy === strings.TypeLabel,
            onClick: () => {
              setSelectedGroupBy(strings.TypeLabel)
              props.onGroupByChange(strings.TypeLabel)
            }
          }
        ]
      }
    } as IContextualMenuItem)

  commandBarProps.farItems.push({
    key: 'Filter',
    name: strings.FilterText,
    iconProps: { iconName: 'Filter' },
    itemType: ContextualMenuItemType.Normal,
    buttonStyles: { root: { border: 'none', height: '40px' } },
    iconOnly: true,
    onClick: (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      props.setShowFilterPanel(true)
    }
  } as IContextualMenuItem)

  return commandBarProps
}
