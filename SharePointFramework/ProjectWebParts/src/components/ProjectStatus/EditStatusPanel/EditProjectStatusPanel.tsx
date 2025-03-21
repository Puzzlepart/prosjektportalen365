import { CustomEditPanel } from 'pp365-shared-library'
import React, { FC } from 'react'
import SPDataAdapter from '../../../data'
import { useEditStatusPanel } from './useEditStatusPanel'
import { Toaster } from '@fluentui/react-components'

/**
 * Edit properties panel uses `CustomEditPanel` to render an edit
 * panel for the project information component. If the field values
 * are not set, the panel will render `null`.
 */
export const EditStatusPanel: FC = () => {
  const { headerText, isOpen, onDismiss, fields, fieldValues, submit } = useEditStatusPanel()
  if (!fieldValues.id) return null

  return (
    <>
      <CustomEditPanel
        isOpen={isOpen}
        headerText={headerText}
        fieldValues={fieldValues}
        fields={fields}
        dataAdapter={SPDataAdapter}
        submit={submit}
        hiddenFields={['Title']}
        onLightDismissClick={onDismiss}
        onDismiss={onDismiss}
      />
      <Toaster id='toaster-test' />
    </>
  )
}

EditStatusPanel.displayName = 'EditStatusPanel'
