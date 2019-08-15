import * as React from 'react';
import * as strings from 'PortfolioWebPartsStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export const ExperienceLogColumns: IColumn[] = [    
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
        key: 'Title',
        fieldName: 'Title',
        name: strings.TitleLabel,
        minWidth: 220,
        maxWidth: 250,
    },
    {
        key: 'GtProjectLogDescriptionOWSMTXT',
        fieldName: 'GtProjectLogDescriptionOWSMTXT',
        name: strings.LogDescriptionLabel,
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
        isResizable: true,
        onRender: (item: any, _index: number, column: IColumn) => {
            const colValue = item[column.fieldName] as string;
            if (colValue) {
                const actors = colValue.split(";#").filter(v => v);
                return (
                    <ul style={{ margin: 0, padding: 0 }}>
                        {actors.map(a => <li>{a}</li>)}
                    </ul>
                );
            }
            return null;
        },
    }
];