import { ActionButton, DefaultButton, IButtonProps } from '@fluentui/react/lib/Button'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import { useProjectInformationContext } from '../context'
import styles from './Actions.module.scss'
import { useActions } from './useActions'

export const Actions: FC = () => {
  const context = useProjectInformationContext()
  const actions = useActions()
  if (isEmpty(actions)) return null
  return (
    <div className={styles.root}>
      {actions.map(([text, hrefOrOnClick, iconName, disabled, hidden], idx) => {
        const buttonProps: IButtonProps = { text, iconProps: { iconName }, disabled }
        if (typeof hrefOrOnClick === 'string') buttonProps.href = hrefOrOnClick
        else buttonProps.onClick = hrefOrOnClick
        return (
          <div key={idx} hidden={hidden}>
            {context.props.useFramelessButtons ? (
              <ActionButton {...buttonProps} className={styles.btn} />
            ) : (
              <DefaultButton {...buttonProps} className={styles.btn} />
            )}
          </div>
        )
      })}
    </div>
  )
}
