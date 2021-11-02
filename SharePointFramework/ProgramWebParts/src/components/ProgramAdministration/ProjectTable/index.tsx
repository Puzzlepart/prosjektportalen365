import React, { FunctionComponent } from "react"
import { useStore } from '../store';
import { ListView, IViewField, SelectionMode, GroupOrder, IGrouping } from "@pnp/spfx-controls-react/lib/ListView";
import { IProjectTableProps } from './types'

export const ProjectTable: FunctionComponent<IProjectTableProps> = ({ fields, projects, onSelect, selectionMode, width }) => {

    return (
        <div style={width ? { width } : {}}>
            <ListView items={projects} viewFields={fields} selectionMode={selectionMode} showFilter filterPlaceHolder="Søk i prosjekter" selection={(item) => onSelect(item)} />
        </div>

    )
}