import { Slot } from '@fluentui/react-components'
import { IBaseComponentProps } from 'components/types'

export interface IProjectProvisionProps extends IBaseComponentProps {
  // General
  buttonLabel?: string
  autoOwner?: boolean

  // Visuals
  siteTypeRenderMode?: string

  // Titles and descriptions
  level0Header?: string
  level0Description?: string
  level1Header?: string
  level1Description?: string
  level2Header?: string
  level2Description?: string
  footerDescription?: string

  // Hide/show
  hideStatusMenu?: boolean
  hideSettingsMenu?: boolean

  // Advanced
  provisionUrl: string
  fields?: IProvisionField[]
  debugMode?: boolean

  // Other
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
  sensitivityLabelsLibrary?: Record<string, any>
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
  hidden?: boolean
  level?: number
}
