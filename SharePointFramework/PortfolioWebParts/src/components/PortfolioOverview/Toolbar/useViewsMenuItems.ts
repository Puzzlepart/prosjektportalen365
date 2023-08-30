import { PortfolioOverviewView } from 'pp365-shared-library'
import { ListMenuItem } from '../../List'
import { IPortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'

/**
 * Returns an array of menu items for the views menu based on the provided filter function.
 *
 * @param context - The IPortfolioOverviewContext object.
 * @param filterFunc - The function used to filter the views.
 *
 * @returns An array of IListMenuItem objects.
 */
export function useViewsMenuItems(
  context: IPortfolioOverviewContext,
  filterFunc: (view: PortfolioOverviewView) => boolean
) {
  return context.props.configuration.views.filter(filterFunc).map<ListMenuItem>((v) =>
    new ListMenuItem(v.title)
      .makeCheckable({
        name: 'views',
        value: v.id.toString()
      })
      .setOnClick(() => {
        context.dispatch(CHANGE_VIEW(v))
      })
  )
}
