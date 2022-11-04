import { Toggle } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { DynamicMatrix } from '../DynamicMatrix'
import { IRiskMatrixProps } from './types'
import { useRiskMatrix } from './useRiskMatrix'

export const RiskMatrix: FC<IRiskMatrixProps> = (props) => {
  const { configuration, getElementsForCell, setShowPostAction } = useRiskMatrix(props)
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

RiskMatrix.defaultProps = {
  items: [],
  width: 400,
  calloutTemplate: `
  <h3>{Title}</h3>\n
  <p><strong>Usikkerhetstrategi: </strong>{GtRiskStrategy}</p>\n
  <p><strong>Nærhet: </strong>{GtRiskProximity}</p>\n
  <p><strong>Status usikkerhet: </strong>{GtRiskStatus}</p>`,
  customConfigUrl: 'SiteAssets/custom-cells.txt',
  size: '5',
  colorScaleConfig: [
    { percentage: 10, color: [44, 186, 0] },
    { percentage: 30, color: [163, 255, 0] },
    { percentage: 50, color: [255, 244, 0] },
    { percentage: 70, color: [255, 167, 0] },
    { percentage: 90, color: [255, 0, 0] }
  ]  
}

export * from './types'
