import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectInformationContext } from '../context'
import { EditPropertiesPanelFooter } from './EditPropertiesPanelFooter'
import { IEditPropertiesPanel } from './types'
import { useEditPropertiesPanel } from './useEditPropertiesPanel'

export const EditPropertiesPanel: FC<IEditPropertiesPanel> = (props) => {
  const context = useContext(ProjectInformationContext)
  const { fields, getFieldElement, model, onSave } = useEditPropertiesPanel()

  return (
    <Panel
      {...props}
      isOpen={context.state.displayEditPropertiesPanel}
      onDismiss={() => context.setState({ displayEditPropertiesPanel: false })}
      onRenderFooterContent={() => (
        <EditPropertiesPanelFooter onSave={onSave} isChanged={model.isChanged} />
      )}
    >
      <div
        style={{
          fontSize: 10,
          marginTop: 20,
          padding: 15,
          backgroundColor: 'rgb(240, 240, 240)',
          whiteSpace: 'pre'
        }}
      >
        {JSON.stringify(model.properties, null, '\t')}
      </div>
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
