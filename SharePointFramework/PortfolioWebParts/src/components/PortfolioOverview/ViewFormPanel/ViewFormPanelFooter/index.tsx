import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
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
        <Button
          onClick={onSave}
          // Focusable while it cannot save, with what it needs: a disabled button is skipped by
          // the keyboard (WCAG 2.1.1, 3.3.2).
          disabledFocusable={!onSave}
          title={onSave ? undefined : strings.ViewFormSaveDisabledReason}
          appearance='primary'
        >
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
