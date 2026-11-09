import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './HelpContentDialog.module.scss'
import { Button } from '@fluentui/react-components'
import { HelpContentModel } from 'extensions/footer/types'

/**
 * One help entry: the panel of its tab (WCAG 1.3.1), its text and, when it has one, a link to
 * more.
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
        // A page, so a link, which can be opened where the user wants it (WCAG 4.1.2).
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
