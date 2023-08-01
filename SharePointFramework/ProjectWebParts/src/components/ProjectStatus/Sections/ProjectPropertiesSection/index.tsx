import { stringIsNullOrEmpty } from '@pnp/core'
import { ProjectStatusContext } from '../../../ProjectStatus/context'
import React, { FC, useContext } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection'
import { SectionContext } from '../context'
import styles from './ProjectPropertiesSection.module.scss'
import { StatusSectionField } from './StatusSectionField'
import { useProjectPropertiesSection } from './useProjectPropertiesSection'

export const ProjectPropertiesSection: FC = () => {
  const context = useContext(ProjectStatusContext)
  const { section } = useContext(SectionContext)
  const { fieldValues, fields } = useProjectPropertiesSection()

  /**
   * Render fields specified in model.viewFields
   */
  function renderFields() {
    if (section.viewFields) {
      return section.viewFields.map((fieldName) => {
        const [fld] = fields.filter((f) => [f.InternalName, f.Title].indexOf(fieldName) !== -1)
        if (fld && !stringIsNullOrEmpty(fieldValues[fieldName])) {
          return (
            <StatusSectionField
              key={fieldName}
              label={fld.Title}
              value={fieldValues[fieldName]}
              width={context.props.fieldWidth}
            />
          )
        }
        return null
      })
    }
    return null
  }

  return (
    <BaseSection>
      <div className={styles.root}>
        <div className={styles.container}>
          <StatusElement />
        </div>
        <div className={styles.fields}>{renderFields()}</div>
      </div>
    </BaseSection>
  )
}
