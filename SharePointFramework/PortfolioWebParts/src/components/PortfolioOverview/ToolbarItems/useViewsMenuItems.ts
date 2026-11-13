import { ListMenuItem, PortfolioOverviewView } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { IPortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'

/**
 * Build checkable view choices matching the supplied filter. A view picked from the menu is
 * counted for usage statistics, for the web part the overview is in.
 */
export function useViewsMenuItems(
  context: IPortfolioOverviewContext,
  filterFunc: (view: PortfolioOverviewView) => boolean
) {
  const telemetry = useTelemetry()
  return context.props.configuration.views.filter(filterFunc).map<ListMenuItem>((v) =>
    new ListMenuItem(v.title)
      .setIcon(v.iconName)
      .makeCheckable({
        name: 'views',
        value: v.id.toString()
      })
      .setOnClick(() => {
        context.dispatch(CHANGE_VIEW(v))
        // Counted here and not in the reducer: a saved view dispatches `CHANGE_VIEW` too.
        telemetry.track('view.switched')
      })
  )
}
