import React, { FunctionComponent, useEffect, useState } from 'react';
import styles from './programAdministration.module.scss'
import { ChildProject, IProgramAdministrationProps, shimmeredColumns } from './types';
import { useStore } from './store';
import { IViewField, SelectionMode } from "@pnp/spfx-controls-react/lib/ListView";
import { IColumn, ShimmeredDetailsList } from 'office-ui-fabric-react'
import { ProjectTable } from './ProjectTable';
import { Commandbar } from './Commands';
import { AddProjectDialog } from './AddProjectDialog';
// import { fetchChildProjects } from './helpers';


export const ProgramAdministration: FunctionComponent<IProgramAdministrationProps> = ({ sp }) => {
  const toggleLoading = useStore(state => state.toggleLoading)
  const displayProjectDialog = useStore(state => state.displayProjectDialog)
  const childProjects = useStore(state => state.childProjects)
  const isLoading = useStore(state => state.isLoading)
  const setSelected = useStore(state => state.setSelectedToDelete)
  const fetchChildProjects = useStore(state => state.fetchChildProjects)

  useEffect(() => {
    const fetch = async () => {
      await fetchChildProjects(sp)
      toggleLoading()
    }
    toggleLoading()
    fetch()
  }, [])

  if (isLoading) {
    return <ShimmeredDetailsList items={[]} shimmerLines={15} columns={shimmeredColumns} enableShimmer />
  }

  return (
    <>
      <Commandbar _sp={sp} />
      <div className={styles.root}>
        <h2>Administrasjon av underordnede prosjekter</h2>
        <div>
          <ProjectTable fields={fields} projects={childProjects} onSelect={(selectedItem: any) => setSelected(selectedItem)} selectionMode={SelectionMode.multiple} />
        </div>
        {displayProjectDialog && <AddProjectDialog sp={sp} />}
      </div>
    </>
  )
}


export const fields: IViewField[] = [
  {
    name: "Title",
    displayName: "Tittel",
    isResizable: true,
    sorting: true,
    maxWidth: 250.
  },
  {
    name: "GtSiteUrlOWSTEXT",
    displayName: "Site URL",
    isResizable: true,
    sorting: true,
    maxWidth: 250.
  }
]

