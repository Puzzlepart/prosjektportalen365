import _ from 'lodash'
import React, { FC, createElement } from 'react'
import styles from './DataTypeFields.module.scss'
import { IDataTypeFieldsProps } from './types'
import { getFluentIcon } from 'pp365-shared-library'
import { Button } from '@fluentui/react-components'

/**
 * Renders a list of fields based on the data type properties.
 *
 * @param fields - The list of fields to render.
 * @param dataTypeProperties - The data type properties to use for rendering the fields.
 * @param toggleIsFieldsVisible - A function to toggle the visibility of the fields.
 * @param isFieldsVisible - A boolean indicating whether the fields are visible or not.
 *
 * @returns A React component that renders the list of fields.
 */
export const DataTypeFields: FC<IDataTypeFieldsProps> = (props) => {
  const { fields, dataTypeProperties, toggleIsFieldsVisible, isFieldsVisible } = props

  if (_.isEmpty(fields)) {
    return null
  }

  const fieldElements = fields.map(({ type, props }) =>
    createElement(type, {
      ...props,
      key: props.label
    })
  )

  return (
    <div className={styles.root} hidden={!dataTypeProperties}>
      <Button
        appearance='subtle'
        size='medium'
        icon={isFieldsVisible ? getFluentIcon('ChevronUp') : getFluentIcon('ChevronDown')}
        title={
          isFieldsVisible
            ? 'Skjul egenskaper for visningsmodus'
            : 'Vis egenskaper for visningsmodus'
        }
        onClick={toggleIsFieldsVisible}
      >
        {isFieldsVisible
          ? 'Skjul egenskaper for visningsmodus'
          : 'Vis egenskaper for visningsmodus'}
      </Button>
      <div className={styles.container} hidden={!isFieldsVisible}>
        {fieldElements}
      </div>
    </div>
  )
}
