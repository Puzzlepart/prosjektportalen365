
import * as strings from 'BenefitsOverviewWebPartStrings';
import { IBenefitsOverviewWebPartProps } from '../IBenefitsOverviewWebPartProps';
import { BenefitsOverviewColumns } from './BenefitsOverviewColumns';


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
    columns: BenefitsOverviewColumns,
    groupByColumns: [
        { name: strings.BenefitTitleLabel, key: 'benefit.title', fieldName: 'benefit.title', minWidth: 0 },
        { name: strings.BenefitResponsibleLabel, key: 'benefit.responsible', fieldName: 'benefit.responsible', minWidth: 0 },
    ],
};