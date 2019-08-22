import { ExperienceLogColumns } from './ExperienceLogColumns';
import { IAggregatedSearchListProps } from '../';

export interface IExperienceLogProps extends IAggregatedSearchListProps { }

export const ExperienceLogDefaultProps: Partial<IExperienceLogProps> = {
  columns: ExperienceLogColumns,
  showExcelExportButton: true,
};
