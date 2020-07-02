import { ProjectColumn, StatusReport } from 'shared/lib/models'
import * as ProjectDataService from 'shared/lib/services/ProjectDataService'
import { IEntityField } from 'sp-entityportal-service'

export interface IProjectInformationData extends ProjectDataService.IGetPropertiesData {
  /**
   * Array of status reports
   */
  statusReports?: StatusReport[];

  /**
   * Column configuration
   */
  columns?: ProjectColumn[];

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[];
}