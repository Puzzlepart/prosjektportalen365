import { Button, FluentProvider, useId, webLightTheme } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IFooterProps } from './types'
import styles from './Footer.module.scss'

export const Footer: FC<IFooterProps> = (props) => {
  const fluentProviderId = useId(Footer.displayName)
  return (
    <FluentProvider
      id={fluentProviderId}
      className={styles.footer}
      theme={webLightTheme}
      style={{ background: 'transparent' }}
    >
      <Button appearance='primary' onClick={props.onSave} disabled={props.isSaveDisabled}>
        Lagre
      </Button>
      <Button appearance='secondary' onClick={props.closePanel}>
        Avbryt
      </Button>
    </FluentProvider>
  )
}

Footer.displayName = 'RiskActionFooter'