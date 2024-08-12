import { IBaseComponentProps } from 'components/types'

export interface IProjectProvisionProps extends IBaseComponentProps {
  provisionUrl: string
}

export interface IProjectProvisionState {
  loading: boolean
  showProvisionDrawer: boolean
  showProvisionStatus: boolean
  showProvisionSettings: boolean
  settings: any[]
  types?: Record<string, any>
  teamTemplates?: Record<string, any>
  requests?: any[]
  properties: Record<string, any>
  refetch?: number
  isRefetching?: boolean
  searchTerm?: string
}
