import { IConfigurationFile } from 'types'

export interface IProjectStatusWebPartData {
  riskMatrixConfigurations?: IConfigurationFile[]
  defaultRiskMatrixConfiguration?: IConfigurationFile
}
