import * as React from 'react';
import * as strings from 'ExperienceLogWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export const ExperienceLogColumns: IColumn[] = [
    {
        key: 'Title',
        fieldName: 'Title',
        name: strings.TitleLabel,
        minWidth: 220,
        maxWidth: 250,
    },
    {
        key: 'SiteTitle',
        fieldName: 'SiteTitle',
        name: PortfolioWebPartsStrings.SiteTitleLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
        onRender: (item: any) => <a href={item.SPWebUrl} target='_blank'>{item.SiteTitle}</a>,
    },
    {
        key: 'GtProjectLogDescriptionOWSMTXT',
        fieldName: 'GtProjectLogDescriptionOWSMTXT',
        name: strings.DescriptionLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true
    },
    {
        key: 'GtProjectLogResponsibleOWSCHCS',
        fieldName: 'GtProjectLogResponsibleOWSCHCS',
        name: strings.ResponsibleLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true
    },
    {
        key: 'GtProjectLogConsequenceOWSMTXT',
        fieldName: 'GtProjectLogConsequenceOWSMTXT',
        name: strings.ConsequenceLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true
    },
    {
        key: 'GtProjectLogRecommendationOWSMTXT',
        fieldName: 'GtProjectLogRecommendationOWSMTXT',
        name: strings.RecommendationLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true
    },
    {
        key: 'GtProjectLogActorsOWSCHCM',
        fieldName: 'GtProjectLogActorsOWSCHCM',
        name: strings.ActorsLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true
    }
];