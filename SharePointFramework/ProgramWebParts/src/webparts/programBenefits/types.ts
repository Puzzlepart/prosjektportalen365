import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'

export interface IProgramBenefitsWebPartProps extends IBaseWebPartComponentProps {
  webPartTitle: string
  dataSource: string
  showExcelExportButton: boolean
  showSearchBox: boolean
  showCommandBar: boolean
}
