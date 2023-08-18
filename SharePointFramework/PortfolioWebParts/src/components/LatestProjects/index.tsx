import { MessageBar } from '@fluentui/react'
import { Button, Caption2, Link, Spinner, Text } from '@fluentui/react-components'
import {
  Next24Filled,
  Next24Regular,
  Previous24Filled,
  Previous24Regular,
  bundleIcon
} from '@fluentui/react-icons'
import { DisplayMode } from '@microsoft/sp-core-library'
import { SortDirection } from '@pnp/sp/search'
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle'
import strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import React, { useEffect, useState } from 'react'
import styles from './LatestProjects.module.scss'
import { ILatestProjectsProps } from './types'

const ViewLessIcon = bundleIcon(Previous24Filled, Previous24Regular)
const ViewMoreIcon = bundleIcon(Next24Filled, Next24Regular)

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
              <Text as='h2'>
                <Link
                  href={site.Url}
                  target={props.openInNewTab ? '_blank' : '_self'}
                  appearance='subtle'
                >
                  {site.Title}
                </Link>
              </Text>
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <div className={styles.root}>
      <WebPartTitle displayMode={DisplayMode.Read} title={props.title} updateProperty={undefined} />
      <div className={styles.container}>
        {loading ? (
          <Spinner size='extra-tiny' label={props.loadingText} />
        ) : (
          <>
            {renderProjectList()}
            <div className={styles.actions} hidden={projects.length <= props.rowLimit}>
              <Button
                icon={viewAll ? <ViewLessIcon /> : <ViewMoreIcon />}
                onClick={() => setViewAll(!viewAll)}
                size='small'
                appearance='subtle'
              >
                {viewAll ? strings.ViewLessText : strings.ViewMoreText}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

LatestProjects.defaultProps = {
  minRowLimit: 5,
  maxRowLimit: 15
}

export * from './types'
