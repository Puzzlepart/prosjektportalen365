import { IBaseComponentProps } from 'components/types'

export interface IProjectProvisionProps extends IBaseComponentProps {
  description: string
}

export interface IProjectProvisionState {
  siteType: string
  showProvisionDrawer: boolean
  showProvisionStatus: boolean
  properties: Record<string, any>
  title: string
  privacy: string
}
