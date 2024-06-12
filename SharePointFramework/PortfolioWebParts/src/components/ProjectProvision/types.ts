import { IBaseComponentProps } from 'components/types'

export interface IProjectProvisionProps extends IBaseComponentProps {
  provisionUrl: string
}

export interface IProjectProvisionState {
  loading: boolean
  showProvisionDrawer: boolean
  showProvisionStatus: boolean
  settings: Map<string, any>
  types?: Record<string, any>
  requests?: any[]
  properties: Record<string, any>
  selectedRequests?: any[]
}
