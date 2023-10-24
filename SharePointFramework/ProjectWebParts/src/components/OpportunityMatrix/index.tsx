import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { DynamicMatrix } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrix } from './useOpportunityMatrix'
import { Field, Switch } from '@fluentui/react-components'

export const OpportunityMatrix: FC<IOpportunityMatrixProps> = (props) => {
  const { configuration, getElementsForCell, setShowPostAction, showPostAction } =
    useOpportunityMatrix(props)
  return (
    <>
      <DynamicMatrix
        {...props}
        width={props.fullWidth ? '100%' : props.width}
        configuration={configuration}
        getElementsForCell={getElementsForCell}
      />
      <Field label={strings.ToggleUncertaintyPostActionLabel}>
        <Switch
          label={
            showPostAction
              ? strings.ToggleUncertaintyPostActionOnText
              : strings.ToggleUncertaintyPostActionOffText
          }
          onChange={(_event, data) => setShowPostAction(data.checked)}
        />
      </Field>
    </>
  )
}

OpportunityMatrix.defaultProps = {
  items: [],
  fullWidth: true,
  calloutTemplate: `
  <h3>{Title}</h3>\n
  <p><strong>Usikkerhetstrategi: </strong>{GtRiskStrategy}</p>\n
  <p><strong>Nærhet: </strong>{GtRiskProximity}</p>\n
  <p><strong>Status usikkerhet: </strong>{GtRiskStatus}</p>`,
  size: '5',
  colorScaleConfig: [
    { p: 10, r: 255, g: 167, b: 0 },
    { p: 30, r: 255, g: 214, b: 10 },
    { p: 50, r: 255, g: 244, b: 0 },
    { p: 70, r: 163, g: 255, b: 0 },
    { p: 90, r: 44, g: 186, b: 0 }
  ]
}

export * from './types'
