import { Text } from '@fluentui/react-components'
import React, { FC } from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import { IIdeaFieldProps } from './types'
import { useIdeaField } from './useIdeaField'

export const IdeaField: FC<IIdeaFieldProps> = (props) => {
  const { renderValueForField } = useIdeaField(props)

  return (
    <div style={props.style}>
      <Text title={props.model.displayName} weight='semibold' size={200} block truncate>
        {props.model.displayName}
      </Text>
      {renderValueForField() ? (
        <Text>{renderValueForField()}</Text>
      ) : (
        <Text style={{ color: 'var(--colorNeutralForeground4)' }}>{strings.NotSpecifiedText}</Text>
      )}
    </div>
  )
}

export * from './types'
