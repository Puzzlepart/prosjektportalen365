import { DefaultButton, Panel, PanelType, PrimaryButton } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectInformationContext } from '../context'
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
        <div>
          <PrimaryButton text={strings.SaveText} onClick={onSave} />
          <DefaultButton
            text={strings.CancelText}
            styles={{ root: { marginLeft: 8 } }}
            onClick={() => context.setState({ displayEditPropertiesPanel: false })}
          />
        </div>
      )}
    >
      <div style={{ marginTop: 20, padding: 8 }}>{JSON.stringify(model.properties, null, 2)}</div>
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
