import { Field, FluentProvider, IdPrefixProvider, Switch } from '@fluentui/react-components'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { DynamicMatrix } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'
import { useOpportunityMatrix } from './useOpportunityMatrix'
import { UserMessage, customLightTheme } from 'pp365-shared-library'

export const OpportunityMatrix: FC<IOpportunityMatrixProps> = (props) => {
  const {
    configuration,
    error,
    getElementsForCell,
    setShowPostAction,
    showPostAction,
    fluentProviderId
  } = useOpportunityMatrix(props)
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
        {!!error ? (
          <UserMessage title={strings.ErrorTitle} text={error} intent='error' />
        ) : (
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
                disabled={!!error}
              />
            </Field>
          </>
        )}
      </FluentProvider>
    </IdPrefixProvider>
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
