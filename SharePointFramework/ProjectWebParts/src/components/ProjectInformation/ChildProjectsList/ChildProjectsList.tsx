import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './ChildProjectsList.module.scss'
import { WebPartTitle, customLightTheme } from 'pp365-shared-library'
import { Button, FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { ChevronUpFilled, ChevronDownFilled } from '@fluentui/react-icons'
import { useChildProjectsList } from './useChildProjectsList'

/** Lists child projects with an option to expand beyond the row limit. */
export const ChildProjectsList: FC = () => {
  const {
    projects,
    shouldShowToggle,
    viewAll,
    toggleViewAll,
    fluentProviderId,
    hideChildProjectsList
  } = useChildProjectsList()

  if (hideChildProjectsList) return null

  return (
    <div className={styles.root}>
      <WebPartTitle
        title={strings.ChildProjectsHeaderText}
        description={strings.ChildProjectsHeaderDescription}
        headingLevel={3}
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <ul className={styles.list} role='list'>
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
          <div hidden={!shouldShowToggle}>
            <Button
              appearance='subtle'
              size='small'
              icon={viewAll ? <ChevronUpFilled /> : <ChevronDownFilled />}
              title={
                viewAll ? strings.ShowLessChildProjectsText : strings.ShowMoreChildProjectsText
              }
              onClick={toggleViewAll}
            >
              {viewAll ? strings.ShowLessChildProjectsText : strings.ShowMoreChildProjectsText}
            </Button>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}
