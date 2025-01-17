import { IContextualMenuItem } from '@fluentui/react'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models/PortfolioOverviewView'
import { IPortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'

/**
 * Returns a function that converts a collection of `PortfolioOverviewView` objects to
 * a collection of `IContextualMenuItem` objects.
 *
 * @param context The context object containing the props and state for the PortfolioOverview component
 *
 * @returns A function that accepts a filter function and returns an array of `IContextualMenuItem` objects
 */
export function useConvertViewsToContextualMenuItems(context: IPortfolioOverviewContext) {
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
