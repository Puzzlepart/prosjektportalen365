import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './HelpContentDialog.module.scss'
import { Button } from '@fluentui/react-components'
import { HelpContentModel } from 'extensions/footer/types'

/**
 * Displays one help tab's HTML, optional Markdown and resource link.
 */
export const Content = React.memo(
  ({ content, tabId }: { content: HelpContentModel; tabId: string }) => (
    <div className={styles.contentItem} role='tabpanel' aria-labelledby={tabId}>
      <p dangerouslySetInnerHTML={{ __html: content.textContent }} />
      {content.markdownContent && (
        <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]} transformImageUri={null}>
          {content.markdownContent}
        </ReactMarkdown>
      )}
      {content.resourceLink && (
        <Button
          as='a'
          size='medium'
          appearance='primary'
          href={content.resourceLink.Url}
          target='_blank'
        >
          <span>{content.resourceLink.Description}</span>
        </Button>
      )}
    </div>
  )
)
