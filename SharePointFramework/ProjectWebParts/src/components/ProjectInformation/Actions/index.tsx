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
            const label = <span className={styles.label}>{text}</span>
            const buttonProps = {
              className: styles.button,
              appearance: 'subtle' as const,
              icon: <Icon />,
              iconPosition: 'before' as const,
              disabled,
              style: { display: hidden && 'none' }
            }
            // An action that goes to a page is a link (WCAG 4.1.2), one that does something here
            // a button.
            return typeof onClickOrHref === 'string' ? (
              <Button key={idx} as='a' href={onClickOrHref} {...buttonProps}>
                {label}
              </Button>
            ) : (
              <Button key={idx} onClick={() => onClickOrHref()} {...buttonProps}>
                {label}
              </Button>
            )
          })}
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
