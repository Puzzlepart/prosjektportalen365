import { Button } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IFooterProps } from './types'
import styles from './Footer.module.scss'
import strings from 'ProjectExtensionsStrings'

/** The panel's save and cancel buttons, in the footer `BasePanel` renders under its provider. */
export const Footer: FC<IFooterProps> = (props) => (
  <div className={styles.footer}>
    <Button appearance='primary' onClick={props.onSave} disabled={props.isSaveDisabled}>
      {strings.SaveButtonLabel}
    </Button>
    <Button appearance='secondary' onClick={props.closePanel}>
      {strings.CancelButtonLabel}
    </Button>
  </div>
)

Footer.displayName = 'NewRiskActionPanelFooter'
