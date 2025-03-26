import { Slot } from '@fluentui/react-components'
import { IBaseComponentProps } from 'components/types'

export interface IProjectProvisionProps extends IBaseComponentProps {
  provisionUrl: string
  debugMode?: boolean
  fields?: IProvisionField[]
  disabled?: boolean
  icon?: Slot<'span'>
  appearance?: 'secondary' | 'primary' | 'outline' | 'subtle' | 'transparent'
  size?: 'small' | 'medium' | 'large'
}

export interface IProjectProvisionState {
  loading: boolean
  error?: Error
  showProvisionDrawer: boolean
  showProvisionStatus: boolean
  showProvisionSettings: boolean
  settings: any[]
  types?: Record<string, any>
  teamTemplates?: Record<string, any>
  sensitivityLabels?: Record<string, any>
  retentionLabels?: Record<string, any>
  requests?: any[]
  properties: Record<string, any>
  refetch?: number
  isRefetching?: boolean
  searchTerm?: string
}

export interface IProvisionField {
  order: number
  fieldName: string
  displayName: string
  description?: string
  placeholder?: string
  dataType?: string
  disabled?: boolean
  required?: boolean
  level?: number
}
