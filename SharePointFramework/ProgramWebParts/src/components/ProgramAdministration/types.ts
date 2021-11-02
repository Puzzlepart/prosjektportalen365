import { WebPartContext } from '@microsoft/sp-webpart-base'
import { DataAdapter } from 'data'
import { SPRest, Web } from '@pnp/sp'
export interface IProgramAdministrationProps {
  description: string
  context: WebPartContext
  dataAdapter: DataAdapter
  sp: SPRest
}

export interface IChildProject {
  siteId: string
  siteUrl: string
}
