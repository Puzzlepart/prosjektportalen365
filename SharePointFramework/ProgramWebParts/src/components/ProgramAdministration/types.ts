import { WebPartContext } from '@microsoft/sp-webpart-base'
import { DataAdapter } from 'data'
import { SPRest } from '@pnp/sp'
import { IColumn } from 'office-ui-fabric-react'
import { ChildProject } from 'models'
export interface IProgramAdministrationProps {
  description: string
  context: WebPartContext
  dataAdapter: DataAdapter
  sp: SPRest
}

export interface ChildProjectListItem extends ChildProject {
  GtSiteUrl: string
}

export const shimmeredColumns: IColumn[] = [
  {
    key: '1',
    name: 'Tittel',
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  },
  {
    key: '2',
    name: 'Site URL',
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  }
]

