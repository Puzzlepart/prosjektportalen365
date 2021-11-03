import React, { FunctionComponent } from "react"
import { useStore } from '../store';
import { ListView } from "@pnp/spfx-controls-react/lib/ListView";
import { IProjectTableProps } from './types'

export const ProjectTable: FunctionComponent<IProjectTableProps> = ({ fields, projects, onSelect, selectionMode, width }) => {

    if (projects?.length > 0) {
        return (
            <div style={width ? { width, height: "600px", overflow: "scroll" } : {}}>
                <ListView items={projects} viewFields={fields} selectionMode={selectionMode} showFilter filterPlaceHolder="Søk i prosjekter" selection={(item) => onSelect(item)} />
            </div>
        )
    }

    return (
        <div style={width ? { width, height: "600px", overflowY: "scroll" } : {}}>
            <ListView items={projects} viewFields={fields} selectionMode={selectionMode} showFilter filterPlaceHolder="Søk i prosjekter" />
        </div>

    )
}