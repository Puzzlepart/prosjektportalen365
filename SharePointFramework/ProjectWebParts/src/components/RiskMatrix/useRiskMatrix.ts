import { IMatrixElementProps } from '../DynamicMatrix/MatrixCell/MatrixElement/types'
import { useState } from 'react'
import { IMatrixCell } from '../DynamicMatrix'
import { IRiskMatrixProps } from './types'
import { useRiskMatrixConfiguration } from './useRiskMatrixConfiguration'

/**
 * Component logic hook for `RiskMatrix`
 *
 * @param props Props
 */
export function useRiskMatrix(props: IRiskMatrixProps) {
  const [showPostAction, setShowPostAction] = useState(false)
  const { configuration, error } = useRiskMatrixConfiguration(props)

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

  return {
    configuration,
    error,
    getElementsForCell,
    setShowPostAction
  } as const
}
