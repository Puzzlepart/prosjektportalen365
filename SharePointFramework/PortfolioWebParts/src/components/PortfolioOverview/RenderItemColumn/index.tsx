import { SearchResult } from '@pnp/sp';
import { formatDate, tryParseCurrency } from 'shared/lib/helpers';
import { PortfolioOverviewColumn } from 'models';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import * as React from 'react';
import { IPortfolioOverviewState } from '../IPortfolioOverviewState';
import { IRenderItemColumnProps } from './IRenderItemColumnProps';
import { TagsColumn } from './TagsColumn';
import { UserColumn } from './UserColumn';

/**
 * Mapping for rendering of the different data types
 */
const renderDataTypeMap = {
    user: (props: IRenderItemColumnProps) => (
        <UserColumn {...props} />
    ),
    date: ({ colValue }: IRenderItemColumnProps) => (
        <span>
            {formatDate(colValue)}
        </span>
    ),
    currency: ({ colValue }: IRenderItemColumnProps) => (
        <span>
            {tryParseCurrency(colValue, '')}
        </span>
    ),
    tags: (props: IRenderItemColumnProps) => (
        <TagsColumn {...props} />
    ),
};

/**
 * On render item activeFilters
*
* @param {SearchResult} item Item
* @param {PortfolioOverviewColumn} column Column
* @param {void} onUpdateState On update state
*/
export function renderItemColumn(item: SearchResult, column: PortfolioOverviewColumn, onUpdateState: (state: Partial<IPortfolioOverviewState>) => void) {
    const colValue = item[column.fieldName];

    if (!colValue) return null;

    switch (column.fieldName) {
        case 'Title': {
            return (
                <span>
                    <a href={item.Path} target='_blank'>{colValue}</a>
                    <a href='#' style={{ marginLeft: 8 }} onClick={_ => { onUpdateState({ showProjectInfo: item }); }}> <Icon iconName='OpenInNewWindow' /></a>
                </span >
            );
        }
    }

    if (renderDataTypeMap[column.dataType]) {
        return renderDataTypeMap[column.dataType]({ column, colValue });
    }

    const config = column.config ? column.config[colValue] : null;
    if (config) {
        return (
            <span>
                <Icon iconName={config.iconName} style={{ color: config.color, marginRight: 4 }} />
                <span>{colValue}</span>
            </span>
        );
    }
    return (
        <span>
            {colValue}
        </span>
    );
}