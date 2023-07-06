import { DefaultButton, PrimaryButton } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { TOGGLE_VIEW_FORM_PANEL } from '../../reducer'
import { usePortfolioAggregationContext } from '../../usePortfolioAggregationContext'
import styles from './ViewFormPanelFooter.module.scss'
import { IViewFormPanelFooterProps } from './types'

export const ViewFormPanelFooter: FC<IViewFormPanelFooterProps> = ({ onSave }) => {
  const context = usePortfolioAggregationContext()
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
