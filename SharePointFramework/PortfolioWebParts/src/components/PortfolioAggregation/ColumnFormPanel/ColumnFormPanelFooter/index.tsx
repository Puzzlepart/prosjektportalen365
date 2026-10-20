import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../../context'
import { TOGGLE_COLUMN_FORM_PANEL } from '../../reducer'
import styles from './ColumnFormPanelFooter.module.scss'
import { ColumnFormPanelFooterProps } from './types'
import {
  Button,
  FluentProvider,
  IdPrefixProvider,
  useId,
  useRestoreFocusTarget
} from '@fluentui/react-components'
import { customLightTheme, useConfirmationDialog } from 'pp365-shared-library'

export const ColumnFormPanelFooter: FC<ColumnFormPanelFooterProps> = (props) => {
  const fluentProviderId = useId('fp-column-form-panel-footer')
  const context = usePortfolioAggregationContext()
  const [confirmDeleteDialog, getConfirmDeleteResponse] = useConfirmationDialog()
  // The confirmation opens from state: delete is where the focus goes back as it closes. Else
  // Fluent gives it to the latest restore target, the column header behind the panel (WCAG 2.4.3).
  const restoreFocusTarget = useRestoreFocusTarget()
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.root}>
        <Button
          onClick={props.onSave}
          // Focusable while it cannot save, with what it needs: a disabled button is skipped by
          // the keyboard (WCAG 2.1.1, 3.3.2).
          disabledFocusable={props.isSaveDisabled}
          title={props.isSaveDisabled ? strings.ColumnFormSaveDisabledReason : undefined}
          appearance='primary'
        >
          {strings.SaveButtonLabel}
        </Button>
        <Button
          onClick={() => {
            context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
          }}
        >
          {strings.CancelButtonLabel}
        </Button>
        {props.isEditing && (
          <Button
            {...restoreFocusTarget}
            onClick={async () => {
              const response = await getConfirmDeleteResponse({
                title: strings.ConfirmDeleteProjectContentColumnTitle,
                subText: strings.ConfirmDeleteProjectContentColumnSubText,
                responses: [
                  [strings.ConfirmDeleteResponseConfirm, true, true],
                  [strings.ConfirmDeleteResponseAbort, false, false]
                ]
              })
              if (response) void props.onDeleteColumn()
            }}
            disabledFocusable={props.isDeleteDisabled}
            title={props.isDeleteDisabled ? strings.TitleColumnDeleteDisabledReason : undefined}
          >
            {strings.DeleteButtonLabel}
          </Button>
        )}
        {confirmDeleteDialog}
      </FluentProvider>
    </IdPrefixProvider>
  )
}
