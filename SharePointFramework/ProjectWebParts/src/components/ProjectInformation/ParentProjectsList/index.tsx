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
        headingLevel={3}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {/* A list of links: each goes to a project's site (WCAG 1.3.1, 4.1.2). */}
          <ul className={styles.list}>
            {projects.map((p, idx) => {
              const Icon = p?.icon
              return (
                <li key={idx}>
                  <Button
                    as='a'
                    href={typeof p.url === 'string' ? p.url : undefined}
                    className={styles.button}
                    appearance='subtle'
                    icon={Icon ? <Icon /> : undefined}
                    iconPosition='before'
                  >
                    <span className={styles.label}>{p.title}</span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}
