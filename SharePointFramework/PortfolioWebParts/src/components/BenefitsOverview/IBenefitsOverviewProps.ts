import { IAggregatedSearchListProps } from '../AggregatedSearchList'

export interface IBenefitsOverviewProps  extends IAggregatedSearchListProps {
    /**
     * Columns to hide from the DetailsList
     */
    hiddenColumns?: string[];
}

// tslint:disable-next-line: naming-convention
export const BenefitsOverviewDefaultProps: Partial<IBenefitsOverviewProps> = {
    selectProperties: [
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
        'GtGainsOwner'
      ],
      showExcelExportButton: true,
}