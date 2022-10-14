import * as strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import { BaseDialog } from '../@BaseDialog'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './ErrorDialog.module.scss'
import { IErrorDialogProps } from './types'
import { MessageBarType, DefaultButton, PrimaryButton, MessageBar } from '@fluentui/react'

export const ErrorDialog: FunctionComponent<IErrorDialogProps> = ({
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
          <PrimaryButton text={strings.ContinueToProjectText} onClick={onDismiss} />
        </>
      )
    }
    return (
      <>
        <PrimaryButton text={strings.CloseModalText} onClick={onDismiss} />
      </>
    )
  }

  return (
    <BaseDialog
      version={version}
      dialogContentProps={{ title: error.message }}
      modalProps={{ isBlocking: false, isDarkOverlay: true }}
      onRenderFooter={onRenderFooter}
      onDismiss={onDismiss}
      containerClassName={styles.errorDialog}>
      <div style={{ marginTop: 15 }}>
        <MessageBar messageBarType={messageType} className={styles.errorMessage}>
          <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]}>
            {error.stack}
          </ReactMarkdown>
        </MessageBar>
      </div>
    </BaseDialog>
  )
}

export { IErrorDialogProps }
