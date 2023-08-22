import { Link, MessageBar } from '@fluentui/react'
import { Caption2, FluentProvider, Spinner, Text, webLightTheme } from '@fluentui/react-components'
import { DisplayMode } from '@microsoft/sp-core-library'
import { SortDirection } from '@pnp/sp/search'
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle'
import strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import React, { useEffect, useState } from 'react'
import styles from './LatestProjects.module.scss'
import { ILatestProjectsProps } from './types'

export const LatestProjects: React.FC<ILatestProjectsProps> = (props) => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewAll, setViewAll] = useState(false)

  useEffect(() => {
    props.dataAdapter
      .fetchProjectSites(props.maxRowLimit, 'Created', SortDirection.Descending)
      .then((projects) => {
        setProjects(projects)
        setLoading(false)
      })
      .catch(() => {
        setProjects([])
        setLoading(false)
      })
  }, [])

  /**
   * Render project list
   */
  function renderProjectList() {
    if (projects.length === 0) return <MessageBar>{props.emptyMessage}</MessageBar>
    const viewCount = viewAll ? projects.length : props.rowLimit
    return [...projects].slice(0, viewCount).map((site, idx) => {
      const created = formatDate(site.Created, true)
      return (
        <div key={idx} className={styles.projectItem}>
          <div className={styles.itemContainer}>
            <Caption2>
              {strings.CreatedText} {created}
            </Caption2>
            <div>
              <Text
                as='h2'
                onClick={() => {
                  window.open(site.Path, props.openInNewTab ? '_blank' : '_self')
                }}
                style={{ cursor: 'pointer' }}
              >
                {site.Title}
              </Text>
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <FluentProvider className={styles.root} theme={webLightTheme}>
      <WebPartTitle displayMode={DisplayMode.Read} title={props.title} updateProperty={undefined} />
      <div className={styles.container}>
        {loading ? (
          <Spinner size='extra-tiny' label={props.loadingText} />
        ) : (
          <>
            {renderProjectList()}
            <div className={styles.actions} hidden={projects.length <= props.rowLimit}>
              <Link onClick={() => setViewAll(!viewAll)} appearance='subtle'>
                {viewAll ? strings.ViewLessText : strings.ViewMoreText}
              </Link>
            </div>
          </>
        )}
      </div>
    </FluentProvider>
  )
}

LatestProjects.defaultProps = {
  minRowLimit: 5,
  maxRowLimit: 15
}

export * from './types'
