import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import * as strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { BaseDialog } from '../@BaseDialog'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './ErrorDialog.module.scss'
import { IErrorDialogProps } from './types'

export const ErrorDialog = ({
  error,
  version,
  messageType = MessageBarType.error,
  onDismiss,
  onSetupClick
}: IErrorDialogProps) => {
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
          <ReactMarkdown linkTarget='_blank' children={error.stack} rehypePlugins={[rehypeRaw]} />
        </MessageBar>
      </div>
    </BaseDialog>
  )
}

export { IErrorDialogProps }
