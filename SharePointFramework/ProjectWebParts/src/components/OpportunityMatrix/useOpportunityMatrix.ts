import { IMatrixElementProps } from 'components/DynamicMatrix/MatrixCell/MatrixElement/types'
import { useState } from 'react'
import { IMatrixCell } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrixConfiguration } from './useOpportunityMatrixConfiguration'

/**
 * Component logic hook for `RiskMatrix`
 *
 * @param props Props
 */
export function useOpportunityMatrix(props: IOpportunityMatrixProps) {
  const [showPostAction, setShowPostAction] = useState(false)
  const configuration = useOpportunityMatrixConfiguration(props)

  function getElementsForCell(cell: IMatrixCell) {
    const elements = props.items
      .filter((item) => cell.y === item.probability && cell.x === item.consequence)
      .map(
        (item) =>
          ({
            model: item,
            style: { opacity: showPostAction ? 0 : 1 },
            title: item.tooltip
          } as IMatrixElementProps)
      )
    const postActionElements = props.items
      .filter(
        (item) => cell.y === item.probabilityPostAction && cell.x === item.consequencePostAction
      )
      .map(
        (item) =>
          ({
            model: item,
            style: { opacity: showPostAction ? 1 : 0 },
            title: item.tooltip
          } as IMatrixElementProps)
      )
    return [...elements, ...postActionElements]
  }

  return { configuration, getElementsForCell, setShowPostAction } as const
}
