import { WebPartContext } from '@microsoft/sp-webpart-base'
import { DataAdapter } from 'data'
import { SPRest } from '@pnp/sp'
import { IColumn, MessageBarType } from 'office-ui-fabric-react'
import { ChildProject } from 'models'

export interface IProgramAdministrationProps {
  webPartTitle: string
  description: string
  context: WebPartContext
  dataAdapter: DataAdapter
  sp: SPRest
  title: string
}

export interface UserMessageProps {
  text: string
  messageBarType: MessageBarType
}

export interface ChildProjectListItem extends ChildProject {
  GtSiteUrl: string
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
  },
  {
    key: '2',
    name: 'Site URL',
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  }
]
