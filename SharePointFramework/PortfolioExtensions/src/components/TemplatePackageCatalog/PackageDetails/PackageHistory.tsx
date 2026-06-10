import { Link, Spinner, Text } from '@fluentui/react-components'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IChangelogEntry } from 'models'
import { CatalogService } from 'services'
import styles from './PackageDetails.module.scss'

export interface IPackageHistoryProps {
  changelogUrl?: string
}

export const PackageHistory: FC<IPackageHistoryProps> = ({ changelogUrl }) => {
  const [entries, setEntries] = useState<IChangelogEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!changelogUrl) {
      setEntries([])
      return
    }
    setLoading(true)
    void CatalogService.getChangelog(changelogUrl).then((result) => {
      if (cancelled) return
      setEntries(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [changelogUrl])

  return (
    <div className={styles.section}>
      <Text weight='semibold' className={styles.sectionTitle}>
        {strings.CatalogHistoryTitle}
      </Text>
      {loading && <Spinner size='tiny' />}
      {!loading && entries.length > 0 && (
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
      {!loading && entries.length === 0 && (
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
