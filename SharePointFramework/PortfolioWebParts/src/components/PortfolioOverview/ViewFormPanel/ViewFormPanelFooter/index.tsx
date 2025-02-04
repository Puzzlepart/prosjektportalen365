import { Button, FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { useId } from '@fluentui/react-hooks'
import strings from 'PortfolioWebPartsStrings'
import { usePortfolioOverviewContext } from '../../context'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { SET_VIEW_FORM_PANEL } from '../../reducer'
import styles from './ViewFormPanelFooter.module.scss'
import { IViewFormPanelFooterProps } from './types'

export const ViewFormPanelFooter: FC<IViewFormPanelFooterProps> = ({ onSave }) => {
  const fluentProviderId = useId('fp-view-form-panel-footer')
  const context = usePortfolioOverviewContext()
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
