import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import { EditPropertiesPanelFooter } from './EditPropertiesPanelFooter'
import { IEditPropertiesPanel } from './types'
import { useEditPropertiesPanel } from './useEditPropertiesPanel'
import { CLOSE_PANEL } from '../reducer'

export const EditPropertiesPanel: FC<IEditPropertiesPanel> = (props) => {
  const context = useProjectInformationContext()
  const { fields, getFieldElement, model, onSave } = useEditPropertiesPanel()
  //const onSyncProperties = usePropertiesSync(context)

  return (
    <Panel
      {...props}
      isOpen={context.state.activePanel === 'EditPropertiesPanel'}
      onDismiss={() => context.dispatch(CLOSE_PANEL())}
      onRenderFooterContent={() => <EditPropertiesPanelFooter onSave={onSave} model={model} />}
    >
      {fields.map((field, key) => {
        const fieldElement = getFieldElement(field)
        return fieldElement && <div key={key}>{fieldElement}</div>
      })}
    </Panel>
  )
}

EditPropertiesPanel.defaultProps = {
  type: PanelType.medium,
  headerText: strings.EditProjectInformationText,
  isLightDismiss: true,
  closeButtonAriaLabel: strings.CloseText
}
