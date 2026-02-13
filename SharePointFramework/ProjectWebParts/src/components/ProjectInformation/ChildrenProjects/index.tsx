import strings from 'ProjectWebPartsStrings'
import React, { FC, useEffect, useState } from 'react'
import { isEmpty } from 'underscore'
import { useProjectInformationContext } from '../context'
import styles from './ChildrenProjects.module.scss'
import { WebPartTitle, customLightTheme } from 'pp365-shared-library'
import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { CubeRegular, ChevronRightFilled, ChevronDownFilled } from '@fluentui/react-icons'

const COLLAPSE_TRESHOLD = 3
const COLLAPSE_NUMBER = 2

export const ChildProjectsList: FC = () => {
  const context = useProjectInformationContext()
  const childProjects = context.state?.data?.childProjects || []
  const fluentProviderId = useId('fp-children-projects-list')
  const shouldCollapse = childProjects.length >= COLLAPSE_TRESHOLD
  const [childProjectsStateArray, setChildProjectsStateArray] = useState(childProjects)
  const chevronIcon = childProjectsStateArray.length > COLLAPSE_NUMBER ? <ChevronDownFilled/> : <ChevronRightFilled/>

  useEffect(() => {
    setChildProjectsStateArray(childProjects.slice(0,COLLAPSE_NUMBER))
  },
  [childProjects]
  )

function Collapse() {
  const isExpanded = childProjectsStateArray.length === childProjects.length
  if (isExpanded) {
    setChildProjectsStateArray(childProjects.slice(0, COLLAPSE_NUMBER))
  } else {
    setChildProjectsStateArray(childProjects)
  }
}

  if (isEmpty(childProjects)) return null

  return (
    <div className={styles.root}>
      <WebPartTitle
        title={strings.ChildProjectsHeaderText}
        description={strings.ChildProjectsHeaderDescription}
      />
      {shouldCollapse ? (
        <Button
          onClick={() => (Collapse())}
          className={styles.button}
          appearance='subtle'
          iconPosition='before'
          style={{ marginBottom: '8px' }}
          icon={chevronIcon}
        >
          {childProjectsStateArray.length > COLLAPSE_NUMBER ? "Vis mindre" : "Vis flere"}
        </Button>
      ) : null}
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {childProjectsStateArray.map((project, idx) => {
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
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}

