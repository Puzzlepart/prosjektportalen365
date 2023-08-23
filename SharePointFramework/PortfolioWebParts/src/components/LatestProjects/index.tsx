import { Link, FluentProvider, webLightTheme, Caption1, Button } from '@fluentui/react-components'
import { ChevronDownFilled, ChevronUpFilled } from '@fluentui/react-icons'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import { ProjectLogo, WebPartTitle } from 'pp365-shared-library/lib/components'
import { Alert } from '@fluentui/react-components/unstable'
import React, { FC, useEffect, useState } from 'react'
import styles from './LatestProjects.module.scss'
import { SortDirection } from '@pnp/sp/search'
import strings from 'PortfolioWebPartsStrings'
import { ILatestProjectsProps } from './types'

export const LatestProjects: FC<ILatestProjectsProps> = (props) => {
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
  function renderLatestProjects() {
    if (!loading && projects.length === 0)
      return <Alert intent='info'>{strings.NoProjectsFound}</Alert>
    const viewCount = viewAll ? projects.length : props.rowLimit
    return [...projects].slice(0, viewCount).map((site, idx) => {
      const created = formatDate(site.Created, true)
      return (
        <div key={idx} className={styles.projectItem}>
          <ProjectLogo title={site.Title} url={site.Path} hidden={!props.showProjectLogo} />
          <div className={styles.projectInformation}>
            <div>
              <Link href={site.Path} target='_blank' title={site.Title}>
                {site.Title}
              </Link>
            </div>
            <Caption1 title={`${strings.CreatedText} ${created}`}>{created}</Caption1>
          </div>
        </div>
      )
    })
  }

  return (
    <FluentProvider className={styles.root} theme={webLightTheme}>
      <WebPartTitle text={props.title} />
      <div className={styles.container}>
        {renderLatestProjects()}
        <div hidden={projects.length <= props.rowLimit}>
          <Button
            appearance='subtle'
            size='small'
            icon={viewAll ? <ChevronUpFilled /> : <ChevronDownFilled />}
            title={viewAll ? strings.ViewLessText : strings.ViewMoreText}
            onClick={() => setViewAll(!viewAll)}
          >
            {viewAll ? strings.ViewLessText : strings.ViewMoreText}
          </Button>
        </div>
      </div>
    </FluentProvider>
  )
}

LatestProjects.defaultProps = {
  showProjectLogo: false,
  rowLimit: 5,
  minRowLimit: 3,
  maxRowLimit: 10
}

export * from './types'
