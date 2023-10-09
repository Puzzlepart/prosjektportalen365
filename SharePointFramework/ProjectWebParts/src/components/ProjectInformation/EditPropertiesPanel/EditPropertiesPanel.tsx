import SPDataAdapter from 'data'
import { CustomEditPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'

export const EditPropertiesPanel: FC = () => {
  const context = useProjectInformationContext()
  if(context.state.activePanel === 'EditPropertiesPanel') {
    return (
      <CustomEditPanel
        isOpen={true}
        fieldValues={context.state.data.fieldValues}
        fields={context.state.properties}
        dataAdapter={SPDataAdapter}
    />
    )
  }
  return null
}

EditPropertiesPanel.displayName = 'EditPropertiesPanel'