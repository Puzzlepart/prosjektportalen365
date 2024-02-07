import SPDataAdapter from '../../../data'
import { CustomEditPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import strings from 'ProjectWebPartsStrings'
import { CLOSE_PANEL } from '../reducer'
import { useEditPropertiesPanelSubmit } from './useEditPropertiesPanelSubmit'

/**
 * Edit properties panel uses `CustomEditPanel` to render an edit
 * panel for the project information component.
 */
export const EditPropertiesPanel: FC = () => {
  const context = useProjectInformationContext()
  const submit = useEditPropertiesPanelSubmit()
  return (
    <CustomEditPanel
      isOpen={context.state.activePanel === 'EditPropertiesPanel'}
      headerText={strings.EditProjectInformationText}
      fieldValues={context.state.data.fieldValues}
      fields={context.state.properties}
      dataAdapter={SPDataAdapter}
      hiddenFields={['GtProjectPhase']}
      submit={submit}
      targetistId={context.state.data.propertiesListId}
      onDismiss={() => context.dispatch(CLOSE_PANEL())}
    />
  )
}

EditPropertiesPanel.displayName = 'EditPropertiesPanel'
