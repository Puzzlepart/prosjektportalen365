import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import { useProjectInformationContext } from '../context'
import styles from './ParentProjectsList.module.scss'
import { WebPartTitle, customLightTheme } from 'pp365-shared-library'
import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'

export const ParentProjectsList: FC = () => {
  const context = useProjectInformationContext()
  const projects = context.state?.data?.parentProjects || []
  const fluentProviderId = useId('fp-parent-projects-list')
  if (context.props.hideParentProjects || isEmpty(projects)) return null
  return (
    <div className={styles.root}>
      <WebPartTitle
        title={strings.ParentProjectsHeaderText}
        description={strings.ParentProjectsHeaderDescription}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {projects.map((p, idx) => {
            const Icon = p.icon
            const onClick = () => {
              if (typeof p.url === 'string') {
                window.open(p.url, '_self')
              }
            }

            return (
              <Button
                key={idx}
                className={styles.button}
                appearance='subtle'
                icon={<Icon />}
                iconPosition='before'
                onClick={onClick}
              >
                <span className={styles.label}>{p.title}</span>
              </Button>
            )
          })}
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}
