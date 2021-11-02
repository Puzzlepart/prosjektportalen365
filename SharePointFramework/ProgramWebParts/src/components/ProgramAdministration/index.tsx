import React, { FunctionComponent, useEffect, useState } from 'react';
import styles from './programAdministration.module.scss'
import { IProgramAdministrationProps, IChildProject } from './types';
import { useStore } from './store';
import { SPRest } from '@pnp/sp';
import { IViewField, SelectionMode } from "@pnp/spfx-controls-react/lib/ListView";
import { IColumn, ShimmeredDetailsList } from 'office-ui-fabric-react'
import { ProjectTable } from './ProjectTable';
import { Commandbar } from './Commands';
import { AddProjectDialog } from './AddProjectDialog';



export const ProgramAdministration: FunctionComponent<IProgramAdministrationProps> = ({ sp }) => {

  const setProjects = useStore(state => state.setProjects)
  const toggleLoading = useStore(state => state.toggleLoading)
  const displayProjectDialog = useStore(state => state.displayProjectDialog)
  const projects = useStore(state => state.projects)
  const isLoading = useStore(state => state.isLoading)

  useEffect(() => {
    const fetch = async () => {
      setProjects(await fetchChildProjects(sp))
      toggleLoading()
    }
    toggleLoading()
    fetch()
  }, [])

  if (isLoading) {
    return <ShimmeredDetailsList items={[]} shimmerLines={15} columns={shimmeredColumns} enableShimmer />
  }

  return (
    <div className={styles.root}>
      <div>
        <Commandbar />
      </div>
      <div>
        <ProjectTable fields={fields} projects={projects} onSelect={(selectedItem) => console.log(selectedItem)} selectionMode={SelectionMode.multiple} />
      </div>
      {displayProjectDialog && <AddProjectDialog />}
    </div>

  )
}

/**
 * Fetches current child projects
 */
async function fetchChildProjects(_sp: SPRest) {

  const [data] = await _sp.web.lists.getByTitle("Prosjektegenskaper").items.select('GtChildProjects').get()
  const children = await JSON.parse(data.GtChildProjects)
  return children
}

/**
 * Add a child project
 */
async function addChildProject(_sp: SPRest, project: IChildProject) {

  const [currentData] = await _sp.web.lists.getByTitle("Prosjektegenskaper").items.select('GtChildProjects').get()
  const projects: IChildProject[] = JSON.parse(currentData.GtChildProjects)

  const updatedProjects = [...projects, project]
  const ans = await _sp.web.lists.getByTitle("Prosjektegenskaper").items.getById(1).update({ GtChildProjects: JSON.stringify(updatedProjects) })
  console.log(ans)
}

export const fields: IViewField[] = [
  {
    name: "siteUrl",
    displayName: "Url",
    isResizable: true,
    sorting: true,
    maxWidth: 250.

  },
  {
    name: "siteId",
    displayName: "Id",
    isResizable: true,
    sorting: true,
    maxWidth: 250.
  }
]

const shimmeredColumns: IColumn[] = [
  {
    key: "1",
    name: "siteUrl",
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  },
  {
    key: "2",
    name: "siteId",
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  }
]