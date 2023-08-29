import { IPortfolioOverviewContext } from '../context'
import { useMemo } from 'react'

/**
 * Returns an object containing the checked values for the toolbar items based on the current state of the context.
 *
 * @param context - The context object containing the current state of the Portfolio Overview web part.
 *
 * @returns An object containing the checked values for the toolbar items.
 */
export function useCheckedValues(context: IPortfolioOverviewContext) {
  return useMemo(
    () => ({
      views: [context.state.currentView?.id.toString()],
      renderMode: context.state.isCompact ? ['compactList'] : ['list'],
      programs: [context.state.currentView?.id.toString()]
    }),
    [context.state.currentView?.id, context.state.isCompact]
  )
}
