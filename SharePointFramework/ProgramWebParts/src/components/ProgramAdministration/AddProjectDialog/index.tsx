import { DefaultButton, Dialog, DialogFooter, PrimaryButton, DialogType, SelectionMode, Spinner, SpinnerSize, ShimmeredDetailsList } from 'office-ui-fabric-react'
import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import { IAddProjectProps } from './types'
import { ProjectTable } from '../ProjectTable'
import { fields } from '../index'
import { useStore } from '../store';
import { addChildProject, fetchAvailableProjects } from '../helpers'
import { shimmeredColumns } from '../types'
import styles from '../programAdministration.module.scss'
import * as strings from 'ProgramWebPartsStrings'


export const AddProjectDialog: FunctionComponent<IAddProjectProps> = ({ sp }) => {
    const projects = useStore(state => state.availableProjects)
    const setAvailableProjects = useStore(state => state.setAvailableProjects)
    const setChildProjects = useStore(state => state.setChildProjects)
    const childProjects = useStore(state => state.childProjects)
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)
    const [isLoading, setIsLoading] = useState(false)
    const selectedItem = useRef([])

    useEffect(() => {
        const fetch = async () => {
            const data: any = await fetchAvailableProjects(sp)
            setAvailableProjects(data)
            setIsLoading(false)
        }
        setIsLoading(true)
        fetch()
    }, [])

    return (
        <>
            <Dialog hidden={false} onDismiss={() => toggleProjectDialog()} maxWidth={"1000px"} dialogContentProps={dialogContentProps} >
                <div className={styles.dialogContent}>
                    {isLoading ?
                        <ShimmeredDetailsList items={[]} shimmerLines={15} columns={shimmeredColumns} enableShimmer />
                        :
                        <ProjectTable fields={fields} projects={projects} width={"50em"} onSelect={(item) => selectedItem.current = item} selectionMode={SelectionMode.multiple} />}
                </div>
                <DialogFooter>
                    <PrimaryButton text={strings.Add} onClick={() => {
                        addChildProject(sp, selectedItem.current)
                        setChildProjects([...childProjects, ...selectedItem.current])
                        toggleProjectDialog()
                    }
                    } />
                    <DefaultButton text={strings.Cancel} onClick={() => toggleProjectDialog()} />
                </DialogFooter>
            </Dialog>
        </>
    )
}

const dialogContentProps = {
    type: DialogType.largeHeader,
    title: strings.ProgramAddProject
};