import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib'

export interface IProgramProjectOverviewProps extends IBaseWebPartComponentProps {
  title: string
  showCommandBar: boolean
  showFilters: boolean
  showViewSelector: boolean
  showGroupBy: boolean
  showSearchBox: boolean
  showExcelExportButton: boolean
}
