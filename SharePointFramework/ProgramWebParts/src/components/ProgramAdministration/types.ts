import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPDataAdapter } from 'data'
import { SPRest } from '@pnp/sp'
import { IColumn, MessageBarType } from 'office-ui-fabric-react'
import { IChildProject } from 'types/IChildProject'

export interface IProgramAdministrationProps {
  webPartTitle: string
  description: string
  context: WebPartContext
  dataAdapter: SPDataAdapter
  sp: SPRest
  title: string
}

export interface IProgramAdministrationState {
  loading: {
    root: boolean
    AddProjectDialog: boolean
  }
  childProjects: IChildProject[]
  displayAddProjectDialog: boolean
  availableProjects: any[]
  selectedProjectsToDelete: IChildProject[]
  error: {
    text: string
    messageBarType: MessageBarType
  }
}

export const shimmeredColumns: IColumn[] = [
  {
    key: 'Title',
    name: 'Tittel',
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  }
]
