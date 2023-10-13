import strings from 'ProjectWebPartsStrings'
import { CustomEditPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import SPDataAdapter from '../../../data'
import { useEditStatusPanel } from './useEditStatusPanel'

/**
 * Edit properties panel uses `CustomEditPanel` to render an edit
 * panel for the project information component.
 */
export const EditStatusPanel: FC = () => {
  const { isOpen, onDismiss, fields, fieldValues, submit } = useEditStatusPanel()
  return (
    <CustomEditPanel
      isOpen={isOpen}
      headerText={strings.EditStatusPanelnText}
      fieldValues={fieldValues}
      fields={fields}
      dataAdapter={SPDataAdapter}
      submit={submit}
      hiddenFields={['Title']}
      onDismiss={onDismiss}
    />
  )
}

EditStatusPanel.displayName = 'EditStatusPanel'
