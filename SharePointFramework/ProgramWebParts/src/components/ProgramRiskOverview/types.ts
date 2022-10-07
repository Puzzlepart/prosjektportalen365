import { DataAdapter } from 'data'
import { IAggregatedPortfolioPropertyPane } from 'types'

export interface IProgramRiskOverview {
  webPartTitle: string
  context: any
  dataAdapter: DataAdapter
  properties: IAggregatedPortfolioPropertyPane
  onUpdateProperty: (key: string, value: any) => void
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

export const riskColumns: any[] = [
  {
    key: 'Title',
    fieldName: 'Title',
    name: 'Tittel',
    minWidth: 150,
    maxWidth: 300
  },
  {
    key: 'GtRiskProbabilityOWSNMBR',
    fieldName: 'GtRiskProbabilityOWSNMBR',
    name: 'Sannsynlighet (S)',
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: 'int'
    }
  },
  {
    key: 'GtRiskConsequenceOWSNMBR',
    fieldName: 'GtRiskConsequenceOWSNMBR',
    name: 'Konsekvens (K)',
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: 'int'
    }
  },
  {
    key: 'GtRiskProbabilityPostActionOWSNMBR',
    fieldName: 'GtRiskProbabilityPostActionOWSNMBR',
    name: 'S etter tiltak',
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: 'int'
    }
  },
  {
    key: 'GtRiskConsequencePostActionOWSNMBR',
    fieldName: 'GtRiskConsequencePostActionOWSNMBR',
    name: 'K etter tiltak',
    minWidth: 100,
    maxWidth: 125,
    data: {
      renderAs: 'int'
    }
  },
  {
    key: 'GtRiskActionOWSMTXT',
    fieldName: 'GtRiskActionOWSMTXT',
    name: 'Tiltak',
    minWidth: 300,
    isMultiline: true
  }
]
