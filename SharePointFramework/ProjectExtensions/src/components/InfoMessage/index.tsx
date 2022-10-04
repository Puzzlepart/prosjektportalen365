import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IInfoMessageProps } from './IInfoMessageProps'
import styles from './InfoMessage.module.scss'

export const InfoMessage = (props: IInfoMessageProps) => {
  const [hidden, setHidden] = useState(false)
  return (
    <div className={styles.infoMessage} hidden={hidden}>
      <MessageBar messageBarType={props.type} onDismiss={() => setHidden(true)}>
        <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]}>
          {props.text}
        </ReactMarkdown>
      </MessageBar>
    </div>
  )
}
