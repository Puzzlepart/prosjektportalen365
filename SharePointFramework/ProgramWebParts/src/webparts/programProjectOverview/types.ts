import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib'

/** Visibility settings for the program's project-overview controls. */
export interface IProgramProjectOverviewProps extends IBaseWebPartComponentProps {
  title: string
  showFilters: boolean
  showViewSelector: boolean
  showSearchBox: boolean
  showExcelExportButton: boolean
}
