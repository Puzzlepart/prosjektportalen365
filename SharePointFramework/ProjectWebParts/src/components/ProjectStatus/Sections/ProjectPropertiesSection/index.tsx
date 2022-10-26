import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection'
import styles from './ProjectPropertiesSection.module.scss'
import { StatusSectionField } from './StatusSectionField'
import { IProjectPropertiesSectionProps } from './types'

export const ProjectPropertiesSection: FC<IProjectPropertiesSectionProps> = (
  props
) => {
  /**
   * Render fields specified in model.viewFields
   */
  function renderFields() {
    if (props.model.viewFields) {
      return props.model.viewFields.map((fieldName) => {
        const [fld] = props.fields.filter(
          (f) => [f.InternalName, f.Title].indexOf(fieldName) !== -1
        )
        if (fld && !stringIsNullOrEmpty(props.fieldValues[fieldName])) {
          return (
            <StatusSectionField
              key={fieldName}
              label={fld.Title}
              value={props.fieldValues[fieldName]}
              width={props.fieldWidth}
            />
          )
        }
        return null
      })
    }
    return null
  }

  return (
    <BaseSection {...props}>
      <div className='ms-Grid-row'>
        <div className='ms-Grid-col ms-sm12'>
          <StatusElement {...props.headerProps} />
        </div>
        <div className={`${styles.fields} ms-Grid-col ms-sm12`}>{renderFields()}</div>
      </div>
    </BaseSection>
  )
}
