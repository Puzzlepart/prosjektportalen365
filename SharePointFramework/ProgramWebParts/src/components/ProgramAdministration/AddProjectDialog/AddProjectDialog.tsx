
import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import React, { FC, ReactElement, useContext } from 'react'
import { ProjectList } from '../ProjectList'
import { ProgramAdministrationContext } from '../context'
import { ADD_CHILD_PROJECTS, SET_SELECTED_TO_ADD, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import styles from './AddProjectDialog.module.scss'
import { Button, Dialog, DialogActions, DialogContent, DialogSurface, DialogTitle, DialogTrigger } from '@fluentui/react-components'
import { useAddProjectDialog } from './useAddProjectDialog'

export const AddProjectDialog: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const { availableProjects } = useAddProjectDialog()

  return (
    <Dialog
      open={true}
      onOpenChange={(_, data) => {
        if (!data.open) {
          context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())
        }
      }}>
      <DialogSurface>
        <DialogTitle>
          <h2>{strings.ProgramAdministrationAddChildsButtonText}</h2>
        </DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <ProjectList
            items={availableProjects}
            onSelectionChange={(_, data) => {
              context.dispatch(SET_SELECTED_TO_ADD(data.selectedItems))
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            appearance='primary'
            disabled={_.isEmpty(context.state.selectedProjectsToAdd)}
            onClick={async () => {
              await context.props.dataAdapter.addChildProjects(context.state.selectedProjectsToAdd)
              context.dispatch(ADD_CHILD_PROJECTS())
            }}>
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
