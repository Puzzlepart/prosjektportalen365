import { IMatrixElementProps } from '../DynamicMatrix/MatrixCell/MatrixElement/types'
import { useState } from 'react'
import { IMatrixCell } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrixConfiguration } from './useOpportunityMatrixConfiguration'
import { useId } from '@fluentui/react-components'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'

/** Places opportunities at their original and optional post-action coordinates. */
export function useOpportunityMatrix(props: IOpportunityMatrixProps) {
  const [showPostAction, setShowPostAction] = useState(false)
  const { configuration, error } = useOpportunityMatrixConfiguration(props)
  const telemetry = useTelemetry()

  /**
   * Get the matrix elements for a given cell.
   */
  function getElementsForCell(cell: IMatrixCell) {
    const elements = props.items
      .filter((item) => cell.y === item.probability && cell.x === item.consequence)
      .map(
        (item) =>
          ({
            model: item,
            // Hidden, not only transparent, when not shown: see MatrixElement.module.scss.
            style: {
              opacity: showPostAction ? 0 : 1,
              visibility: showPostAction ? 'hidden' : 'visible'
            },
            title: item.tooltip
          }) as IMatrixElementProps
      )
    const postActionElements = props.items
      .filter(
        (item) => cell.y === item.probabilityPostAction && cell.x === item.consequencePostAction
      )
      .map(
        (item) =>
          ({
            model: item,
            style: {
              opacity: showPostAction ? 1 : 0,
              visibility: showPostAction ? 'visible' : 'hidden'
            },
            title: item.tooltip
          }) as IMatrixElementProps
      )
    return [...elements, ...postActionElements]
  }

  /**
   * Shows the opportunities where their actions take them, or where they are now, as the switch
   * says.
   *
   * @param checked Whether the switch is on
   */
  function onTogglePostAction(checked: boolean) {
    setShowPostAction(checked)
    telemetry.track('postAction.toggled')
  }

  const fluentProviderId = useId('fp-opportunity-matrix')

  return {
    configuration,
    error,
    getElementsForCell,
    onTogglePostAction,
    showPostAction,
    fluentProviderId
  }
}
