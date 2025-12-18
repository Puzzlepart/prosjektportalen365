import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider } from 'pp365-shared-library'
import { useMemo, useState } from 'react'
import { IPortfolioOverviewContext } from '../context'
import { TOGGLE_MERGED_VIEW } from '../reducer'
import _ from 'lodash'

/**
 * Hook for generating the portfolio selector menu item.
 *
 * @param context - The `IPortfolioOverviewContext` object containing the necessary data for generating the view selector menu item.
 */
export function usePortfolioSelector(context: IPortfolioOverviewContext) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(context.props.selectedPortfolioId)
  const isMergedView = context.state.isMergedView

  const selectedPortfolio = useMemo(
    () =>
      !isMergedView && selectedPortfolioId
        ? context.props.portfolios?.find(({ uniqueId }) => uniqueId === selectedPortfolioId)
        : null,
    [selectedPortfolioId, isMergedView, context.props.portfolios]
  )

  const displayText = useMemo(() => {
    if (isMergedView) {
      return strings.MergedViewLabel || 'Vis alle hub-er'
    }
    return selectedPortfolio?.title ?? _.first(context.props.portfolios)?.title ?? strings.PortfolioSelectorLabel
  }, [isMergedView, selectedPortfolio, context.props.portfolios])

  const portfolioMenuItems = useMemo(() => {
    const items: ListMenuItem[] = []

    if (context.props.portfolios) {
      items.push(
        ...context.props.portfolios.map<ListMenuItem>((portfolio) =>
          new ListMenuItem(portfolio.title)
            .setIcon(portfolio.iconName || 'FabricFolder')
            .makeCheckable({
              name: 'portfolios',
              value: portfolio.uniqueId.toString()
            })
            .setOnClick(() => {
              setSelectedPortfolioId(portfolio.uniqueId)
              context.dispatch(TOGGLE_MERGED_VIEW(false))
              context.props.onSetPortfolio(portfolio.uniqueId)
            })
        )
      )
    }

    if (context.props.portfolios && context.props.portfolios.length > 1 && context.props.showMergedView !== false) {
      items.push(
        ListMenuItemDivider,
        new ListMenuItem(strings.MergedViewLabel || 'Vis alle hub-er')
          .setIcon('BulletedTreeList')
          .makeCheckable({
            name: 'portfolios',
            value: 'merged'
          })
          .setOnClick(() => {
            setSelectedPortfolioId(null)
            context.dispatch(TOGGLE_MERGED_VIEW(true))
            context.props.onSetPortfolio(null)
          })
      )
    }

    return items
  }, [context.props.portfolios, context.props.showMergedView])

  const checkedValues = useMemo(() => {
    if (isMergedView) {
      return ['merged']
    }
    return [selectedPortfolio?.uniqueId || _.first(context.props.portfolios)?.uniqueId].filter(Boolean)
  }, [isMergedView, selectedPortfolio, context.props.portfolios])

  return useMemo<ListMenuItem>(
    () =>
      new ListMenuItem(
        displayText,
        strings.PortfolioSelectorDescription
      )
        .setIcon('Collections')
        .setWidth('fit-content')
        .setStyle({ minWidth: '145px' })
        .setHidden(!context.props.showPortfolioSelector || _.isEmpty(context.props.portfolios))
        .setDisabled(context.state.isChangingView || context.props.portfolios?.length <= 1)
        .setItems(portfolioMenuItems, {
          portfolios: checkedValues
        }),
    [context.props.portfolios, context.state.isChangingView, selectedPortfolioId, isMergedView, displayText, portfolioMenuItems, checkedValues]
  )
}
