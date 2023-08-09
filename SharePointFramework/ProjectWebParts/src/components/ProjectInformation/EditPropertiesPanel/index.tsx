import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectInformationContext } from '../context'
import { useEditPropertiesPanel } from './useEditPropertiesPanel'
import _ from 'lodash'

export const EditPropertiesPanel: FC = () => {
  const context = useContext(ProjectInformationContext)
  const { fields, getFieldElement } = useEditPropertiesPanel()
  // eslint-disable-next-line no-console
  console.log(
    fields.map((fld) => _.pick(fld, 'Title', 'TypeAsString', 'Choices', 'ShowInEditForm'))
  )
  return (
    <Panel
      type={PanelType.medium}
      headerText={strings.EditProjectInformationText}
      isOpen={context.state.displayEditPropertiesPanel}
      onDismiss={() => context.setState({ displayEditPropertiesPanel: false })}
      isLightDismiss
      closeButtonAriaLabel={strings.CloseText}
    >
      {fields.map((field, key) => {
        const fieldElement = getFieldElement(field)
        return fieldElement && <div key={key}>{fieldElement}</div>
      })}
    </Panel>
  )
}
