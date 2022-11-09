import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import _ from 'lodash'
import * as strings from 'ProgramWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import { addChildProject } from '../data'
import { columns } from '../index'
import { CHILD_PROJECTS_ADDED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import styles from './AddProjectDialog.module.scss'
import { useAddProjectDialog } from './useAddProjectDialog'

export const AddProjectDialog: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const { selectedProjects, availableProjects } = useAddProjectDialog()

  return (
    <>
      <Dialog
        hidden={false}
        modalProps={{
          containerClassName: styles.root,
          scrollableContentClassName: styles.scrollableContent
        }}
        onDismiss={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
        minWidth='60em'
        maxWidth='1000px'
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: strings.ProgramAdministrationAddChildsButtonText
        }}>
        <div className={styles.dialogContent}>
          <ShimmeredDetailsList
            items={availableProjects}
            shimmerLines={15}
            columns={columns({ renderAsLink: false })}
            selectionMode={SelectionMode.multiple}
            enableShimmer={context.state.loading.AddProjectDialog}
          />
        </div>
        <DialogFooter>
          <PrimaryButton
            text={strings.Add}
            disabled={_.isEmpty(selectedProjects)}
            onClick={async () => {
              await addChildProject(context.props.dataAdapter, selectedProjects)
              context.dispatch(CHILD_PROJECTS_ADDED({ childProjects: selectedProjects }))
            }}
          />
          <DefaultButton
            text={strings.Cancel}
            onClick={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
          />
        </DialogFooter>
      </Dialog>
    </>
  )
}
