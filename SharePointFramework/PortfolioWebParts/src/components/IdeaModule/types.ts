import { IBaseComponentProps } from '../types'

export interface IIdeaModuleProps extends IBaseComponentProps {
  configurationList: string
}

export interface IIdeaModuleState {
  loading?: boolean
  isRefetching?: boolean
  configuration?: ConfigurationItem[]
  ideas?: Record<string, any>
}

export interface IIdeaModuleHashState {
  ideaId?: string
}

export class ConfigurationItem {
  title: string
  description: string
  ideaProcessingList: string
  ideaRegistrationList: string
  ideaProcessingChoices: string
  ideaRegistrationChoices: string
}
