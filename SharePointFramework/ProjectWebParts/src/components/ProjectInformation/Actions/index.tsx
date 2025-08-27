import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import styles from './Actions.module.scss'
import { useActions } from './useActions'
import { customLightTheme } from 'pp365-shared-library'

export const Actions: FC = () => {
  const actions = useActions()
  const fluentProviderId = useId('fp-project-information-actions')
  if (isEmpty(actions)) return null
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <div className={styles.root}>
          {actions.map(([text, onClickOrHref, Icon, disabled, hidden], idx) => {
            const onClick = () => {
              if (typeof onClickOrHref === 'string') {
                window.open(onClickOrHref, '_self')
              } else {
                onClickOrHref()
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
                disabled={disabled}
                style={{ display: hidden && 'none' }}
              >
                <span className={styles.label}>{text}</span>
              </Button>
            )
          })}
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
