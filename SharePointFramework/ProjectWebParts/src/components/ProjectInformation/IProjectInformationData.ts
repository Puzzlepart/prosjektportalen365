import { IGetPropertiesData } from 'shared/lib/services/ProjectDataService';
import { IEntityField } from 'sp-entityportal-service';
import { StatusReport, SPProjectColumnItem } from 'shared/lib/models';

export interface IProjectInformationData extends IGetPropertiesData {
  /**
   * Array of status reports
   */
  statusReports?: StatusReport[];

  /**
   * Column configuration
   */
  columnConfig?: SPProjectColumnItem[];

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[];
}