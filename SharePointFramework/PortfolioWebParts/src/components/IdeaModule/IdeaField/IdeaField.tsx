import { Text } from '@fluentui/react-components'
import React, { FC } from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import styles from './IdeaField.module.scss'
import { IIdeaFieldProps } from './types'
import { useIdeaField } from './useIdeaField'

/**
 * A field of an idea as a name and value pair, in the description list of the idea's fields
 * (WCAG 1.3.1).
 */
export const IdeaField: FC<IIdeaFieldProps> = (props) => {
  const { renderValueForField } = useIdeaField(props)

  return (
    <div className={props.className} style={props.style}>
      <dt className={styles.name}>
        <Text title={props.model.displayName} weight='semibold' size={200} block truncate>
          {props.model.displayName}
        </Text>
      </dt>
      <dd className={styles.value}>
        {renderValueForField() ? (
          <Text>{renderValueForField()}</Text>
        ) : (
          <Text style={{ color: 'var(--colorNeutralForeground4)' }}>
            {strings.NotSpecifiedText}
          </Text>
        )}
      </dd>
    </div>
  )
}

export * from './types'
