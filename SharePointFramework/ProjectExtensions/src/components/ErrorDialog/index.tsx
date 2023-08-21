import {
  DefaultButton,
  MessageBar,
  MessageBarType,
  PrimaryButton
} from '@fluentui/react'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { BaseDialog } from '../@BaseDialog'
import styles from './ErrorDialog.module.scss'
import { IErrorDialogProps } from './types'

export const ErrorDialog: FC<IErrorDialogProps> = ({
  error,
  version,
  messageType = MessageBarType.error,
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
    content={(
      <div style={{ marginTop: 15 }} hidden={showStackAsSubText}>
        <MessageBar messageBarType={messageType} className={styles.errorMessage}>
          <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]}>
            {error.stack}
          </ReactMarkdown>
        </MessageBar>
      </div>
    )}  
    actions={onRenderFooter()}
    />
  )
}

export * from './types'
