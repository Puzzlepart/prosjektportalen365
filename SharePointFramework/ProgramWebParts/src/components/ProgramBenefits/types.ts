import { DataAdapter } from 'data'
import { IAggregatedPortfolioPropertyPane } from 'types/IAggregatedPortfolioPropertyPane'
import { IAggregatedSearchListColumn } from 'pp365-portfoliowebparts/lib/interfaces'

export interface IProgramBenefitsProps {
  webPartTitle: string
  context: any
  dataAdapter: DataAdapter
  properties: IAggregatedPortfolioPropertyPane
  onUpdateProperty: (key: string, value: any) => void
}

export const selectProperties = [
  'Path',
  'SPWebURL',
  'Title',
  'ListItemId',
  'SiteTitle',
  'SiteId',
  'ContentTypeID',
  'GtDesiredValueOWSNMBR',
  'GtMeasureIndicatorOWSTEXT',
  'GtMeasurementUnitOWSCHCS',
  'GtStartValueOWSNMBR',
  'GtMeasurementValueOWSNMBR',
  'GtMeasurementCommentOWSMTXT',
  'GtMeasurementDateOWSDATE',
  'GtGainsResponsibleOWSUSER',
  'GtGainsTurnoverOWSMTXT',
  'GtGainsTypeOWSCHCS',
  'GtPrereqProfitAchievementOWSMTXT',
  'GtRealizationTimeOWSDATE',
  'GtGainLookupId',
  'GtMeasureIndicatorLookupId',
  'GtGainsResponsible',
  'GtGainsOwner',
  'Path',
  'SPWebURL',
  'SiteTitle'
]

export const BenefitColumns: IAggregatedSearchListColumn[] = [
  {
    key: 'Benefit.Title',
    fieldName: 'Benefit.Title',
    name: 'Gevinst',
    minWidth: 100,
    maxWidth: 180,
    isMultiline: true,
    isResizable: true
  },
  {
    key: 'Benefit.Responsible',
    fieldName: 'Benefit.Responsible',
    name: 'Gevinstansvarlig',
    minWidth: 50,
    maxWidth: 150,
    isResizable: true,
    isGroupable: true
  },
  {
    key: 'Benefit.Owner',
    fieldName: 'Benefit.Owner',
    name: 'Gevinsteier',
    minWidth: 50,
    maxWidth: 180,
    isResizable: true,
    isGroupable: true
  },
  {
    key: 'Title',
    fieldName: 'Title',
    name: 'Title',
    minWidth: 50,
    maxWidth: 180,
    isMultiline: true,
    isResizable: true
  },
  {
    key: 'Unit',
    fieldName: 'Unit',
    name: 'Unit',
    minWidth: 50,
    maxWidth: 80,
    isResizable: true
  }
]
