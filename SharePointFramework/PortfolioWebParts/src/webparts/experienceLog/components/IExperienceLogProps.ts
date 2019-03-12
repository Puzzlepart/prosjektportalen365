import IGroupByOption from '../../../common/interfaces/IGroupByOption';
import IExcelExportConfig from '../../../common/interfaces/IExcelExportConfig';
import * as strings from 'ExperienceLogWebPartStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IExperienceLogProps {
  context: WebPartContext;
  columns?: IColumn[];
  groupByOptions?: IGroupByOption[];
  excelExportEnabled?: boolean;
  excelExportConfig?: IExcelExportConfig;
}

export const ExperienceLogDefaultProps: Partial<IExperienceLogProps> = {
  columns: [
    {
      key: 'Title',
      fieldName: 'Title',
      name: strings.TitleColumnDisplayName,
      minWidth: 220
    },
    {
      key: 'SiteTitle',
      fieldName: 'SiteTitle',
      name: strings.SiteTitleColumnDisplayName,
      minWidth: 100,
      isResizable: true
    },
    {
      key: 'GtProjectLogDescriptionOWSMTXT',
      fieldName: 'GtProjectLogDescriptionOWSMTXT',
      name: strings.DescriptionColumnDisplayName,
      minWidth: 100,
      isResizable: true
    },
    {
      key: 'GtProjectLogResponsibleOWSCHCS',
      fieldName: 'GtProjectLogResponsibleOWSCHCS',
      name: strings.ResponsibleColumnDisplayName,
      minWidth: 100,
      isResizable: true
    },
    {
      key: 'GtProjectLogConsequenceOWSMTXT',
      fieldName: 'GtProjectLogConsequenceOWSMTXT',
      name: strings.ConsequenceColumnDisplayName,
      minWidth: 100,
      isResizable: true
    },
    {
      key: 'GtProjectLogRecommendationOWSMTXT',
      fieldName: 'GtProjectLogRecommendationOWSMTXT',
      name: strings.RecommendationColumnDisplayName,
      minWidth: 100,
      isResizable: true
    },
    {
      key: 'GtProjectLogActorsOWSCHCM',
      fieldName: 'GtProjectLogActorsOWSCHCM',
      name: strings.ActorsColumnDisplayName,
      minWidth: 100,
      isResizable: true
    }
  ],
  groupByOptions: [{ name: 'Prosjekt', key: 'SiteTitle' }],
  excelExportEnabled: true,
  excelExportConfig: {
    fileNamePrefix: strings.ExcelExportFileNamePrefix,
    sheetName: 'Sheet A',
    buttonLabel: strings.ExcelExportButtonLabel,
    buttonIcon: 'ExcelDocument',
  },
};
