import { SPProjectColumnItem } from 'shared/lib/models/SPProjectColumnItem';
import { IGetPropertiesData } from 'shared/lib/services/ProjectDataService';
import { IEntityField } from 'sp-entityportal-service';

export interface IProjectInformationData extends IGetPropertiesData {
  /**
   * Array of status reports
   */
  statusReports?: { Id: number, Created: string }[];

  /**
   * Column configuration
   */
  columnConfig?: SPProjectColumnItem[];

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[];
}