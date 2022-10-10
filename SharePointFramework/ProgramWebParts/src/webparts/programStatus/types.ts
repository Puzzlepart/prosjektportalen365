import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'

export interface IProgramStatusWebPartProps extends IBaseWebPartComponentProps {
  webPartTitle: string
  showCommandBar: boolean
  showFilters: boolean
  showViewSelector: boolean
  showGroupBy: boolean
  showSearchBox: boolean
  showExcelExportButton: boolean
  defaultViewId: string
}
