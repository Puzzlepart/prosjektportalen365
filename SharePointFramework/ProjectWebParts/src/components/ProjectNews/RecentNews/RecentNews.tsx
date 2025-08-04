import * as React from 'react'
import { Card, CardHeader, Link, Text, Button } from '@fluentui/react-components'

import * as strings from 'ProjectWebPartsStrings'
import styles from './RecentNews.module.scss'
import { RecentNewsListProps } from '../types'

const RecentNewsList: React.FC<RecentNewsListProps> = ({ news, maxVisible = 6 }) => {
  const [showAll, setShowAll] = React.useState(false)
  const visibleNews = showAll ? news : news.slice(0, maxVisible)

  return (
    <>
      {news.length === 0 ? (
        <div>{strings.NoRecentNews}</div>
      ) : (
        <>
          <div className={styles.grid}>
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
                    <Text>
                      {item.authorName && <span>{item.authorName}</span>}
                      {item.modifiedDate && (
                        <>
                          {' · '}
                          <span>
                            {strings.EditedLabel} {new Date(item.modifiedDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </Text>
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
          {!showAll && news.length > maxVisible && (
            <Button
              appearance='secondary'
              onClick={() => setShowAll(true)}
              className={styles.showMoreButton}
            >
              {strings.ShowMoreNews}
            </Button>
          )}
          {showAll && news.length > maxVisible && (
            <Button
              appearance='secondary'
              onClick={() => setShowAll(false)}
              className={styles.showMoreButton}
            >
              {strings.ShowLessNews}
            </Button>
          )}
        </>
      )}
    </>
  )
}

export default RecentNewsList
