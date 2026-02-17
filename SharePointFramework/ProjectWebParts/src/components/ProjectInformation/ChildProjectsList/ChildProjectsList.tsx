import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import styles from './ChildProjectsList.module.scss'
import { WebPartTitle, customLightTheme } from 'pp365-shared-library'
import { Button, FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { CubeRegular, ChevronUpFilled, ChevronDownFilled } from '@fluentui/react-icons'
import { useChildProjectsList } from './useChildProjectsList'

export const ChildProjectsList: FC = () => {
  const { displayedProjects, shouldShowToggle, viewAll, toggleViewAll, fluentProviderId, isEmpty: isProjectsEmpty } = useChildProjectsList()

  if (isProjectsEmpty) return null

  return (
    <div className={styles.root}>
      <WebPartTitle
        title={strings.ChildProjectsHeaderText}
        description={strings.ChildProjectsHeaderDescription}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {displayedProjects.map((project, idx) => {
            const onClick = () => {
              if (project.url) {
                window.open(project.url, '_self')
              }
            }
            return (
              <Button
                key={idx}
                className={styles.button}
                appearance='subtle'
                icon={<CubeRegular />}
                iconPosition='before'
                onClick={onClick}
              >
                <span className={styles.label}>{project.title}</span>
              </Button>
            )
          })}
          <div hidden={!shouldShowToggle}>
            <Button
              appearance='subtle'
              size='small'
              icon={viewAll ? <ChevronUpFilled /> : <ChevronDownFilled />}
              title={viewAll ? 'Vis mindre' : 'Vis flere'}
              onClick={toggleViewAll}
              style={{ marginTop: '8px' }}
            >
              {viewAll ? 'Vis mindre' : 'Vis flere'}
            </Button>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}

