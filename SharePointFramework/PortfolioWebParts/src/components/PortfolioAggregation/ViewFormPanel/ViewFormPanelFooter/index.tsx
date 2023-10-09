import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../../context'
import { SET_VIEW_FORM_PANEL } from '../../reducer'
import styles from './ViewFormPanelFooter.module.scss'
import { IViewFormPanelFooterProps } from './types'
import { Button, FluentProvider, useId, webLightTheme } from '@fluentui/react-components'

export const ViewFormPanelFooter: FC<IViewFormPanelFooterProps> = ({ onSave }) => {
  const fluentProviderId = useId('fluent-provider')
  const context = usePortfolioAggregationContext()
  return (
    <FluentProvider id={fluentProviderId} theme={webLightTheme} className={styles.root}>
      <Button onClick={onSave} disabled={!onSave} appearance='primary'>
        {strings.SaveButtonLabel}
      </Button>
      <Button
        onClick={() => {
          context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: false }))
        }}
      >
        {strings.CancelButtonLabel}
      </Button>
    </FluentProvider>
  )
}
