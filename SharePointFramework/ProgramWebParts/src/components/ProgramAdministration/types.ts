import { WebPartContext } from '@microsoft/sp-webpart-base'
import { DataAdapter } from 'data'
import { SPRest } from '@pnp/sp'
import { IColumn, MessageBarType } from 'office-ui-fabric-react'
import { IChildProject } from 'types'

export interface IProgramAdministrationProps {
  webPartTitle: string
  description: string
  context: WebPartContext
  dataAdapter: DataAdapter
  sp: SPRest
  title: string
}

export interface IProgramAdministrationState {
  loading: {
    root: boolean,
    AddProjectDialog: boolean
  }
  childProjects: IChildProject[]
  displayAddProjectDialog: boolean
  availableProjects: IChildProjectListItem[]
  selectedProjectsToDelete: IChildProject[]
  error: {
    text: string
    messageBarType: MessageBarType
  }
}

export interface IChildProjectListItem extends IChildProject {
  SPWebURL: string
}

export interface IProgramAdministrationItem {
  Title: string
  SPWebURL: string
}

export const shimmeredColumns: IColumn[] = [
  {
    key: '1',
    name: 'Tittel',
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  }
]
