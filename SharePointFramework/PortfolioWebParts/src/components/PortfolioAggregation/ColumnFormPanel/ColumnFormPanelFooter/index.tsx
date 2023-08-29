import { DefaultButton, PrimaryButton } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { useConfirmationDialog } from 'pzl-react-reusable-components/lib/ConfirmDialog'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../../context'
import { TOGGLE_COLUMN_FORM_PANEL } from '../../reducer'
import styles from './ColumnFormPanelFooter.module.scss'
import { ColumnFormPanelFooterProps } from './types'

export const ColumnFormPanelFooter: FC<ColumnFormPanelFooterProps> = (props) => {
  const context = usePortfolioAggregationContext()
  const [confirmDeleteDialog, getConfirmDeleteResponse] = useConfirmationDialog()
  return (
    <div className={styles.root}>
      <PrimaryButton
        text={strings.SaveButtonLabel}
        onClick={props.onSave}
        disabled={props.isSaveDisabled}
      />
      <DefaultButton
        text={strings.CancelButtonLabel}
        style={{ marginLeft: 4 }}
        onClick={() => {
          context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
        }}
      />
      {props.isEditing && (
        <DefaultButton
          text={strings.DeleteButtonLabel}
          style={{ marginLeft: 4 }}
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
        />
      )}
      {confirmDeleteDialog}
    </div>
  )
}
