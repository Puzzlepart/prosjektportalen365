import { ListMenuItem, PortfolioOverviewView } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { IPortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'

/**
 * Build program choices that scope the default view's queries to child projects. A program picked
 * from the menu is a switch of view, and is counted as one for usage statistics, unless it is the
 * program the overview shows already.
 */
export function useProgramMenuItems(context: IPortfolioOverviewContext) {
  const telemetry = useTelemetry()
  if (!context.props.configuration.programs) return []
  return context.props.configuration.programs.map<ListMenuItem>((p) =>
    new ListMenuItem(p.name)
      .setStyle({
        padding: '8px 12px'
      })
      .setIcon('BoxMultiple')
      .setOnClick(() => {
        const defaultView = context.props.configuration.views.find((v) => v.isDefaultView)
        if (!defaultView) return
        const view = new PortfolioOverviewView().configureFrom(defaultView).set({
          id: p.id,
          title: p.name
        })
        view.searchQueries = p.buildQueries(defaultView.searchQuery)
        const isSwitch = context.state.currentView?.id !== view.id
        context.dispatch(CHANGE_VIEW(view))
        if (isSwitch) telemetry.track('view.switched')
      })
  )
}
