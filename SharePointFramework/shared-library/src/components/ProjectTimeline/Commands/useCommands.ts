import { ICommandBarProps, ContextualMenuItemType, IContextualMenuItem } from '@fluentui/react'
import * as strings from 'SharedLibraryStrings'
import { useState } from 'react'
import { ICommandsProps } from './types'

export function useCommands(props: ICommandsProps) {
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>(props.defaultGroupBy)

  const commandBarProps: ICommandBarProps = {
    items: [],
    farItems: []
  }

  if (props.isGroupByEnabled)
    commandBarProps.items.push({
      key: 'GroupBy',
      name: `${strings.GroupByLabel} ${selectedGroupBy}`,
      iconProps: { iconName: 'GroupedList' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Header,
      subMenuProps: {
        items: [
          [strings.ProjectLabel, 'List'],
          [strings.CategoryFieldLabel, 'AlignLeft'],
          [strings.TypeLabel, 'AlignLeft']
        ].map(([groupBy, iconName]) => ({
          key: groupBy,
          name: groupBy,
          iconProps: { iconName },
          canCheck: true,
          checked: selectedGroupBy === groupBy,
          onClick: () => {
            setSelectedGroupBy(groupBy)
            props.onGroupByChange(groupBy)
          }
        }))
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
