import { ActionButton, IButtonProps } from 'office-ui-fabric-react/lib/Button'
import React, { FunctionComponent } from 'react'
import { isEmpty } from 'underscore'
import styles from './Actions.module.scss'
import { useActions } from './useActions'

export const Actions: FunctionComponent = () => {
  const actions = useActions()
  return (
    <div className={styles.root} hidden={isEmpty(actions)}>
      {actions.map(([text, hrefOrOnClick, iconName, disabled, hidden], idx) => {
        const buttonProps: IButtonProps = { text, iconProps: { iconName }, disabled }
        if (typeof hrefOrOnClick === 'string') buttonProps.href = hrefOrOnClick
        else buttonProps.onClick = hrefOrOnClick
        return (
          <div key={idx} hidden={hidden}>
            <ActionButton {...buttonProps} className={styles.btn} />
          </div>
        )
      })}
    </div>
  )
}
