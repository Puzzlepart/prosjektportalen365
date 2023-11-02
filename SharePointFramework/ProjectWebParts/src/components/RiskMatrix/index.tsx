import { Field, FluentProvider, Switch, webLightTheme } from '@fluentui/react-components'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { DynamicMatrix } from '../DynamicMatrix'
import { IRiskMatrixProps } from './types'
import { useRiskMatrix } from './useRiskMatrix'
import { UserMessage } from 'pp365-shared-library'

export const RiskMatrix: FC<IRiskMatrixProps> = (props) => {
  const {
    configuration,
    error,
    getElementsForCell,
    setShowPostAction,
    showPostAction,
    fluentProviderId
  } = useRiskMatrix(props)
  return (
    <FluentProvider
      id={fluentProviderId}
      theme={webLightTheme}
      style={{ background: 'transparent' }}
    >
      {!!error ? (
        <UserMessage title={strings.ErrorTitle} message={error} intent='error' />
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
  )
}

RiskMatrix.defaultProps = {
  items: [],
  fullWidth: true,
  calloutTemplate: `
  <h3>{Title}</h3>\n
  <p><strong>Usikkerhetstrategi: </strong>{GtRiskStrategy}</p>\n
  <p><strong>Nærhet: </strong>{GtRiskProximity}</p>\n
  <p><strong>Status usikkerhet: </strong>{GtRiskStatus}</p>`,
  size: '5',
  colorScaleConfig: [
    { p: 10, r: 44, g: 186, b: 0 },
    { p: 30, r: 163, g: 255, b: 0 },
    { p: 50, r: 255, g: 244, b: 0 },
    { p: 70, r: 255, g: 167, b: 0 },
    { p: 90, r: 255, g: 0, b: 0 }
  ]
}

export * from './types'
