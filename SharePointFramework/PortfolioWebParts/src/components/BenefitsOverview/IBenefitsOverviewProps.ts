import * as BenefitsOverviewWebPartStrings from 'BenefitsOverviewWebPartStrings';
import { IAggregatedSearchListProps } from '../';

export interface IBenefitsOverviewProps  extends IAggregatedSearchListProps {
    hiddenColumns?: string[];
}

export const BenefitsOverviewDefaultProps: Partial<IBenefitsOverviewProps> = {
    title: BenefitsOverviewWebPartStrings.Title,
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
    excelExportConfig: {
        fileNamePrefix: BenefitsOverviewWebPartStrings.ExcelExportFileNamePrefix,
        sheetName: 'Sheet1',
    },
};