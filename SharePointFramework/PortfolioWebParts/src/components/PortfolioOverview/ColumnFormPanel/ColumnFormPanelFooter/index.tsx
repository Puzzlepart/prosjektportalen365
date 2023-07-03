import React, { FC, useContext } from 'react'
import styles from './ColumnFormPanelFooter.module.scss'
import { PrimaryButton, DefaultButton } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { TOGGLE_COLUMN_FORM_PANEL } from 'components/PortfolioOverview/reducer'
import { PortfolioOverviewContext } from '../../context'
import { IColumnFormPanelFooterProps } from './types'
import { useConfirmationDialog } from 'pzl-react-reusable-components/lib/ConfirmDialog'

export const ColumnFormPanelFooter: FC<IColumnFormPanelFooterProps> = ({
  onSave,
  onDeleteColumn,
  isSaveDisabled,
  isEditing
}) => {
  const context = useContext(PortfolioOverviewContext)
  const [confirmDeleteDialog, getConfirmDeleteResponse] = useConfirmationDialog()
  return (
    <div className={styles.root}>
      <PrimaryButton text={strings.SaveButtonLabel} onClick={onSave} disabled={isSaveDisabled} />
      <DefaultButton
        text={strings.CloseButtonLabel}
        style={{ marginLeft: 4 }}
        onClick={() => {
          context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
        }}
      />
      {isEditing && (
        <DefaultButton
          text={strings.DeleteButtonLabel}
          style={{ marginLeft: 4 }}
          onClick={() => {
            const response = getConfirmDeleteResponse({
              title: strings.ConfirmDeleteTitle,
              subText: strings.ConfirmDeleteSubText,
              responses: [
                [strings.ConfirmDeleteResponseConfirm, true, true],
                [strings.ConfirmDeleteResponseAbort, false, false]
              ]
            })
            if (response) onDeleteColumn()
          }}
        />
      )}
      {confirmDeleteDialog}
    </div>
  )
}
