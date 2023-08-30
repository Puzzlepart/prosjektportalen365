import { ListMenuItem } from '../../List'
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
  return context.props.configuration.programs.map<ListMenuItem>((p) =>
    new ListMenuItem(p.name)
      .setStyle({
        padding: '8px 12px'
      })
      .setOnClick(() => {
        const defaultView = context.props.configuration.views.find((v) => v.isDefaultView)
        if (!defaultView) return
        const view = new PortfolioOverviewView().configureFrom(defaultView).set({
          id: p.id,
          title: p.name
        })
        view.searchQueries = p.buildQueries(defaultView.searchQuery)
        context.dispatch(CHANGE_VIEW(view))
      })
  )
}
