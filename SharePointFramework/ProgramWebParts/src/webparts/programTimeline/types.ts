import { WebPartContext } from '@microsoft/sp-webpart-base'
import { DataAdapter } from 'data'
import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'


export interface IProgramTimelineWebPartProps extends IBaseWebPartComponentProps {
  description: string;
  context: WebPartContext;
  dataAdapter: DataAdapter;
  childProjects: string[];
  infoText?: string;
  webPartTitle: string;
  dataSourceName?: string;
  configItemTitle?: string;
}
