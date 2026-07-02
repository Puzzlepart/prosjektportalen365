import { Link, Spinner, Text } from '@fluentui/react-components'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './PackageDetails.module.scss'
import { usePackageHistory } from './usePackageHistory'

export interface IPackageHistoryProps {
  changelogUrl?: string
}

export const PackageHistory: FC<IPackageHistoryProps> = ({ changelogUrl }) => {
  const { entries, loading, error, retry } = usePackageHistory(changelogUrl)

  return (
    <div className={styles.section}>
      <Text weight='semibold' className={styles.sectionTitle}>
        {strings.CatalogHistoryTitle}
      </Text>
      {loading && <Spinner size='tiny' />}
      {!loading && error && (
        <Text size={200} className={styles.muted}>
          {strings.CatalogHistoryError} <Link onClick={retry}>{strings.CatalogRetryText}</Link>
        </Text>
      )}
      {!loading && !error && entries.length > 0 && (
        <div className={styles.history}>
          {entries.map((entry) => (
            <div key={entry.version} className={styles.historyEntry}>
              <Text weight='semibold'>
                v{entry.version}
                {entry.date ? ` — ${entry.date}` : ''}
              </Text>
              {entry.notes.length > 0 && (
                <ul className={styles.historyNotes}>
                  {entry.notes.map((note, index) => (
                    <li key={index}>
                      <ReactMarkdown
                        linkTarget='_blank'
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          // Render each bullet inline (no block <p> margins inside the <li>).
                          p: ({ children }) => <Text size={200}>{children}</Text>,
                          a: ({ node, ...props }) => <a {...props} rel='noopener noreferrer' />,
                          code: ({ node, inline, ...props }) => (
                            <code className={styles.inlineCode} {...props} />
                          )
                        }}
                      >
                        {note}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && !error && entries.length === 0 && (
        <Text size={200} className={styles.muted}>
          {changelogUrl ? (
            <Link href={changelogUrl} target='_blank'>
              {strings.CatalogChangelogLinkText}
            </Link>
          ) : (
            strings.CatalogHistoryUnavailable
          )}
        </Text>
      )}
    </div>
  )
}
