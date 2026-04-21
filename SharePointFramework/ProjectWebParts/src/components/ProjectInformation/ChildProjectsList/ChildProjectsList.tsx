import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './ChildProjectsList.module.scss'
import { WebPartTitle, customLightTheme } from 'pp365-shared-library'
import { Button, FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { ChevronUpFilled, ChevronDownFilled } from '@fluentui/react-icons'
import { useChildProjectsList } from './useChildProjectsList'

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
      />
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {projects.map((p, idx) => {
            const Icon = p?.icon
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
                icon={Icon ? <Icon /> : undefined}
                iconPosition='before'
                onClick={onClick}
              >
                <span className={styles.label}>{p.title}</span>
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
            >
              {viewAll ? 'Vis mindre' : 'Vis flere'}
            </Button>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}
