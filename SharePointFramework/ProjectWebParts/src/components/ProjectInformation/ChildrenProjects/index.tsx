import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import { useChildrenProjects } from './useChildrenProjects'
import styles from './ChildrenProjects.module.scss'
import { WebPartTitle, customLightTheme } from 'pp365-shared-library'
import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { CubeRegular } from '@fluentui/react-icons'

export const ChildrenProjects: FC = () => {
  const childProjects = useChildrenProjects()
  const fluentProviderId = useId('fp-children-projects-list')

  if (isEmpty(childProjects)) return null

  return (
    <div className={styles.root}>
      <WebPartTitle
        title={strings.ChildProjectsHeaderText}
        description={strings.ChildProjectsHeaderDescription}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {childProjects.map((project, idx) => {
            const onClick = () => {
              if (project.Path) {
                window.open(project.Path, '_self')
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
                <span className={styles.label}>{project.Title}</span>
              </Button>
            )
          })}
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}

