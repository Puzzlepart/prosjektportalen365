import { IBenefitsOverviewWebPartProps } from '../IBenefitsOverviewWebPartProps';

export interface IBenefitsOverviewProps extends IBenefitsOverviewWebPartProps { }

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
        'GtGainsResponsible'
    ],
};