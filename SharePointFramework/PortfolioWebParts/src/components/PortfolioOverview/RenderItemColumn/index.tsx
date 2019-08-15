import { SearchResult } from '@pnp/sp';
import { formatDate, tryParseCurrency } from '@Shared/helpers';
import { PortfolioOverviewColumn } from 'models';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import * as React from 'react';
import { Tag } from './Tag/index';

/**
 * On render item activeFilters
*
* @param {SearchResult} item Item
* @param {number} _index Index
* @param {PortfolioOverviewColumn} column Column
*/
export function renderItemColumn(item: SearchResult, _index: number, column: PortfolioOverviewColumn) {
    const colValue = item[column.fieldName];

    if (!colValue) return null;

    switch (column.fieldName) {
        case 'Title': {
            return (
                <span>
                    <a href={item.Path} target='_blank'>{colValue}</a>
                    <a href='#' style={{ marginLeft: 8 }} onClick={_evt => this.onOpenProjectInfoModal(item)}><Icon iconName='OpenInNewWindow' /></a>
                </span >
            );
        }
    }
    switch (column.dataType) {
        case 'Date': {
            return (
                <span>
                    {formatDate(colValue)}
                </span>
            );
        }
        case 'Currency': {
            return (
                <span>
                    {tryParseCurrency(colValue, '')}
                </span>
            );
        }
        case 'Tags': {
            let tags: string[] = colValue.split(';');
            return (
                <span>
                    {tags.map((text, idx) => <Tag key={idx} text={text} />)}
                </span>
            );
        }
        default: {
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
    }
}