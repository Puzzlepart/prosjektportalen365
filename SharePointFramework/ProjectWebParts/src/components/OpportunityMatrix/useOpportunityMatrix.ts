import { IMatrixElementProps } from 'components/DynamicMatrix/MatrixCell/MatrixElement/types'
import { useState } from 'react'
import { IMatrixCell } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrixConfiguration } from './useOpportunityMatrixConfiguration'

/**
 * Component logic hook for `OpportunityMatrix`
 *
 * @param props Props
 */
export function useOpportunityMatrix(props: IOpportunityMatrixProps) {
  const [showPostAction] = useState(false)
  const configuration = useOpportunityMatrixConfiguration(props)

  function getElementsForCell(cell: IMatrixCell) {
    const elements = props.items
      .filter((ele) => cell.y === ele.probability && cell.x === ele.consequence)
      .map(
        (i) =>
          ({
            model: i,
            style: { opacity: showPostAction ? 0 : 1 }
          } as IMatrixElementProps)
      )
    const postActionElements = props.items
      .filter((ele) => cell.y === ele.probabilityPostAction && cell.x === ele.consequencePostAction)
      .map(
        (i) =>
          ({
            model: i,
            style: { opacity: showPostAction ? 1 : 0 }
          } as IMatrixElementProps)
      )
    return [...elements, ...postActionElements]
  }

  return { configuration, getElementsForCell } as const
}
