import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { BaseDialog } from '../@BaseDialog'
import styles from './ErrorDialog.module.scss'
import { IErrorDialogProps } from './types'
import { DefaultButton, PrimaryButton, DialogFooter } from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library'

export const ErrorDialog: FC<IErrorDialogProps> = ({
  error,
  version,
  intent = 'error',
  onDismiss,
  onSetupClick,
  showStackAsSubText = false
}) => {
  const onRenderFooter = () => {
    if (error.name === 'AlreadySetup') {
      return (
        <>
          <DefaultButton onClick={onSetupClick} text={strings.ProvisionTemplateText} />
          <PrimaryButton
            styles={{ root: { marginLeft: 6 } }}
            text={strings.ContinueToProjectText}
            onClick={onDismiss}
          />
        </>
      )
    }
    return <PrimaryButton text={strings.CloseModalText} onClick={onDismiss} />
  }

  return (
    <BaseDialog
      version={version}
      dialogContentProps={{
        title: error.message,
        subText: showStackAsSubText ? error.stack : undefined
      }}
      modalProps={{ containerClassName: styles.root, isBlocking: false, isDarkOverlay: true }}
      onDismiss={onDismiss}
    >
      <div style={{ marginTop: 15 }} hidden={showStackAsSubText}>
        <UserMessage message={error.stack} intent={intent} />
      </div>
      <DialogFooter>{onRenderFooter()}</DialogFooter>
    </BaseDialog>
  )
}

export * from './types'
