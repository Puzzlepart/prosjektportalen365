import { Link, Skeleton, SkeletonItem, Text } from '@fluentui/react-components'
import { formatDate } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './PackageDetails.module.scss'
import { usePackageHistory } from './usePackageHistory'

export interface IPackageHistoryProps {
  changelogUrl?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DMY_DATE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/

/**
 * Formats a changelog heading date with the shared `formatDate` (same format
 * as the "Publisert …" meta line). Headings normally carry Keep-a-Changelog
 * ISO dates (`2026-06-09`); a legacy `dd/mm/yyyy` is rearranged manually
 * first — `new Date('11/05/2026')` would otherwise parse as US mm/dd.
 * Anything unparseable renders as written.
 */
const formatChangelogDate = (raw: string): string => {
  if (ISO_DATE.test(raw)) return formatDate(raw)
  const dmy = DMY_DATE.exec(raw)
  if (dmy) {
    return formatDate(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`)
  }
  return raw
}

export const PackageHistory: FC<IPackageHistoryProps> = ({ changelogUrl }) => {
  const { entries, loading, error, retry } = usePackageHistory(changelogUrl)

  return (
    <div className={styles.section}>
      <Text weight='semibold' className={styles.sectionTitle}>
        {strings.CatalogHistoryTitle}
      </Text>
      {loading && (
        <Skeleton aria-hidden className={styles.skeletonRows}>
          <SkeletonItem size={16} />
          <SkeletonItem size={12} />
          <SkeletonItem size={12} />
        </Skeleton>
      )}
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
                {entry.date ? ` — ${formatChangelogDate(entry.date)}` : ''}
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
