import React, { FC } from 'react'
import { ICommandsProps } from './types'
import styles from './PortfolioInsightsCommandBar.module.scss'
import * as strings from 'PortfolioWebPartsStrings'
import { ICommandBarItemProps, ContextualMenuItemType, CommandBar } from '@fluentui/react'

export const Commands: FC<ICommandsProps> = (props) => {
  const items: ICommandBarItemProps[] = [
    {
      key: 'NEW_ITEM',
      name: strings.NewLabel,
      iconProps: { iconName: 'Add' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Header,
      subMenuProps: {
        items: props.contentTypes.map((ct) => ({
          key: ct.StringId,
          name: ct.Name,
          href: `${props.newFormUrl}?ContentTypeId=${ct.StringId}&Source=${encodeURIComponent(
            document.location.href
          )}`
        }))
      }
    }
  ]

  const farItems: ICommandBarItemProps[] = [
    {
      key: 'VIEW_SELECTOR',
      name: props.currentView?.title,
      iconProps: { iconName: 'List' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Header,
      subMenuProps: {
        items: props.configuration.views.map((view) => ({
          key: `${view.id}`,
          name: view.title,
          iconProps: { iconName: view.iconName },
          onClick: () => {
            props.onViewChanged(view)
          }
        }))
      }
    }
  ]

  return (
    <div className={styles.portfolioInsightsCommandBar}>
      <CommandBar items={items} farItems={farItems} />
    </div>
  )
}

Commands.displayName = 'Commands'
Commands.defaultProps = {
  contentTypes: [],
  configuration: {
    views: []
  }
}

