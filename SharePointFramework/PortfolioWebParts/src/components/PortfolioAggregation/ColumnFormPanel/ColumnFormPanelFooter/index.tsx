import strings from 'PortfolioWebPartsStrings'
import { useConfirmationDialog } from 'pzl-react-reusable-components/lib/ConfirmDialog'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../../context'
import { TOGGLE_COLUMN_FORM_PANEL } from '../../reducer'
import styles from './ColumnFormPanelFooter.module.scss'
import { ColumnFormPanelFooterProps } from './types'
import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

export const ColumnFormPanelFooter: FC<ColumnFormPanelFooterProps> = (props) => {
  const fluentProviderId = useId('fp-column-form-panel-footer')
  const context = usePortfolioAggregationContext()
  const [confirmDeleteDialog, getConfirmDeleteResponse] = useConfirmationDialog()
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.root}>
        <Button onClick={props.onSave} disabled={props.isSaveDisabled} appearance='primary'>
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
            onClick={async () => {
              const response = await getConfirmDeleteResponse({
                title: strings.ConfirmDeleteProjectContentColumnTitle,
                subText: strings.ConfirmDeleteProjectContentColumnSubText,
                responses: [
                  [strings.ConfirmDeleteResponseConfirm, true, true],
                  [strings.ConfirmDeleteResponseAbort, false, false]
                ]
              })
              if (response) props.onDeleteColumn()
            }}
            disabled={props.isDeleteDisabled}
          >
            {strings.DeleteButtonLabel}
          </Button>
        )}
        {confirmDeleteDialog}
      </FluentProvider>
    </IdPrefixProvider>
  )
}
