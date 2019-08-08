import { IBenefitsOverviewWebPartProps } from '../IBenefitsOverviewWebPartProps';
import * as BenefitsOverviewWebPartStrings from 'BenefitsOverviewWebPartStrings';

export interface IBenefitsOverviewProps extends IBenefitsOverviewWebPartProps {

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