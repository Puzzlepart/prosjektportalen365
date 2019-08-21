import * as React from 'react';
import * as strings from 'PortfolioWebPartsStrings';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { tryParseInt } from '@Shared/helpers';

const onRenderLink = (item: any) => <a href={item.SPWebUrl} target='_blank'>{item.SiteTitle}</a>;
const onRenderNumber = (item: any, _index: number, column: IColumn) => tryParseInt(item[column.fieldName], '');

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
    onRender: onRenderLink,
},
{
    key: "GtRiskProbabilityOWSNMBR",
    fieldName: "GtRiskProbabilityOWSNMBR",
    name: strings.ProbabilityLabel,
    minWidth: 100,
    maxWidth: 125,
    onRender: onRenderNumber,
},
{
    key: "GtRiskConsequenceOWSNMBR",
    fieldName: "GtRiskConsequenceOWSNMBR",
    name: strings.ConsequenceLabel,
    minWidth: 100,
    maxWidth: 125,
    onRender: onRenderNumber,
},
{
    key: "GtRiskProbabilityPostActionOWSNMBR",
    fieldName: "GtRiskProbabilityPostActionOWSNMBR",
    name: strings.ProbabilityPostActionLabel,
    minWidth: 100,
    maxWidth: 125,
    onRender: onRenderNumber,
},
{
    key: "GtRiskConsequencePostActionOWSNMBR",
    fieldName: "GtRiskConsequencePostActionOWSNMBR",
    name: strings.ConsequencePostActionLabel,
    minWidth: 100,
    maxWidth: 125,
    onRender: onRenderNumber,
},
{
    key: "GtRiskActionOWSMTXT",
    fieldName: "GtRiskActionOWSMTXT",
    name: strings.RiskActionLabel,
    minWidth: 300,
    isMultiline: true,
}];