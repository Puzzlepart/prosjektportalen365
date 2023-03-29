import { Modal, Pivot, PivotItem, ActionButton } from '@fluentui/react'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './HelpContentModal.module.scss'
import { IHelpContentModalProps } from './types'

export const HelpContentModal: FC<IHelpContentModalProps> = (props) => {
  return (
    <Modal
      isOpen={props.isOpen}
      isBlocking={false}
      onDismiss={props.onDismiss}
      styles={{ root: { overflow: 'hidden' } }}
      containerClassName={styles.root}
      scrollableContentClassName={styles.scrollableContent}>
      <div className={styles.body}>
        <Pivot>
          {props.content.map((content, index) => (
            <PivotItem
              key={index}
              headerText={content.title}
              itemIcon={content.iconName}
              style={{ overflow: 'auto', height: 'calc(100vh - 44px)' }}>
              <div className={styles.contentItem} title={content.title}>
                <p dangerouslySetInnerHTML={{ __html: content.textContent }}></p>
                {content.markdownContent && (
                  <ReactMarkdown
                    linkTarget='_blank'
                    rehypePlugins={[rehypeRaw]}
                    transformImageUri={null}>
                    {content.markdownContent}
                  </ReactMarkdown>
                )}
                {content.resourceLink && (
                  <ActionButton
                    text={content.resourceLink.Description}
                    iconProps={{ iconName: content.resourceLinkIcon }}
                    href={content.resourceLink.Url}
                  />
                )}
              </div>
            </PivotItem>
          ))}
        </Pivot>
      </div>
    </Modal>
  )
}

export * from './types'
