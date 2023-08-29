import { IListMenuItem } from 'components/List'
import { IPortfolioOverviewContext } from '../context'
import { CHANGE_VIEW } from '../reducer'
import { PortfolioOverviewView } from 'pp365-shared-library'

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
  return context.props.configuration.views.filter(filterFunc).map<IListMenuItem>((v) => ({
    text: v.title,
    name: 'views',
    value: v.id.toString(),
    icon: v.iconName,
    onClick: () => {
      context.dispatch(CHANGE_VIEW(v))
    }
  }))
}
