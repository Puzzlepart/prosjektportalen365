import { IListMenuItem } from '../../List'
import { IPortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'
import { PortfolioOverviewView } from 'pp365-shared-library'

/**
 * Returns an array of list menu items for each program in the configuration.
 *
 * @param context - The IPortfolioOverviewContext object containing the configuration and dispatch function.
 *
 * @returns An array of IListMenuItem objects, each representing a program in the configuration.
 */
export function useProgramMenuItems(context: IPortfolioOverviewContext) {
  if (!context.props.configuration.programs) return []
  return context.props.configuration.programs.map<IListMenuItem>((p) => ({
    text: p.name,
    name: 'programs',
    value: p.id,
    style: {
      padding: 15
    },
    onClick: () => {
      const defaultView = context.props.configuration.views.find((v) => v.isDefaultView)
      if (!defaultView) return
      const view = new PortfolioOverviewView().configureFrom(defaultView).set({
        id: p.id,
        title: p.name
      })
      view.searchQueries = p.buildQueries(defaultView.searchQuery)
      context.dispatch(CHANGE_VIEW(view))
    }
  }))
}
