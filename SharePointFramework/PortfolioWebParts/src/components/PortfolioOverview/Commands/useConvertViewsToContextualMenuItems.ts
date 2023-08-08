import { IContextualMenuItem } from '@fluentui/react'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models/PortfolioOverviewView'
import { useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'

export function useConvertViewsToContextualMenuItems() {
  const context = useContext(PortfolioOverviewContext)

  /**
   * Converts a collection of `PortfolioOverviewView` objects to
   * a collection of `IContextualMenuItem` objects.
   *
   * @param props Props for the PortfolioOverviewCommands component
   * @param filterFunc Optional filter function to filter the views
   */
  const convertViewsToContextualMenuItems = (
    filterFunc: (view: PortfolioOverviewView) => boolean
  ) => {
    return context.props.configuration.views.filter(filterFunc).map(
      (view) =>
        ({
          key: view.id.toString(),
          name: view.title,
          iconProps: { iconName: view.iconName },
          canCheck: true,
          checked: view.id === context.state.currentView?.id,
          onClick: () => context.dispatch(CHANGE_VIEW(view))
        } as IContextualMenuItem)
    )
  }

  return convertViewsToContextualMenuItems
}
