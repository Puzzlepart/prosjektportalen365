import { DefaultButton, Dialog, DialogFooter, PrimaryButton, DialogType, SelectionMode } from 'office-ui-fabric-react'
import React, { FunctionComponent } from 'react'
import { IAddProjectProps } from './types'
import { ProjectTable } from '../ProjectTable'
import { fields } from '../index'
import { useStore } from '../store';
import styles from '../programAdministration.module.scss'


export const AddProjectDialog: FunctionComponent<IAddProjectProps> = () => {
    const projects = useStore(state => state.childProjects)
    const toggleProjectDialog = useStore(state => state.toggleProjectDialog)

    return (
        <>
            <Dialog hidden={false} onDismiss={() => toggleProjectDialog()} maxWidth={"1000px"} dialogContentProps={dialogContentProps} >
                <div className={styles.dialogContent}>Sele
                    <ProjectTable fields={fields} projects={projects} onSelect={(selectedItem) => console.log(selectedItem)} width={"50em"} selectionMode={SelectionMode.single} />
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