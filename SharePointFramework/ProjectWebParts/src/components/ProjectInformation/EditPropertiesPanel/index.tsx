import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import { EditPropertiesPanelFooter } from './EditPropertiesPanelFooter'
import { IEditPropertiesPanelProps } from './types'
import { useEditPropertiesPanel } from './useEditPropertiesPanel'
import styles from './EditPropertiesPanel.module.scss'
import { DebugModel } from './DebugModel'

export const EditPropertiesPanel: FC<IEditPropertiesPanelProps> = (props) => {
  const { fields, getFieldElement, model, submit } = useEditPropertiesPanel(props)
  return (
    <BasePanel
      {...props}
      className={styles.root}
      styles={{
        main: {
          overflow: 'hidden'
        }
      }}
      onRenderFooterContent={() => <EditPropertiesPanelFooter submit={submit} model={model} />}
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
  $type: 'EditPropertiesPanel',
  headerText: strings.EditProjectInformationText,
  hiddenFields: ['GtProjectPhase']
}
