import React, { FC, useState } from 'react'
import { format } from '@fluentui/react'
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
import { getFluentIcon } from 'pp365-shared-library'
import { IRecentNewsProps } from './types'

export const RecentNews: FC<IRecentNewsProps> = ({ news, maxVisible = 4 }) => {
  const [showAll, setShowAll] = useState(false)
  const visibleNews = showAll ? news : news.slice(0, maxVisible)

  return (
    <>
      {news.length === 0 ? (
        <div className={styles.noRecentNews}>{strings.NoRecentNews}</div>
      ) : (
        <>
          <div className={styles.recentNews}>
            {visibleNews.map((item) => (
              <Card key={item.name} className={styles.card}>
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
                              new Date(item.modifiedDate).toLocaleDateString()
                            )}
                          >
                            {' | '}
                            {new Date(item.modifiedDate).toLocaleDateString()}
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
          <div hidden={news.length <= maxVisible}>
            <Button
              appearance='subtle'
              size='small'
              icon={showAll ? getFluentIcon('ChevronUp') : getFluentIcon('ChevronDown')}
              title={showAll ? strings.ShowLessNews : strings.ShowMoreNews}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? strings.ShowLessNews : strings.ShowMoreNews}
            </Button>
          </div>
        </>
      )}
    </>
  )
}
