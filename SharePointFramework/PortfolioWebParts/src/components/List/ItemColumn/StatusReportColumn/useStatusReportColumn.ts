import _ from 'lodash'
import { IStatusColumnProps } from './types'
import { createElement } from 'react'
import { TooltipContent } from './TooltipContent'
import { ITooltipProps } from '@fluentui/react'

/**
 * Hook for the status report column.
 *
 * @param props Props for the status report column
 */
export function useStatusReportColumn(props: IStatusColumnProps) {
  const status = _.get(props.column, 'data.$', []).find(
    ({ siteId }) => siteId === props.item.SiteId
  )
  const onRenderContent = () =>
    createElement(TooltipContent, { status, animation: props.tooltip.animation })
  const tooltipProps: ITooltipProps = { onRenderContent }

  return {
    status,
    tooltipProps
  }
}
