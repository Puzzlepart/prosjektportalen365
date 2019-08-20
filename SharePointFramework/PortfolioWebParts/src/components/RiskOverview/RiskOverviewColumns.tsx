import * as React from 'react';
import * as strings from 'PortfolioWebPartsStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { tryParseInt } from '@Shared/helpers';

export const RiskOverviewColumns: IColumn[] = [{
    key: 'Title',
    fieldName: 'Title',
    name: strings.TitleLabel,
    minWidth: 250,
    maxWidth: 350,
    isResizable: true,
},
{
    key: "SiteTitle",
    fieldName: "SiteTitle",
    name: strings.SiteTitleLabel,
    minWidth: 200,
    maxWidth: 250,
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