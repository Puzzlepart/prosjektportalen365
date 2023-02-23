import { IMatrixElementProps } from '../DynamicMatrix/MatrixCell/MatrixElement/types'
import { useState } from 'react'
import { IMatrixCell } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrixConfiguration } from './useOpportunityMatrixConfiguration'

/**
 * Component logic hook for `OpportunityMatrix`. Builds the matrix elements and configuration
 * for the matrix.
 *
 * @param props Props
 */
export function useOpportunityMatrix(props: IOpportunityMatrixProps) {
  const [showPostAction, setShowPostAction] = useState(false)
  const configuration = useOpportunityMatrixConfiguration(props)

  /**
   * Get the matrix elements for a given cell.
   * 
   * @param cell Matrix cell
   */
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
