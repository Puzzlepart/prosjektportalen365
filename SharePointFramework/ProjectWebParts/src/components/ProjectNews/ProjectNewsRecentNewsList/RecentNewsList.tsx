import * as React from 'react'
import { Card, CardHeader, Link, Text, Button } from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'

export interface NewsItem {
  name: string
  url: string
  authorName?: string
  modifiedDate?: string
  imageUrl?: string
  description?: string
}

interface RecentNewsListProps {
  news: NewsItem[]
}

const MAX_VISIBLE = 6

const RecentNewsList: React.FC<RecentNewsListProps> = ({ news }) => {
  const [showAll, setShowAll] = React.useState(false)

  const visibleNews = showAll ? news : news.slice(0, MAX_VISIBLE)

  return (
    <>
      <h3>{strings.RecentNewsTitle}</h3>
      {news.length === 0 ? (
        <div>{strings.NoRecentNews}</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              margin: '16px 0'
            }}>
            {visibleNews.map((item) => (
              <Card key={item.name} style={{ minHeight: 180 }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=''
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }}
                  />
                )}
                <CardHeader
                  header={
                    <Link href={item.url} target='_blank' rel='noopener noreferrer'>
                      {item.name}
                    </Link>
                  }
                  description={
                    <Text>
                      {item.authorName && <span>{item.authorName}</span>}
                      {item.modifiedDate && (
                        <>
                          {' · '}
                          <span>
                            {strings.EditedLabel || 'Edited'}{' '}
                            {new Date(item.modifiedDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </Text>
                  }
                />
                {item.description && (
                  <Text size={300} style={{ marginTop: 8, color: '#666' }}>
                    {item.description}
                  </Text>
                )}
              </Card>
            ))}
          </div>
          {!showAll && news.length > MAX_VISIBLE && (
            <Button
              appearance='secondary'
              onClick={() => setShowAll(true)}
              style={{ marginTop: 12 }}>
              {strings.ShowMoreNews}
            </Button>
          )}
          {showAll && news.length > MAX_VISIBLE && (
            <Button
              appearance='secondary'
              onClick={() => setShowAll(false)}
              style={{ marginTop: 12 }}>
              {strings.ShowLessNews}
            </Button>
          )}
        </>
      )}
    </>
  )
}

export default RecentNewsList
