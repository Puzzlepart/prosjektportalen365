import * as ExperienceLogWebPartStrings from 'ExperienceLogWebPartStrings';
import { ExperienceLogColumns } from './ExperienceLogColumns';
import { IAggregatedSearchListProps } from '../';

export interface IExperienceLogProps extends IAggregatedSearchListProps { }

export const ExperienceLogDefaultProps: Partial<IExperienceLogProps> = {
  title: ExperienceLogWebPartStrings.Title,
  columns: ExperienceLogColumns,
  excelExportConfig: {
    fileNamePrefix: ExperienceLogWebPartStrings.ExcelExportFileNamePrefix,
    sheetName: 'Sheet1',
  },
};
