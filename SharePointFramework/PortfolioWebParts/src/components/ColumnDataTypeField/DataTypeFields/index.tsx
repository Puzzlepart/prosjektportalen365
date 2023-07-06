import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import React, { FC, createElement } from 'react'
import styles from './DataTypeFields.module.scss'
import { IDataTypeFieldsProps } from './types'

export const DataTypeFields: FC<IDataTypeFieldsProps> = (props) => {
  return !_.isEmpty(props.fields) ? (
    <div className={styles.root} hidden={!props.dataTypeProperties}>
      <div className={styles.header} onClick={props.toggleIsFieldsVisible}>
        <span className={styles.title}>{strings.ColumnRenderDataTypePropertiesHeaderText}</span>
      </div>
      <div className={styles.container} hidden={!props.isFieldsVisible}>
        {props.fields.map(([component, props]) =>
          createElement(component, {
            ...props,
            key: props.label
          })
        )}
      </div>
    </div>
  ) : null
}
