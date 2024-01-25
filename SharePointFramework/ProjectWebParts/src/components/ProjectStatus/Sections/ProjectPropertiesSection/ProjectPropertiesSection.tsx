import { stringIsNullOrEmpty } from '@pnp/core'
import React, { FC, useContext } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/BaseSection'
import { SectionContext } from '../context'
import styles from './ProjectPropertiesSection.module.scss'
import { StatusSectionField } from './StatusSectionField/StatusSectionField'
import { useProjectPropertiesSection } from './useProjectPropertiesSection'

export const ProjectPropertiesSection: FC = () => {
  const { section } = useContext(SectionContext)
  const { fieldValues, fieldValuesAsText, fields } = useProjectPropertiesSection()

  /**
   * Render fields specified in model.viewFields
   */
  function renderFields() {
    if (section.viewFields) {
      return section.viewFields.map((fieldName) => {
        const [field] = fields.filter(
          ({ InternalName, Title }) => [InternalName, Title].indexOf(fieldName) !== -1
        )
        if (field && !stringIsNullOrEmpty(fieldValuesAsText[fieldName])) {
          if (field.TypeAsString === 'DateTime' || field.TypeAsString === 'Date') {
            const date = new Date(fieldValues[fieldName])
            return (
              <StatusSectionField
                key={fieldName}
                label={field.Title}
                value={date.toLocaleDateString()}
              />
            )
          }

          return (
            <StatusSectionField
              key={fieldName}
              label={field.Title}
              value={fieldValuesAsText[fieldName]}
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
      <div className={styles.projectPropertiesSection}>
        <StatusElement />
        <div className={styles.fields}>{renderFields()}</div>
      </div>
    </BaseSection>
  )
}
