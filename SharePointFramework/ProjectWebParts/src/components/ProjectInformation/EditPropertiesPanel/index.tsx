import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import { EditPropertiesPanelFooter } from './EditPropertiesPanelFooter'
import { IEditPropertiesPanel } from './types'
import { useEditPropertiesPanel } from './useEditPropertiesPanel'

export const EditPropertiesPanel: FC<IEditPropertiesPanel> = (props) => {
  const { fields, getFieldElement, model, onSave } = useEditPropertiesPanel()
  return (
    <BasePanel
      {...props}
      onRenderFooterContent={() => <EditPropertiesPanelFooter onSave={onSave} model={model} />}
    >
      {fields.map((field, key) => {
        const fieldElement = getFieldElement(field)
        return fieldElement && <div key={key}>{fieldElement}</div>
      })}
    </BasePanel>
  )
}

EditPropertiesPanel.defaultProps = {
  $type: 'EditPropertiesPanel',
  headerText: strings.EditProjectInformationText
}
