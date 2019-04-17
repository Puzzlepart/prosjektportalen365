import * as React from 'react';
import * as strings from 'RiskOverviewWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import tryParseInt from '../../../../../@Shared/lib/helpers/tryParseInt';

export const RiskOverviewColumns: IColumn[] = [{
    key: 'Title',
    fieldName: 'Title',
    name: PortfolioWebPartsStrings.TitleLabel,
    minWidth: 220,
    maxWidth: 300,
    isResizable: true,
},
{
    key: "SiteTitle",
    fieldName: "SiteTitle",
    name: PortfolioWebPartsStrings.SiteTitleLabel,
    minWidth: 200,
    onRender: (item: any) => <a href={item.SPWebUrl} target='_blank'>{item.SiteTitle}</a>,
},
{
    key: "GtRiskProbabilityOWSNMBR",
    fieldName: "GtRiskProbabilityOWSNMBR",
    name: strings.ProbabilityLabel,
    minWidth: 100,
    onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
},
{
    key: "GtRiskConsequenceOWSNMBR",
    fieldName: "GtRiskConsequenceOWSNMBR",
    name: strings.ConsequenceLabel,
    minWidth: 100,
    onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
},
{
    key: "GtRiskProbabilityPostActionOWSNMBR",
    fieldName: "GtRiskProbabilityPostActionOWSNMBR",
    name: strings.ProbabilityPostActionLabel,
    minWidth: 100,
    onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
},
{
    key: "GtRiskConsequencePostActionOWSNMBR",
    fieldName: "GtRiskConsequencePostActionOWSNMBR",
    name: strings.ConsequencePostActionLabel,
    minWidth: 100,
    onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
},
{
    key: "GtRiskActionOWSMTXT",
    fieldName: "GtRiskActionOWSMTXT",
    name: strings.RiskActionLabel,
    minWidth: 300,
    isMultiline: true,
}];