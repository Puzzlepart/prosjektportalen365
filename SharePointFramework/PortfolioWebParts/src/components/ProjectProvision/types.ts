import { IBaseComponentProps } from 'components/types'

export interface IProjectProvisionProps extends IBaseComponentProps {
  description: string
}

export interface IProjectProvisionState {
  siteType: string
}
