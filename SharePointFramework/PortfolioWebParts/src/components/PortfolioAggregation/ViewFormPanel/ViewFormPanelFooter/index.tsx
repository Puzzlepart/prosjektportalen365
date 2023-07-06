import { DefaultButton, PrimaryButton } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import styles from './ViewFormPanelFooter.module.scss'
import { IViewFormPanelFooterProps } from './types'
import { PortfolioAggregationContext } from 'components/PortfolioAggregation/context'
import { TOGGLE_VIEW_FORM_PANEL } from 'components/PortfolioOverview/reducer'

export const ViewFormPanelFooter: FC<IViewFormPanelFooterProps> = ({ onSave }) => {
  const context = useContext(PortfolioAggregationContext)
  return (
    <div className={styles.root}>
      <PrimaryButton text={strings.SaveButtonLabel} onClick={onSave} disabled={!onSave} />
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
