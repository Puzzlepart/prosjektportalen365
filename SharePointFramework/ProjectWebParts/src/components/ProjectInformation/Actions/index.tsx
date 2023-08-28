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
          <div key={idx} hidden={hidden}>
            <Button className={styles.btn} icon={<Icon />} onClick={onClick} disabled={disabled}>
              {text}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
