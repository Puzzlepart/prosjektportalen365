import React, { FC, useContext } from 'react'
import styles from './ColumnFormPanelFooter.module.scss'
import { PrimaryButton, DefaultButton } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { TOGGLE_COLUMN_FORM_PANEL } from '../../reducer'
import { PortfolioAggregationContext } from '../../context'
import { ColumnFormPanelFooterProps } from './types'
import { useConfirmationDialog } from 'pzl-react-reusable-components/lib/ConfirmDialog'

export const ColumnFormPanelFooter: FC<ColumnFormPanelFooterProps> = (props) => {
  const context = useContext(PortfolioAggregationContext)
  const [confirmDeleteDialog, getConfirmDeleteResponse] = useConfirmationDialog()
  return (
    <div className={styles.root}>
      <PrimaryButton
        text={strings.SaveButtonLabel}
        onClick={props.onSave}
        disabled={props.isSaveDisabled}
      />
      <DefaultButton
        text={strings.CloseButtonLabel}
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
