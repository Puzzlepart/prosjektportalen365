import React, { FC, useContext } from 'react'
import styles from './ColumnFormPanelFooter.module.scss'
import strings from 'PortfolioWebPartsStrings'
import { TOGGLE_COLUMN_FORM_PANEL } from '../../reducer'
import { PortfolioOverviewContext } from '../../context'
import { IColumnFormPanelFooterProps } from './types'
import { useConfirmationDialog } from 'pzl-react-reusable-components/lib/ConfirmDialog'
import { Button, FluentProvider, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

export const ColumnFormPanelFooter: FC<IColumnFormPanelFooterProps> = ({
  onSave,
  onDeleteColumn,
  isSaveDisabled,
  isEditing
}) => {
  const fluentProviderId = useId('fluent-provider')
  const context = useContext(PortfolioOverviewContext)
  const [confirmDeleteDialog, getConfirmDeleteResponse] = useConfirmationDialog()
  return (
    <FluentProvider id={fluentProviderId} theme={customLightTheme} className={styles.root}>
      <Button onClick={onSave} disabled={isSaveDisabled} appearance='primary'>
        {strings.SaveButtonLabel}
      </Button>
      <Button
        onClick={() => {
          context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
        }}
      >
        {strings.CancelButtonLabel}
      </Button>
      {isEditing && (
        <Button
          onClick={async () => {
            const response = await getConfirmDeleteResponse({
              title: strings.ConfirmDeleteProjectColumnTitle,
              subText: strings.ConfirmDeleteProjectColumnSubText,
              responses: [
                [strings.ConfirmDeleteResponseConfirm, true, true],
                [strings.ConfirmDeleteResponseAbort, false, false]
              ]
            })
            if (response) onDeleteColumn()
          }}
        >
          {strings.DeleteButtonLabel}
        </Button>
      )}
      {confirmDeleteDialog}
    </FluentProvider>
  )
}
