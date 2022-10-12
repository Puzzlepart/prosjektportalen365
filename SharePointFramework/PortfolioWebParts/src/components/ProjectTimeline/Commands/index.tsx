import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import {
  ContextualMenuItemType,
  IContextualMenuItem
} from 'office-ui-fabric-react/lib/ContextualMenu'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useState } from 'react'

export interface ICommandsProps {
  /**
   * Set Show Filter Panel
   */
  setShowFilterPanel: (showFilterPanel: boolean) => void

  /**
   * On Group change
   * @param group Group
   */
  onGroupChange: (group: string) => void

  /**
   * Is group by enabled
   */
  isGroupByEnabled?: boolean
}

export const Commands = (props: ICommandsProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(strings.ProjectLabel)

  const cmd: ICommandBarProps = {
    items: [],
    farItems: []
  }

  if (props.isGroupByEnabled)
    cmd.farItems.push({
      key: 'GroupBy',
      name: strings.GroupByLabel,
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
            checked: selectedGroup === strings.ProjectLabel,
            onClick: () => {
              setSelectedGroup(strings.ProjectLabel)
              props.onGroupChange(strings.ProjectLabel)
            }
          },
          {
            key: strings.CategoryFieldLabel,
            name: strings.CategoryFieldLabel,
            iconProps: { iconName: 'AlignLeft' },
            canCheck: true,
            checked: selectedGroup === strings.CategoryFieldLabel,
            onClick: () => {
              setSelectedGroup(strings.CategoryFieldLabel)
              props.onGroupChange(strings.CategoryFieldLabel)
            }
          },
          {
            key: strings.TypeLabel,
            name: strings.TypeLabel,
            iconProps: { iconName: 'AlignLeft' },
            canCheck: true,
            checked: selectedGroup === strings.TypeLabel,
            onClick: () => {
              setSelectedGroup(strings.TypeLabel)
              props.onGroupChange(strings.TypeLabel)
            }
          }
        ]
      }
    } as IContextualMenuItem)

  cmd.farItems.push({
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

  return (
    <div>
      <CommandBar {...cmd} />
    </div>
  )
}
