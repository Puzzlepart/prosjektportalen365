import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPRest } from '@pnp/sp'

export interface IAddProjectProps {
  isHidden?: boolean
  sp: SPRest
  context: WebPartContext
}
