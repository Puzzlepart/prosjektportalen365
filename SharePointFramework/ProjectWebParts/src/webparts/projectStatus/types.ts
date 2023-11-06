import { IConfigurationFile } from 'types'

export interface IProjectStatusWebPartData {
  /**
   * Risk matrix configurations retrieved from the SharePoint folder.
   */
  riskMatrixConfigurations?: IConfigurationFile[]

  /**
   * The default risk matrix configuration retrieved from the SharePoint folder.
   */
  defaultRiskMatrixConfiguration?: IConfigurationFile

  /**
   * Opportunity matrix configurations retrieved from the SharePoint folder.
   */
  opportunityMatrixConfigurations?: IConfigurationFile[]

  /**
   * The default opportunity matrix configuration retrieved from the SharePoint folder.
   */
  defaultOpportunityMatrixConfiguration?: IConfigurationFile
}
