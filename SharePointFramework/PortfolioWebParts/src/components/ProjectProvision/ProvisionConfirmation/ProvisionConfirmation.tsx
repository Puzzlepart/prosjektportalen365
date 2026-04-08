import React, { FC } from 'react'
import { Button } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import styles from './ProvisionConfirmation.module.scss'

export interface IProvisionConfirmationProps {
  onNewRequest: () => void
}

export const ProvisionConfirmation: FC<IProvisionConfirmationProps> = ({ onNewRequest }) => {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <span className={styles.successIcon}>{getFluentIcon('CheckmarkCircle')}</span>
      </div>
      <h2 className={styles.title}>{strings.Provision.ConfirmationTitle}</h2>
      <p className={styles.message}>{strings.Provision.ConfirmationMessage}</p>
      <div className={styles.actions}>
        <Button appearance='primary' icon={getFluentIcon('ArrowLeft')} onClick={onNewRequest}>
          {strings.Provision.NewRequestButton}
        </Button>
      </div>
    </div>
  )
}
