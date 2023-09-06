import { Button } from '@fluentui/react-components'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import styles from './Actions.module.scss'
import { useActions } from './useActions'

export const Actions: FC = () => {
  const actions = useActions()
  if (isEmpty(actions)) return null
  return (
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
            hidden={hidden}
          >
            <span className={styles.label}>{text}</span>
          </Button>
        )
      })}
    </div>
  )
}
