import { WebPartContext } from '@microsoft/sp-webpart-base'
import { DataAdapter } from 'data'
import { SPRest, Web } from '@pnp/sp'
import { IColumn } from 'office-ui-fabric-react'
export interface IProgramAdministrationProps {
  description: string
  context: WebPartContext
  dataAdapter: DataAdapter
  sp: SPRest
}

export interface ChildProject {
  GtSiteIdOWSTEXT: string
  title: string
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
    name: 'Site id',
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  }
]
