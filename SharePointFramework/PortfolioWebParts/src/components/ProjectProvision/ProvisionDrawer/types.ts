import { IProjectProvisionProps } from '../types'

export interface IProvisionDrawerProps extends Pick<IProjectProvisionProps, 'debugMode'> {
  toast?: any
}
