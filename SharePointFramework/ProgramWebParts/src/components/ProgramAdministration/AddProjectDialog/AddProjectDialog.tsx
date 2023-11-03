
import { Button, Dialog, DialogActions, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components'
import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import React, { FC, useContext } from 'react'
import { ProjectList } from '../ProjectList'
import { ProgramAdministrationContext } from '../context'
import { SET_SELECTED_TO_ADD, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import styles from './AddProjectDialog.module.scss'
import { useAddProjectDialog } from './useAddProjectDialog'

export const AddProjectDialog: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const { availableProjects, onAddChildProjects } = useAddProjectDialog()

  return (
    <Dialog
      open={context.state.addProjectDialog?.open}
      onOpenChange={(_, data) => {
        if (!data.open) {
          context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())
        }
      }}>
      <DialogSurface className={styles.addProjectDialog}>
          <DialogTitle>
            <h2>{strings.ProgramAdministrationAddChildsButtonText}</h2>
          </DialogTitle>
          <DialogContent className={styles.content}>
            <ProjectList
              items={availableProjects}
              onSelectionChange={(_, data) => {
                context.dispatch(SET_SELECTED_TO_ADD(Array.from(data.selectedItems)))
              }}
              searchPlaceholder={strings.AddProjectDialogSearchBoxPlaceholder}
            />
          </DialogContent>
          <DialogActions className={styles.actions}>
            <Button
              appearance='primary'
              disabled={_.isEmpty(context.state.addProjectDialog?.selectedProjects)}
              onClick={onAddChildProjects}>
              {strings.Add}
            </Button>
            <Button appearance='secondary' onClick={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}>
              {strings.Cancel}
            </Button>
          </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
