import strings from 'PortfolioWebPartsStrings'
import { useConfirmationDialog } from 'pzl-react-reusable-components/lib/ConfirmDialog'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../../context'
import { TOGGLE_COLUMN_FORM_PANEL } from '../../reducer'
import styles from './ColumnFormPanelFooter.module.scss'
import { ColumnFormPanelFooterProps } from './types'
import { Button, FluentProvider, useId, webLightTheme } from '@fluentui/react-components'

export const ColumnFormPanelFooter: FC<ColumnFormPanelFooterProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')
  const context = usePortfolioAggregationContext()
  const [confirmDeleteDialog, getConfirmDeleteResponse] = useConfirmationDialog()
  return (
    <FluentProvider id={fluentProviderId} theme={webLightTheme} className={styles.root}>
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
  )
}
