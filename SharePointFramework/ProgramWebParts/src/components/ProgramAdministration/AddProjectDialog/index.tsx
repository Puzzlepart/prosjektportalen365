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
import { fields } from '../index'
import styles from './AddProjectDialog.module.scss'
import { ProjectTable } from '../ProjectTable'
import { CHILD_PROJECTS_ADDED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import { useAddProjectDialog } from './useAddProjectDialog'

export const AddProjectDialog: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const { selectedProjects, setSelectedProjects, availableProjects } = useAddProjectDialog()

  return (
    <>
      <Dialog
        hidden={false}
        modalProps={{ containerClassName: styles.root }}
        onDismiss={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
        minWidth='60em'
        maxWidth='1000px'
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: strings.ProgramAddChildsButtonText,
          className: styles.dialogContent
        }}>
        <div>
          {context.state.loading.AddProjectDialog ? (
            <ShimmeredDetailsList
              items={[]}
              shimmerLines={15}
              columns={[
                {
                  key: 'Title',
                  name: 'Tittel',
                  isResizable: true,
                  maxWidth: 250,
                  minWidth: 100
                }
              ]}
              enableShimmer
            />
          ) : (
            <ProjectTable
              fields={fields(false)}
              items={availableProjects}
              selectionMode={SelectionMode.multiple}
              onSelectionChanged={(selected) => {
                setSelectedProjects(selected)
              }}
            />
          )}
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
