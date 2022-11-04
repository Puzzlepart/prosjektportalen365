import React, { FC } from 'react'
import { DynamicMatrixContext } from '../DynamicMatrix/context'
import { DynamicMatrix } from '../DynamicMatrix'
import { IRiskMatrixProps } from './types'
import { useRiskMatrix } from './useRiskMatrix'
import { Toggle } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { MATRIX_DEFAULT_COLOR_SCALE_CONFIG } from '../../webparts/riskMatrix'

export const RiskMatrix: FC<IRiskMatrixProps> = (props) => {
  const { ctxValue, setShowPostAction } = useRiskMatrix(props)
  return (
    <DynamicMatrixContext.Provider value={ctxValue}>
      <DynamicMatrix />
      <Toggle
        label={strings.RiskMatrix_ToggleElements}
        onText={strings.Yes}
        offText={strings.No}
        onChange={(_event, checked) => setShowPostAction(checked)}
      />
    </DynamicMatrixContext.Provider>
  )
}

RiskMatrix.defaultProps = {
  items: [],
  width: 400,
  fullWidth: false,
  customConfigUrl: 'SiteAssets/custom-cells.txt',
  size: '5',
  colorScaleConfig: MATRIX_DEFAULT_COLOR_SCALE_CONFIG
}

export * from './types'
