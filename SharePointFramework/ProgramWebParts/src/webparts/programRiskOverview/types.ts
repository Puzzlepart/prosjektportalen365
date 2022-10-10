import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import { IAggreationColumn } from 'types'

export interface IProgramRiskOverviewWebPartProps extends IBaseWebPartComponentProps {
  webPartTitle: string;
  dataSource: string;
  showExcelExportButton: boolean;
  showSearchBox: boolean;
  columns: IAggreationColumn[];
  showCommandBar: boolean;
}

export const SelectedRiskProperties = [
  'Path',
  'SPWebURL',
  'Title',
  'ListItemId',
  'SiteTitle',
  'SiteId',
  'ContentTypeID',
  'GtRiskProbabilityOWSNMBR',
  'GtRiskProbabilityPostActionOWSNMBR',
  'GtRiskConsequenceOWSNMBR',
  'GtRiskConsequencePostActionOWSNMBR',
  'GtRiskActionOWSMTXT',
  'Path',
  'SPWebURL',
  'SiteTitle'
]