import { Toggle } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { MATRIX_DEFAULT_COLOR_SCALE_CONFIG } from '../../webparts/riskMatrix'
import { DynamicMatrix } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrix } from './useOpportunityMatrix'

export const OpportunityMatrix: FC<IOpportunityMatrixProps> = (props) => {
  const { configuration, getElementsForCell, setShowPostAction } = useOpportunityMatrix(props)
  return (
    <>
      <DynamicMatrix
        {...props}
        width={props.fullWidth ? '100%' : props.width}
        configuration={configuration}
        getElementsForCell={getElementsForCell}
      />
      <Toggle
        label={strings.RiskMatrixToggleElementsLabel}
        onText={strings.RiskMatrixToggleElementsOnText}
        offText={strings.RiskMatrixToggleElementsOffText}
        onChange={(_event, checked) => setShowPostAction(checked)}
      />
    </>
  )
}

OpportunityMatrix.defaultProps = {
  items: [],
  width: 400,
  size: '5',
  colorScaleConfig: MATRIX_DEFAULT_COLOR_SCALE_CONFIG
}

export * from './types'
