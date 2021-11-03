import { DefaultButton, Dialog, DialogFooter, PrimaryButton, DialogType, SelectionMode, Spinner, SpinnerSize, ShimmeredDetailsList } from 'office-ui-fabric-react'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { IAddProjectProps } from './types'
import { ProjectTable } from '../ProjectTable'
import { fields } from '../index'
import { useStore } from '../store';
import { fetchAvailableProjects } from '../helpers'
import { shimmeredColumns } from '../types'
import styles from '../programAdministration.module.scss'


export const AddProjectDialog: FunctionComponent<IAddProjectProps> = ({ sp }) => {
    const projects = useStore(state => state.availableProjects)
    const setAvailableProjects = useStore(state => state.setAvailableProjects)
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetch = async () => {
            const data: any = await fetchAvailableProjects(sp)
            setAvailableProjects(data[0])
            setIsLoading(false)
        }
        setIsLoading(true)
        fetch()
    }, [])

    if (isLoading) {
        return (
            <>
            </>
        )
    }

    return (
        <>
            <Dialog hidden={false} onDismiss={() => toggleProjectDialog()} maxWidth={"1000px"} dialogContentProps={dialogContentProps} >
                <div className={styles.dialogContent}>
                    {isLoading ?
                        <ShimmeredDetailsList items={[]} shimmerLines={15} columns={shimmeredColumns} enableShimmer />
                        :
                        <ProjectTable fields={fields} projects={projects} width={"50em"} onSelect={(selectedItem) => console.log(selectedItem)} selectionMode={SelectionMode.multiple} />}
                </div>
                <DialogFooter>
                    <PrimaryButton text="Legg til" onClick={() => toggleProjectDialog()} />
                    <DefaultButton text="Avbryt" onClick={() => toggleProjectDialog()} />
                </DialogFooter>
            </Dialog>
        </>
    )
}

const dialogContentProps = {
    type: DialogType.largeHeader,
    title: 'Legg til prosjekt'
};