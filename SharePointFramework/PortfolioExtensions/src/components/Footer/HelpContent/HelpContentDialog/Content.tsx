import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './HelpContentDialog.module.scss'
import { Button } from '@fluentui/react-components'
import { HelpContentModel } from 'extensions/footer/types'

export const Content = React.memo(({ content }: { content: HelpContentModel }) => (
  <div className={styles.contentItem} title={content.title}>
    <p dangerouslySetInnerHTML={{ __html: content.textContent }}></p>
    {content.markdownContent && (
      <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]} transformImageUri={null}>
        {content.markdownContent}
      </ReactMarkdown>
    )}
    {content.resourceLink && (
      <Button
        size='medium'
        appearance='primary'
        onClick={() => window.open(content.resourceLink.Url, '_blank')}
      >
        <span>{content.resourceLink.Description}</span>
      </Button>
    )}
  </div>
))
