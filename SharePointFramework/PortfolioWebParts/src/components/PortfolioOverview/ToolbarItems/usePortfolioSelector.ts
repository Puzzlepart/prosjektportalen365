import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem } from 'pp365-shared-library'
import { useMemo, useState } from 'react'
import { IPortfolioOverviewContext } from '../context'

/**
 * Hook for generating the portfolio selector menu item.
 * 
 * @param context - The `IPortfolioOverviewContext` object containing the necessary data for generating the view selector menu item.
 */
export function usePortfolioSelector(context: IPortfolioOverviewContext) {
    const [selectedPortfolioId, setSelectedPortfolioId] = useState(context.props.selectedPortfolioId)
    const selectedPortfolio = useMemo(() => context.props.portfolios?.find((v) => v.uniqueId === selectedPortfolioId), [selectedPortfolioId, context.props.portfolios])

    return useMemo<ListMenuItem>(
        () =>
            new ListMenuItem(
                selectedPortfolio?.title ?? strings.SelectedPortfolioLabel,
                strings.PortfolioSelectorDescription
            )
                .setIcon('Collections')
                .setWidth('fit-content')
                .setStyle({
                    minWidth: '145px',
                    display:
                        context.props.showPortfolioSelector && context.props.portfolios?.length > 0
                            ? 'flex'
                            : 'none'
                })
                .setDisabled(context.state.isChangingView || context.props.portfolios?.length <= 1)
                .setItems(
                    context.props.portfolios.map<ListMenuItem>((v) =>
                        new ListMenuItem(v.title)
                            .setIcon(v.iconName)
                            .makeCheckable({
                                name: 'portfolios',
                                value: v.uniqueId.toString()
                            })
                            .setOnClick(() => {
                                setSelectedPortfolioId(v.uniqueId)
                                context.props.onSetPortfolio(v.uniqueId)
                            })
                    ),
                    {
                        portfolios: [selectedPortfolioId]
                    }
                ),
        [context.props.portfolios, context.state.isChangingView, selectedPortfolioId]
    )
}