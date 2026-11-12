import SPDataAdapter from '../../../data'
import { CustomEditPanel, format } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import strings from 'ProjectWebPartsStrings'
import { CLOSE_PANEL } from '../reducer'
import { useEditPropertiesPanelSubmit } from './useEditPropertiesPanelSubmit'

/**
 * Edits project properties and reports save and synchronization progress.
 */
export const EditPropertiesPanel: FC = () => {
  const context = useProjectInformationContext()
  const submit = useEditPropertiesPanelSubmit()
  return (
    <CustomEditPanel
      open={context.state.activePanel === 'EditPropertiesPanel'}
      headerText={format(strings.EditProjectInformationText, context.props.title?.toLowerCase())}
      fieldValues={context.state.data.fieldValues}
      fields={context.state.properties}
      dataAdapter={SPDataAdapter}
      hiddenFields={['GtProjectPhase']}
      submit={submit}
      targetListId={context.state.data.propertiesListId}
      onClose={() => context.dispatch(CLOSE_PANEL())}
    />
  )
}

EditPropertiesPanel.displayName = 'EditPropertiesPanel'
