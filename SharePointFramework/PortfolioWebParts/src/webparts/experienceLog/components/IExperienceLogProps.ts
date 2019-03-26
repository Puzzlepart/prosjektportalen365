import IExcelExportConfig from 'prosjektportalen-spfx-shared/lib/interfaces/IExcelExportConfig';
import * as strings from 'ExperienceLogWebPartStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ExperienceLogColumns } from './ExperienceLogColumns';
import { IExperienceLogWebPartProps } from '../IExperienceLogWebPartProps';

export interface IExperienceLogProps extends IExperienceLogWebPartProps { }

export const ExperienceLogDefaultProps: Partial<IExperienceLogProps> = {
  title: strings.Title,
  columns: ExperienceLogColumns,
  excelExportConfig: {
    fileNamePrefix: strings.ExcelExportFileNamePrefix,
    sheetName: 'Sheet A',
    buttonLabel: strings.ExcelExportButtonLabel,
    buttonIcon: 'ExcelDocument',
  },
};
