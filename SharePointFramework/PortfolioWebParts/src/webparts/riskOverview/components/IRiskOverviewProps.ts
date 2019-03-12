import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IRiskOverviewWebPartProps } from '../IRiskOverviewWebPartProps';
import tryParseInt from '../../../common/helpers/tryParseInt';

export interface IRiskOverviewProps extends IRiskOverviewWebPartProps {
    columns?: IColumn[];
}

export const RiskOverviewDefaultProps: Partial<IRiskOverviewProps> = {
    columns: [{
        key: 'Title',
        fieldName: 'Title',
        name: 'Tittel',
        minWidth: 220,
        maxWidth: 300,
        isResizable: true,
    },
    {
        key: "SiteTitle",
        fieldName: "SiteTitle",
        name: 'Prosjekt',
        minWidth: 200,
    },
    {
        key: "GtRiskProbabilityOWSNMBR",
        fieldName: "GtRiskProbabilityOWSNMBR",
        name: 'Sannsynlighet (S)',
        minWidth: 100,
        onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
    },
    {
        key: "GtRiskConsequenceOWSNMBR",
        fieldName: "GtRiskConsequenceOWSNMBR",
        name: 'Konsekvens (K)',
        minWidth: 100,
        onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
    },
    {
        key: "GtRiskProbabilityPostActionOWSNMBR",
        fieldName: "GtRiskProbabilityPostActionOWSNMBR",
        name: 'S etter tiltak',
        minWidth: 100,
        onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
    },
    {
        key: "GtRiskConsequencePostActionOWSNMBR",
        fieldName: "GtRiskConsequencePostActionOWSNMBR",
        name: 'K etter tiltak',
        minWidth: 100,
        onRender: (item, _index, column) => tryParseInt(item[column.fieldName], ''),
    },
    {
        key: "GtRiskActionOWSMTXT",
        fieldName: "GtRiskActionOWSMTXT",
        name: 'Tiltak',
        minWidth: 300,
        isMultiline: true,
    }],
};