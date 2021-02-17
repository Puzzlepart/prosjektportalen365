import React from 'react'
import styles from './PortfolioInsightsCommandBar.module.scss'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import { IPortfolioInsightsCommandBarProps } from './IPortfolioInsightsCommandBarProps'

// tslint:disable-next-line: naming-convention
const PortfolioInsightsCommandBar = (props: IPortfolioInsightsCommandBarProps) => {
  const items: ICommandBarItemProps[] = [
    {
      key: 'NEW_ITEM',
      name: 'Ny',
      iconProps: { iconName: 'Add' },
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
      name: props.currentView.title,
      iconProps: { iconName: 'List' },
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

export default PortfolioInsightsCommandBar
