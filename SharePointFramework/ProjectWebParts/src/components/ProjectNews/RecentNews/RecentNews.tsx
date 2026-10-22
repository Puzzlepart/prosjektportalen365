import React, { FC } from 'react'
import {
  Card,
  CardHeader,
  Link,
  Text,
  Button,
  Caption1,
  Caption1Strong
} from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'
import styles from './RecentNews.module.scss'
import { getFluentIcon, format, formatShortDate } from 'pp365-shared-library'
import { IRecentNewsProps } from './types'
import { useRecentNews } from './useRecentNews'

/**
 * The project's latest news as a list, the first few shown, and a button that shows the rest.
 */
export const RecentNews: FC<IRecentNewsProps> = (props) => {
  const { showAll, toggleShowAll, visibleNews, hasMore, listId } = useRecentNews(props)

  return (
    <>
      {props.news.length === 0 ? (
        <div className={styles.noRecentNews}>{strings.NoRecentNews}</div>
      ) : (
        <>
          <div id={listId} className={styles.recentNews} role='list'>
            {visibleNews.map((item) => (
              <Card key={item.name} className={styles.card} role='listitem'>
                {item.imageUrl && <img src={item.imageUrl} alt='' className={styles.cardImage} />}
                <CardHeader
                  header={
                    <Link href={item.url} target='_blank' rel='noopener noreferrer'>
                      {item.name.replace(/\.aspx$/i, '').replace(/-/g, ' ')}{' '}
                      {/* Remove .aspx extension and replace dashes with spaces */}
                    </Link>
                  }
                  description={
                    <div>
                      {item.authorName && <Caption1Strong>{item.authorName}</Caption1Strong>}
                      {item.modifiedDate && (
                        <>
                          <Caption1
                            title={format(
                              strings.ModifiedTooltipText,
                              formatShortDate(item.modifiedDate)
                            )}
                          >
                            <span aria-hidden> | </span>
                            {formatShortDate(item.modifiedDate)}
                          </Caption1>
                        </>
                      )}
                    </div>
                  }
                />
                {item.description && (
                  <Text size={300} className={styles.cardDescription}>
                    {item.description}
                  </Text>
                )}
              </Card>
            ))}
          </div>
          <div hidden={!hasMore}>
            <Button
              appearance='subtle'
              size='small'
              icon={showAll ? getFluentIcon('ChevronUp') : getFluentIcon('ChevronDown')}
              aria-expanded={showAll}
              aria-controls={listId}
              onClick={toggleShowAll}
            >
              {showAll ? strings.ShowLessNews : strings.ShowMoreNews}
            </Button>
          </div>
        </>
      )}
    </>
  )
}
