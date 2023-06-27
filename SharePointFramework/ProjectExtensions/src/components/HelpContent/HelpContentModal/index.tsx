import { ActionButton, Modal, Pivot, PivotItem } from '@fluentui/react'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './HelpContentModal.module.scss'
import { IHelpContentModalProps } from './types'
import { useHelpContentModal } from './useHelpContentModal'

export const HelpContentModal: FC<IHelpContentModalProps> = (props) => {
  const { getHeight } = useHelpContentModal()

  return (
    <Modal
      isOpen={props.isOpen}
      isBlocking={false}
      onDismiss={props.onDismiss}
      styles={{
        main: { overflow: 'hidden', ...getHeight() },
        scrollableContent: { overflow: 'hidden', ...getHeight(44) }
      }}
      containerClassName={styles.root}>
      <div className={styles.body} style={{ ...getHeight(44) }}>
        <Pivot>
          {props.content.map((content, index) => (
            <PivotItem
              key={index}
              headerText={content.title}
              itemIcon={content.iconName}
              style={{ overflow: 'hidden' }}>
              <div
                className={styles.contentItem}
                title={content.title}
                style={{ ...getHeight(100) }}>
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
