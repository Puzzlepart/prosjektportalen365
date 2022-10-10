import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'

export interface IProgramDeliveriesWebPartProps extends IBaseWebPartComponentProps {
  webPartTitle: string;
  dataSource: string;
  showExcelExportButton: boolean;
  showSearchBox: boolean;
  showCommandBar: boolean;
  columns: Array<{
    key: string;
    fieldName: string;
    name: string;
    minWidth: number;
    maxWidth: number;
    isMultiline: boolean;
    isResizable: boolean;
  }>;
}
