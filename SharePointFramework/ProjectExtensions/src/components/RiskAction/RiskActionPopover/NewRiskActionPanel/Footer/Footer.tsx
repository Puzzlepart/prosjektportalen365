import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IFooterProps } from './types'
import styles from './Footer.module.scss'
import { customLightTheme } from 'pp365-shared-library'

export const Footer: FC<IFooterProps> = (props) => {
  const fluentProviderId = useId(Footer.displayName)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider
        className={styles.footer}
        theme={customLightTheme}
        style={{ background: 'transparent' }}
      >
        <Button appearance='primary' onClick={props.onSave} disabled={props.isSaveDisabled}>
          Lagre
        </Button>
        <Button appearance='secondary' onClick={props.closePanel}>
          Avbryt
        </Button>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

Footer.displayName = 'NewRiskActionPanelFooter'
