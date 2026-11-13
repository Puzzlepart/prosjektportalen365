import { Toast, ToastBody, ToastTitle, useToastController } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import React, { useCallback, useRef } from 'react'
import { IPortfolioOverviewContext } from '../context'
import { PORTFOLIO_SWITCH_FAILED, TOGGLE_MERGED_VIEW } from '../reducer'

/**
 * Switches the overview to a portfolio, or to the merged view of them all, for the two selectors
 * that offer it. The overview takes the mode of the pick at once, and the web part reads the
 * picked portfolio's configuration. When it cannot, it keeps the portfolio it showed: the mode is
 * put back, the selectors can be used again, and a toast tells the user which switch failed
 * (WCAG 3.3.1, 4.1.3). The web part counts the switch and the failure; nothing is counted here.
 *
 * @returns The switch, which takes a portfolio's id, or `null` for the merged view, and resolves
 * to whether the overview now shows the pick
 */
export function useSwitchPortfolio(context: IPortfolioOverviewContext) {
  const { dispatchToast } = useToastController(context.toasterId)
  // The selectors keep their menu items from one render to the next, so the switch reads the
  // overview as it is when an item is clicked, not as it was when the item was made.
  const latest = useRef(context)
  latest.current = context

  return useCallback(
    async (portfolioId: string | null): Promise<boolean> => {
      const { props, state, dispatch } = latest.current
      const wasMergedView = !!state.isMergedView
      dispatch(TOGGLE_MERGED_VIEW(portfolioId === null))
      const isShown = await props.onSetPortfolio?.(portfolioId)
      if (isShown !== false) return true
      dispatch(PORTFOLIO_SWITCH_FAILED(wasMergedView))
      const pick =
        portfolioId === null
          ? strings.MergedViewLabel
          : props.portfolios?.find(({ uniqueId }) => uniqueId === portfolioId)?.title
      dispatchToast(
        <Toast>
          <ToastTitle>{format(strings.PortfolioSwitchErrorTitle, pick)}</ToastTitle>
          <ToastBody>{strings.PortfolioSwitchErrorText}</ToastBody>
        </Toast>,
        { intent: 'error' }
      )
      return false
    },
    [dispatchToast]
  )
}
