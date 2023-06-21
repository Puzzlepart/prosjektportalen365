import { Icon, TooltipHost } from '@fluentui/react'
import * as strings from 'ProgramWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import styles from './TooltipHeader.module.scss'

export const TooltipHeader: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  return (
    <div className={styles.root}>
      <div className={styles.title}>
        <TooltipHost
          content={
            <div>
              <p>{strings.ProgramAdministrationInfoMessage}</p>
            </div>
          }
        >
          <span>{context.props.title}</span>
          <Icon iconName='Info' className={styles.icon} />
        </TooltipHost>
      </div>
    </div>
  )
}
