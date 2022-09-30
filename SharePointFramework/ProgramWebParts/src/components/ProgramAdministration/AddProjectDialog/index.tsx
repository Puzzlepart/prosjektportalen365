import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import styles from '../programAdministration.module.scss'
import * as strings from 'ProgramWebPartsStrings'
import { IAddProjectProps } from './types'
import { ProjectTable } from '../ProjectTable'
import { fields } from '../index'
import { useStore } from '../store'
import { addChildProject, fetchAvailableProjects } from '../helpers'
import { ChildProject } from 'models/ChildProject'
import { Dialog, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { SelectionMode } from 'office-ui-fabric-react/lib/Selection'
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList'
import { shimmeredColumns } from '../types'

export const AddProjectDialog: FunctionComponent<IAddProjectProps> = ({ sp, context }) => {
  const projects = useStore((state) => state.availableProjects)
  const setAvailableProjects = useStore((state) => state.setAvailableProjects)
  const setChildProjects = useStore((state) => state.setChildProjects)
  const childProjects = useStore((state) => state.childProjects)
  const toggleProjectDialog = useStore((state) => state.toggleProjectDialog)
  const [isLoading, setIsLoading] = useState(false)
  const selectedItem = useRef<ChildProject[]>([])

  useEffect((): void => {
    const fetch = async (): Promise<void> => {
      const data = await fetchAvailableProjects(sp, context)
      setAvailableProjects(data)
      setIsLoading(false)
    }
    setIsLoading(true)
    fetch()
  }, [])

  return (
    <>
      <Dialog
        hidden={false}
        onDismiss={(): void => toggleProjectDialog()}
        minWidth='50em'
        maxWidth='1000px'
        dialogContentProps={dialogContentProps}>
        <div className={styles.dialogContent}>
          {isLoading ? 
            (
              <ShimmeredDetailsList 
                items={[]} 
                shimmerLines={15} 
                columns={shimmeredColumns} 
                enableShimmer 
              />
            ) : (
              <ProjectTable
                fields={fields}
                items={projects}
                selectionMode={SelectionMode.multiple}
                onSelectionChanged={(items: ChildProject[]): void => { selectedItem.current = items; }}
              />
            )
          }
        </div>
        <DialogFooter>
          <PrimaryButton
            text={strings.Add}
            onClick={(): void => {
              addChildProject(sp, selectedItem.current)
              setChildProjects([...childProjects, ...selectedItem.current])
              toggleProjectDialog()
            }}
          />
          <DefaultButton text={strings.Cancel} onClick={(): void => toggleProjectDialog()} />
        </DialogFooter>
      </Dialog>
    </>
  )
}

const dialogContentProps = {
  type: DialogType.largeHeader,
  title: strings.ProgramAddProject
}
