import React, { FC } from 'react'
import { DynamicMatrix } from '../DynamicMatrix'
import { IOpportunityMatrixProps, OPPORTUNITY_MATRIX_DEFAULT_COLOR_SCALE_CONFIG } from './types'
import { useOpportunityMatrix } from './useOpportunityMatrix'

export const OpportunityMatrix: FC<IOpportunityMatrixProps> = (props) => {
  const { configuration, getElementsForCell } = useOpportunityMatrix(props)
  return (
    <DynamicMatrix
      {...props}
      width={props.fullWidth ? '100%' : props.width}
      configuration={configuration}
      getElementsForCell={getElementsForCell}
    />
  )
}

OpportunityMatrix.defaultProps = {
  items: [],
  width: 400,
  size: '5',
  colorScaleConfig: OPPORTUNITY_MATRIX_DEFAULT_COLOR_SCALE_CONFIG
}

export * from './types'
