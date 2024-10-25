import { Text } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IIdeaFieldProps } from './types'
import { useIdeaField } from './useIdeaField'

export const IdeaField: FC<IIdeaFieldProps> = (props) => {
  const { renderValueForField } = useIdeaField(props)

  return (
    <div style={props.style}>
      <Text title={props.model.displayName} weight='semibold' size={200} block truncate>
        {props.model.displayName}
      </Text>
      <Text color='var(--colorNeutralForeground2)'>{renderValueForField()}</Text>
    </div>
  )
}

export * from './types'
