import { Panel, PanelType } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectInformationContext } from '../context'
import { useFieldElements } from './useFieldElements'
import _ from 'lodash'

export const EditPropertiesPanel: FC = () => {
  const context = useContext(ProjectInformationContext)
  const { getFieldElement } = useFieldElements()
  // eslint-disable-next-line no-console
  console.log(context.state.data.fields.map(fld => _.pick(fld, 'Title', 'TypeAsString', 'ShowInEditForm')))
  return (
    <Panel
      type={PanelType.medium}
      headerText={strings.EditProjectInformationText}
      isOpen={context.state.displayEditPropertiesPanel}
      onDismiss={() => context.setState({ displayEditPropertiesPanel: false })}
      isLightDismiss
      closeButtonAriaLabel={strings.CloseText}
    >
      {context.state.data.fields.map((field, key) => {
        const fieldElement = getFieldElement(field)
        return fieldElement && <div key={key}>{fieldElement}</div>
      })}
    </Panel>
  )
}
