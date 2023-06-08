import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { BaseDialog } from '../@BaseDialog'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './ErrorDialog.module.scss'
import { IErrorDialogProps } from './types'
import {
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  MessageBar,
  DialogFooter
} from '@fluentui/react'

export const ErrorDialog: FC<IErrorDialogProps> = ({
  error,
  version,
  messageType = MessageBarType.error,
  onDismiss,
  onSetupClick
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
      dialogContentProps={{ title: error.message }}
      modalProps={{ containerClassName: styles.root, isBlocking: false, isDarkOverlay: true }}
      onDismiss={onDismiss}
    >
      <div style={{ marginTop: 15 }}>
        <MessageBar messageBarType={messageType} className={styles.errorMessage}>
          <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]}>
            {error.stack}
          </ReactMarkdown>
        </MessageBar>
      </div>
      <DialogFooter>{onRenderFooter()}</DialogFooter>
    </BaseDialog>
  )
}

export * from './types'
