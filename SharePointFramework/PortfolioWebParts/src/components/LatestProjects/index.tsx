import { format } from '@fluentui/react'
import { Button, Caption1, FluentProvider, Link, webLightTheme } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import { ChevronDownFilled, ChevronUpFilled } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { ProjectLogo, WebPartTitle } from 'pp365-shared-library/lib/components'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'
import React, { FC } from 'react'
import styles from './LatestProjects.module.scss'
import { ILatestProjectsProps } from './types'
import { useLatestProjects } from './useLatestProjects'

/**
 * Renders a list of the latest projects. The list is sorted by the Created date
 * by default.
 *
 * @param props - The component props.
 * @param props.dataAdapter - The data adapter used to fetch project sites.
 * @param props.maxRowLimit - The maximum number of rows to fetch.
 * @param props.rowLimit - The number of rows to display.
 * @param props.showProjectLogo - Whether to show the project logo.
 */
export const LatestProjects: FC<ILatestProjectsProps> = (props) => {
  const { className, loading, projects, viewAll, toggleViewAll } = useLatestProjects(props)

  /**
   * Function to render the latest projects.
   */
  function renderLatestProjects(): JSX.Element[] | JSX.Element {
    if (!loading && projects.length === 0) {
      return (
        <Alert className={styles.emptyMessage} intent='info'>
          {strings.NoProjectsFoundMessage}
        </Alert>
      )
    }
    const viewCount = viewAll ? projects.length : props.rowLimit
    return [...projects].slice(0, viewCount).map((site, idx) => {
      const created = formatDate(site.Created, true)
      return (
        <div key={idx} className={className}>
          <ProjectLogo
            title={site.Title}
            url={site.Path}
            renderMode='list'
            size='48px'
            hidden={!props.showProjectLogo}
          />
          <div className={styles.container}>
            <div className={styles.title}>
              <Link href={site.Path} target='_blank' title={site.Title}>
                {site.Title}
              </Link>
            </div>
            <Caption1 title={format(strings.CreatedTooltipText, created)}>{created}</Caption1>
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
            onClick={toggleViewAll}
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
