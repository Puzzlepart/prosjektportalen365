import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { DynamicMatrix } from 'components/DynamicMatrix/DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrix } from './useOpportunityMatrix'
import { Field, Switch } from '@fluentui/react-components'

export const OpportunityMatrix: FC<IOpportunityMatrixProps> = (props) => {
  const { configuration, getElementsForCell, setShowPostAction, showPostAction } = useOpportunityMatrix(props)
  return (
    <>
      <DynamicMatrix
        {...props}
        width={props.fullWidth ? '100%' : props.width}
        configuration={configuration}
        getElementsForCell={getElementsForCell} />
      <Field label={strings.ToggleUncertaintyPostActionLabel}>
        <Switch
          label={showPostAction
            ? strings.ToggleUncertaintyPostActionOnText
            : strings.ToggleUncertaintyPostActionOffText}
          onChange={(_event, data) => setShowPostAction(data.checked)} />
      </Field>
    </>
  )
}

OpportunityMatrix.displayName = 'OpportunityMatrix'
OpportunityMatrix.defaultProps = {
  items: [],
  fullWidth: true,
  calloutTemplate: `
  <h3>{Title}</h3>\n
  <p><strong>Usikkerhetstrategi: </strong>{GtRiskStrategy}</p>\n
  <p><strong>Nærhet: </strong>{GtRiskProximity}</p>\n
  <p><strong>Status usikkerhet: </strong>{GtRiskStatus}</p>`
}