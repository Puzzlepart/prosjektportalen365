import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { Dialog, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { SelectionMode } from 'office-ui-fabric-react/lib/Selection'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import * as strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import { addChildProject } from '../data'
import { fields } from '../index'
import styles from '../ProgramAdministration.module.scss'
import { ProjectTable } from '../ProjectTable'
import { CHILD_PROJECTS_ADDED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import { shimmeredColumns } from '../types'
import { useAddProjectDialog } from './useAddProjectDialog'

export const AddProjectDialog: FunctionComponent = () => {
  const context = useContext(ProgramAdministrationContext)
  const { selectedProjects, availableProjects } = useAddProjectDialog()

  return (
    <>
      <Dialog
        hidden={false}
        onDismiss={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
        minWidth='60em'
        maxWidth='1000px'
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: strings.ProgramAddChildsButtonText
        }}>
        <div className={styles.dialogContent}>
          {context.state.loading.AddProjectDialog ? (
            <ShimmeredDetailsList
              items={[]}
              shimmerLines={15}
              columns={shimmeredColumns}
              enableShimmer
            />
          ) : (
            <ProjectTable
              fields={fields}
              items={availableProjects}
              selectionMode={SelectionMode.multiple}
              onSelectionChanged={(items) => {
                selectedProjects.current = items
              }}
            />
          )}
        </div>
        <DialogFooter>
          <PrimaryButton
            text={strings.Add}
            onClick={async () => {
              await addChildProject(context.props.dataAdapter, selectedProjects.current)
              context.dispatch(CHILD_PROJECTS_ADDED({ childProjects: selectedProjects.current }))
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
