import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import { DebugModel } from './DebugModel'
import styles from './EditPropertiesPanel.module.scss'
import { EditPropertiesPanelFooter } from './EditPropertiesPanelFooter'
import { IEditPropertiesPanelProps } from './types'
import { useEditPropertiesPanel } from './useEditPropertiesPanel'

export const EditPropertiesPanel: FC<IEditPropertiesPanelProps> = (props) => {
  const { fields, getFieldElement, model } = useEditPropertiesPanel(props)
  return (
    <BasePanel
      {...props}
      className={styles.root}
      styles={{
        main: {
          overflow: 'hidden'
        }
      }}
      onRenderFooterContent={() => <EditPropertiesPanelFooter  model={model} />}
      onRenderBody={() => (
        <>
          <DebugModel model={model} />
          {fields.map((field, key) => {
            const fieldElement = getFieldElement(field)
            return fieldElement && <div key={key}>{fieldElement}</div>
          })}
        </>
      )}
    />
  )
}

EditPropertiesPanel.displayName = 'EditPropertiesPanel'
EditPropertiesPanel.defaultProps = {
  headerText: 'strings.EditProjectInformationText',
  hiddenFields: ['GtProjectPhase']
}
