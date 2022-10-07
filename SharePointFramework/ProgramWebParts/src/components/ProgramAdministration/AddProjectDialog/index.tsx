import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { Dialog, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { SelectionMode } from 'office-ui-fabric-react/lib/Selection'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import * as strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useContext, useEffect, useRef } from 'react'
import { IChildProject } from 'types/IChildProject'
import { ProgramAdministrationContext } from '../context'
import { addChildProject, fetchAvailableProjects } from '../data'
import { fields } from '../index'
import styles from '../ProgramAdministration.module.scss'
import { ProjectTable } from '../ProjectTable'
import { CHILD_PROJECTS_ADDED, DATA_LOADED, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import { shimmeredColumns } from '../types'

export const AddProjectDialog: FunctionComponent = () => {
  const context = useContext(ProgramAdministrationContext)
  const selectedProjects = useRef<IChildProject[]>([])

  useEffect(() => {
    fetchAvailableProjects(context.props.sp, context.props.context).then(
      (availableProjects) =>
        context.dispatch(DATA_LOADED({ data: { availableProjects }, scope: AddProjectDialog.name }))
    )
  }, [])

  return (
    <>
      <Dialog
        hidden={false}
        onDismiss={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
        minWidth='50em'
        maxWidth='1000px'
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: strings.ProgramAddChildsButtonText
        }
        }>
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
              items={context.state.availableProjects}
              selectionMode={SelectionMode.multiple}
              onSelectionChanged={(items: IChildProject[]) => {
                selectedProjects.current = items
              }}
            />
          )}
        </div>
        <DialogFooter>
          <PrimaryButton
            text={strings.Add}
            onClick={async () => {
              await addChildProject(context.props.sp, selectedProjects.current)
              context.dispatch(CHILD_PROJECTS_ADDED({ childProjects: selectedProjects.current }))
            }}
          />
          <DefaultButton text={strings.Cancel} onClick={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())} />
        </DialogFooter>
      </Dialog>
    </>
  )
}