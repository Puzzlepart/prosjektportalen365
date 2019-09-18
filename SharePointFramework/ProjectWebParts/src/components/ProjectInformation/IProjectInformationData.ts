import { TypedHash } from '@pnp/common';
import { IEntityField } from 'sp-entityportal-service';

export interface IProjectInformationData {
  /**
   * URL for edit form
   */
  editFormUrl?: string;

  /**
   * URL for version history
   */
  versionHistoryUrl?: string;

  /**
   * Array of status reports
   */
  statusReports?: { Id: number, Created: string }[];

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[];

  /**
   * Field values for the properties item
   */
  fieldValues?: TypedHash<any>;

  /**
   * Field values in text format for the properties item
   */
  fieldValuesText?: TypedHash<string>;
}