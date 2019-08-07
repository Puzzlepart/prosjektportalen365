import * as ExperienceLogWebPartStrings from 'ExperienceLogWebPartStrings';
import { IExperienceLogWebPartProps } from '../IExperienceLogWebPartProps';
import { ExperienceLogColumns } from './ExperienceLogColumns';

export interface IExperienceLogProps extends IExperienceLogWebPartProps { }

export const ExperienceLogDefaultProps: Partial<IExperienceLogProps> = {
  title: ExperienceLogWebPartStrings.Title,
  columns: ExperienceLogColumns,
  excelExportConfig: {
    fileNamePrefix: ExperienceLogWebPartStrings.ExcelExportFileNamePrefix,
    sheetName: 'Sheet1',
  },
};
