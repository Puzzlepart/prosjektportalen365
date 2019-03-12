import { DisplayMode } from '@microsoft/sp-core-library';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IProjectInformationWebPartProps } from '../IProjectInformationWebPartProps';

export interface IProjectInformationProps extends IProjectInformationWebPartProps {
  context: WebPartContext;
  filterField: string;
  updateTitle?: (title: string) => void;
  hideEditPropertiesButton?: boolean;
}
