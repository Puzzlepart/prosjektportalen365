import { IMatrixElementProps } from '../DynamicMatrix/MatrixCell/MatrixElement/types'
import { useState } from 'react'
import { IMatrixCell } from '../DynamicMatrix'
import { IRiskMatrixProps } from './types'
import { useRiskMatrixConfiguration } from './useRiskMatrixConfiguration'
import { useId } from '@fluentui/react-components'

/** Places risks at their original and optional post-action coordinates. */
export function useRiskMatrix(props: IRiskMatrixProps) {
  const [showPostAction, setShowPostAction] = useState(false)
  const { configuration, error } = useRiskMatrixConfiguration(props)

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

  const fluentProviderId = useId('fp-risk-matrix')

  return {
    configuration,
    error,
    getElementsForCell,
    setShowPostAction,
    showPostAction,
    fluentProviderId
  }
}
