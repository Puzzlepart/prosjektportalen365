import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { BaseDialog } from '../@BaseDialog'
import styles from './ErrorDialog.module.scss'
import { IErrorDialogProps } from './types'
import { Button } from '@fluentui/react-components'
import { UserMessage } from 'pp365-shared-library'

export const ErrorDialog: FC<IErrorDialogProps> = ({
  error,
  version,
  intent = 'error',
  onDismiss,
  onSetupClick,
  showStackAsSubText = false
}) => {
  const footer = () => {
    if (error.name === 'AlreadySetup') {
      return (
        <>
          <Button appearance='secondary' onClick={onSetupClick}>
            {strings.ProvisionTemplateText}
          </Button>
          <Button appearance='primary' onClick={onDismiss}>
            {strings.ContinueToProjectText}
          </Button>
        </>
      )
    }
    return (
      <Button appearance='primary' onClick={onDismiss}>
        {strings.CloseModalText}
      </Button>
    )
  }

  return (
    <BaseDialog
      version={version}
      title={error.message}
      containerClassName={styles.root}
      onDismiss={onDismiss}
      footer={footer()}
    >
      {showStackAsSubText && <p className={styles.subText}>{error.stack}</p>}
      <div hidden={showStackAsSubText}>
        <UserMessage text={error.stack} intent={intent} />
      </div>
    </BaseDialog>
  )
}
