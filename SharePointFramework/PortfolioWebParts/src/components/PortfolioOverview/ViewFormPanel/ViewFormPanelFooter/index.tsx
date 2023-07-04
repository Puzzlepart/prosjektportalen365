import { DefaultButton, PrimaryButton } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../../context'
import { TOGGLE_VIEW_FORM_PANEL } from '../../reducer'
import styles from './ViewFormPanelFooter.module.scss'
import { IViewFormPanelFooterProps } from './types'

export const ViewFormPanelFooter: FC<IViewFormPanelFooterProps> = () => {
  const context = useContext(PortfolioOverviewContext)
  return (
    <div className={styles.root}>
      <PrimaryButton text={strings.SaveButtonLabel}/>
      <DefaultButton
        text={strings.CloseButtonLabel}
        style={{ marginLeft: 4 }}
        onClick={() => {
          context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
        }}
      />
    </div>
  )
}
