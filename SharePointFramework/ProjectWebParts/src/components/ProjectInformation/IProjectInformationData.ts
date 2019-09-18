import { TypedHash } from '@pnp/common';
import { IEntityField } from 'sp-entityportal-service';
import { ProjectPropertyModel } from './ProjectProperty';

export interface IProjectInformationData {
  properties?: ProjectPropertyModel[];
  editFormUrl?: string;
  versionHistoryUrl?: string;
  statusReports?: { Id: number, Created: string }[];
  fields?: IEntityField[];
  fieldValues?: TypedHash<any>;
}