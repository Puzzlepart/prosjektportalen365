import {
  IMessageBarStyleProps,
  IMessageBarStyles,
  MessageBar
} from 'office-ui-fabric-react/lib/MessageBar'
import { IStyleFunctionOrObject } from 'office-ui-fabric-react'
import * as React from 'react'
import { FunctionComponent } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IUserMessageProps } from './types'

/**
 * A component that supports a MessageBar with markdown using react-markdown
 *
 * @category UserMessage
 */
export const UserMessage: FunctionComponent<IUserMessageProps> = (props: IUserMessageProps) => {
  const _styles: IStyleFunctionOrObject<IMessageBarStyleProps, IMessageBarStyles> = {}

  if (props.fixedCenter) {
    _styles.root = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: props.fixedCenter
    }
  }

  if (props.isCompact) {
    _styles.text = {
      marginTop: '3px',
      marginBottom: '0px'
    }
  }

  return (
    <div
      id={props.id}
      className={props.className}
      style={props.containerStyle}
      hidden={props.hidden}
      onClick={props.onClick}
    >
      <MessageBar
        styles={_styles}
        isMultiline={props.isMultiline}
        messageBarType={props.type}
        onDismiss={props.onDismiss}
        actions={props.actions}
      >
        {props.text && (
          <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]}>
            {props.text}
          </ReactMarkdown>
        )}
        {props.children && props.children}
      </MessageBar>
    </div>
  )
}

export * from './types'
export * from './useMessage'
