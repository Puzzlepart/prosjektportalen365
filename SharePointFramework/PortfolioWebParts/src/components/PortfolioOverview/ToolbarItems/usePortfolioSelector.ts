import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider, format } from 'pp365-shared-library'
import { useMemo, useState } from 'react'
import { IPortfolioOverviewContext } from '../context'
import _ from 'lodash'
import { useSwitchPortfolio } from './useSwitchPortfolio'

/**
 * Build the portfolio selector with individual hubs and the optional merged view. A pick the web
 * part could not switch to leaves the selector on the portfolio it showed.
 */
export function usePortfolioSelector(context: IPortfolioOverviewContext) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(context.props.selectedPortfolioId)
  const isMergedView = context.state.isMergedView
  const switchPortfolio = useSwitchPortfolio(context)

  /**
   * Shows the pick in the selector at once, and the portfolio shown before again when the web
   * part could not switch to the pick.
   *
   * @param portfolioId The picked portfolio's id, or `null` for the merged view
   */
  const pickPortfolio = async (portfolioId: string | null) => {
    setSelectedPortfolioId(portfolioId)
    if (!(await switchPortfolio(portfolioId))) setSelectedPortfolioId(selectedPortfolioId)
  }

  const selectedPortfolio = useMemo(
    () =>
      !isMergedView && selectedPortfolioId
        ? context.props.portfolios?.find(({ uniqueId }) => uniqueId === selectedPortfolioId)
        : null,
    [selectedPortfolioId, isMergedView, context.props.portfolios]
  )

  const displayText = useMemo(() => {
    if (isMergedView) {
      return strings.MergedViewLabel
    }
    return (
      selectedPortfolio?.title ??
      _.first(context.props.portfolios)?.title ??
      strings.PortfolioSelectorLabel
    )
  }, [isMergedView, selectedPortfolio, context.props.portfolios])

  // Made again when the selection changes: an item puts back the selection it was made with when
  // its switch fails.
  const portfolioMenuItems = useMemo(() => {
    const items: ListMenuItem[] = []

    if (context.props.portfolios) {
      items.push(
        ...context.props.portfolios.map<ListMenuItem>((portfolio) =>
          new ListMenuItem(portfolio.title)
            .setIcon(portfolio.iconName || 'Folder')
            .makeCheckable({
              name: 'portfolios',
              value: portfolio.uniqueId.toString()
            })
            .setOnClick(() => {
              void pickPortfolio(portfolio.uniqueId)
            })
        )
      )
    }

    if (
      context.props.portfolios &&
      context.props.portfolios.length > 1 &&
      context.props.showMergedView !== false
    ) {
      items.push(
        ListMenuItemDivider,
        new ListMenuItem(strings.MergedViewLabel)
          .setIcon('TextBulletListTree')
          .makeCheckable({
            name: 'portfolios',
            value: 'merged'
          })
          .setOnClick(() => {
            void pickPortfolio(null)
          })
      )
    }

    return items
  }, [context.props.portfolios, context.props.showMergedView, selectedPortfolioId])

  const checkedValues = useMemo(() => {
    if (isMergedView) {
      return ['merged']
    }
    return [selectedPortfolio?.uniqueId || _.first(context.props.portfolios)?.uniqueId].filter(
      Boolean
    )
  }, [isMergedView, selectedPortfolio, context.props.portfolios])

  return useMemo<ListMenuItem>(
    () =>
      new ListMenuItem(displayText, strings.PortfolioSelectorDescription)
        // Named by what it chooses too, not only by the portfolio it shows (WCAG 2.4.6).
        .setAriaLabel(
          format(strings.SelectorButtonLabel, displayText, strings.PortfolioSelectorDescription)
        )
        .setIcon('Collections')
        .setWidth('fit-content')
        .setStyle({ minWidth: '145px' })
        .setHidden(!context.props.showPortfolioSelector || _.isEmpty(context.props.portfolios))
        .setDisabled(context.state.isChangingView)
        .setItems(portfolioMenuItems, {
          portfolios: checkedValues
        }),
    [
      context.props.portfolios,
      context.state.isChangingView,
      selectedPortfolioId,
      isMergedView,
      displayText,
      portfolioMenuItems,
      checkedValues
    ]
  )
}
