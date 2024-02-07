import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../../context'
import { SET_VIEW_FORM_PANEL } from '../../reducer'
import styles from './ViewFormPanelFooter.module.scss'
import { IViewFormPanelFooterProps } from './types'
import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

export const ViewFormPanelFooter: FC<IViewFormPanelFooterProps> = ({ onSave }) => {
  const fluentProviderId = useId('fp-view-form-panel-footer')
  const context = usePortfolioAggregationContext()
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.root}>
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
    </IdPrefixProvider>
  )
}
