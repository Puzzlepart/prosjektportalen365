import { IBaseComponentProps } from 'components/types'

export interface IProjectProvisionProps extends IBaseComponentProps {
  provisionUrl: string
}

export interface IProjectProvisionState {
  loading: boolean
  showProvisionDrawer: boolean
  showProvisionStatus: boolean
  properties: Record<string, any>
  settings: Map<string, any>
}
