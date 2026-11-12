import { ListMenuItem, PortfolioOverviewView } from 'pp365-shared-library'
import { IPortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'

/**
 * Build checkable view choices matching the supplied filter.
 */
export function useViewsMenuItems(
  context: IPortfolioOverviewContext,
  filterFunc: (view: PortfolioOverviewView) => boolean
) {
  return context.props.configuration.views.filter(filterFunc).map<ListMenuItem>((v) =>
    new ListMenuItem(v.title)
      .setIcon(v.iconName)
      .makeCheckable({
        name: 'views',
        value: v.id.toString()
      })
      .setOnClick(() => {
        context.dispatch(CHANGE_VIEW(v))
      })
  )
}
