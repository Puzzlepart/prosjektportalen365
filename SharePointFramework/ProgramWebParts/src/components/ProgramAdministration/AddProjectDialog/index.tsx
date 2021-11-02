import { DefaultButton, Dialog, DialogFooter, PrimaryButton, DialogType } from 'office-ui-fabric-react'
import React, { FunctionComponent } from 'react'
import { IAddProjectProps } from './types'
import { ProjectTable } from '../ProjectTable'
import { fields } from '../index'
import { useStore } from '../store';
import styles from '../programAdministration.module.scss'


export const AddProjectDialog: FunctionComponent<IAddProjectProps> = () => {
    const projects = useStore(state => state.projects)
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)

    return (
        <>
            <Dialog hidden={false} onDismiss={() => toggleProjectDialog()} maxWidth={"1000px"} dialogContentProps={dialogContentProps}>
                <ProjectTable fields={fields} projects={projects} onSelect={(item) => console.log(item)} width={"50em"} />
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