import { sp } from '@pnp/sp';
import { getObjectValue, isHubSite } from 'shared/lib/helpers';
import { DataSourceService, ExcelExportService } from 'shared/lib/services';
import * as moment from 'moment';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { DetailsList, IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import HubSiteService from 'sp-hubsite-service';
import * as format from 'string-format';
import styles from './AggregatedSearchList.module.scss';
import { AggregatedSearchListDefaultProps, IAggregatedSearchListProps } from './IAggregatedSearchListProps';
import { IAggregatedSearchListState } from './IAggregatedSearchListState';
import * as arraySort from 'array-sort';
import * as arrayUnique from 'array-unique';


export default class AggregatedSearchList extends React.Component<IAggregatedSearchListProps, IAggregatedSearchListState> {
    public static defaultProps = AggregatedSearchListDefaultProps;

    /**
     * Constructor
     *
     * @param {IAggregatedSearchListProps} props Props
     */
    constructor(props: IAggregatedSearchListProps) {
        super(props);
        this.state = { isLoading: true, columns: props.columns };
    }

    public async componentDidMount(): Promise<void> {
        try {
            const items = await this.fetchItems();
            this.setState({ items, isLoading: false });
        } catch (error) {
            this.setState({ error, isLoading: false });
        }
    }

    public render(): React.ReactElement<IAggregatedSearchListProps> {
        if (this.state.isLoading) {
            return (
                <div className={styles.aggregatedSearchList}>
                    <div className={styles.container}>
                        <Spinner label={format(strings.LoadingText, this.props.title)} type={SpinnerType.large} />
                    </div>
                </div>
            );
        }
        if (this.state.error) {
            return (
                <div className={styles.aggregatedSearchList}>
                    <div className={styles.container}>
                        <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
                    </div>
                </div>
            );
        }

        let { items, columns, groups } = this.getFilteredData();

        return (
            <div className={styles.aggregatedSearchList}>
                <div className={styles.container}>
                    <div className={styles.commandBar} hidden={!this.props.showCommandBar}>
                        <CommandBar items={this.getCommandBarItems()} />
                    </div>
                    <div className={styles.header}>
                        <div className={styles.title}>{this.props.title}</div>
                    </div>
                    <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
                        <SearchBox onChange={this.onSearch.bind(this)} labelText={this.getSearchBoxLabelText()} />
                    </div>
                    <div className={styles.listContainer}>
                        <DetailsList
                            items={items}
                            columns={columns}
                            groups={groups}
                            onRenderItemColumn={this.onRenderItemColumn.bind(this)}
                            onColumnHeaderClick={this.onColumnHeaderSort.bind(this)}
                            layoutMode={this.props.layoutMode}
                            constrainMode={this.props.constrainMode}
                            selectionMode={this.props.selectionMode} />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Get search box label text
     */
    private getSearchBoxLabelText() {
        if (this.props.searchBoxPlaceholderText) {
            return this.props.searchBoxPlaceholderText;
        }
        return format(strings.SearchBoxPlaceholderText, this.props.dataSource.toLowerCase());
    }

    /**
     * On search
     * 
     * Makes the search term lower case and sets state
     * 
     * @param {string} searchTerm Search term
     */
    private onSearch(searchTerm: string) {
        this.setState({ searchTerm: searchTerm.toLowerCase() });
    }

    /**
     * On render item column
     * 
     * @param {any} item Item
     * @param {number} index Index
     * @param {IColumn} column Column
     */
    private onRenderItemColumn(item: any, index: number, column: IColumn) {
        const fieldNameDisplay: string = getObjectValue(column, 'data.fieldNameDisplay', undefined);
        return column.onRender ? column.onRender(item, index, column) : getObjectValue(item, fieldNameDisplay || column.fieldName, null);
    }

    /**
     * Sorting on column header click
     *
     * @param {React.MouseEvent} _evt Event
     * @param {IColumn} column Column
     */
    private onColumnHeaderSort(_evt: React.MouseEvent<any>, column: IColumn): void {
        let { items, columns } = ({ ...this.state } as IAggregatedSearchListState);

        let isSortedDescending = column.isSortedDescending;
        if (column.isSorted) {
            isSortedDescending = !isSortedDescending;
        }
        items = items.concat([]).sort((a, b) => {
            let aValue = getObjectValue(a, column.fieldName, null);
            let bValue = getObjectValue(b, column.fieldName, null);
            return isSortedDescending ? (aValue > bValue ? -1 : 1) : (aValue > bValue ? 1 : -1);
        });
        columns = columns.map(_column => {
            _column.isSorted = (_column.key === column.key);
            if (_column.isSorted) {
                _column.isSortedDescending = isSortedDescending;
            }
            return _column;
        });
        this.setState({ items, columns });
    }

    /**
     * Get command bar items
     */
    private getCommandBarItems(): ICommandBarItemProps[] {
        const items: ICommandBarItemProps[] = [];

        if (this.props.groupByColumns.length > 0) {
            const noGrouping: IColumn = {
                key: 'NoGrouping',
                fieldName: 'NoGrouping',
                name: strings.NoGroupingText,
                minWidth: 0,
            };
            const subItems = [noGrouping, ...this.props.groupByColumns].map(item => ({
                key: item.key,
                name: item.name,
                onClick: () => this.setState({ groupBy: item }),
            }));
            items.push({
                key: 'Group',
                name: getObjectValue(this.state, 'groupBy.name', undefined) || strings.NoGroupingText,
                iconProps: { iconName: 'GroupedList' },
                itemType: ContextualMenuItemType.Header,
                onClick: event => event.preventDefault(),
                subMenuProps: { items: subItems },
            });
        }
        if (this.props.showExcelExportButton) {
            items.push({
                key: "ExcelExport",
                name: strings.ExcelExportButtonLabel,
                iconProps: {
                    iconName: 'ExcelDocument',
                    styles: { root: { color: "green !important" } },
                },
                disabled: this.state.isExporting,
                onClick: evt => { this.exportToExcel(evt); },
            });
        }

        return items;
    }

    /**
    * Get groups
    *
    * @param {any[]} items Items
    * @param {IColumn}  groupBy Group by column
    * @param {IColumn} sortBy Sort by column
    */
    public static getGroups(items: any[], groupBy: IColumn, sortBy?: IColumn): IGroup[] {
        let groups: IGroup[] = null;
        if (groupBy) {
            const itemsSort = { props: [groupBy.fieldName], opts: { reverse: false } };
            if (sortBy) {
                itemsSort.props.push(sortBy.fieldName);
                itemsSort.opts.reverse = !sortBy.isSortedDescending;
            }
            const groupItems: any[] = arraySort(items, itemsSort.props, itemsSort.opts);
            const groupByValues: string[] = groupItems.map(g => g[groupBy.fieldName] ? g[groupBy.fieldName] : strings.NotSet);
            const uniqueGroupValues: string[] = arrayUnique([].concat(groupByValues));
            groups = uniqueGroupValues
                .sort((a, b) => a > b ? 1 : -1)
                .map((name, idx) => ({
                    key: `${idx}`,
                    name: `${groupBy.name}: ${name}`,
                    startIndex: groupByValues.indexOf(name, 0),
                    count: [].concat(groupByValues).filter(n => n === name).length,
                    isShowingAll: true,
                }));
        }
        return groups;
    }

    /**
     * Get filtered data
     */
    private getFilteredData() {
        let { items, columns, groupBy, searchTerm } = ({ ...this.state } as IAggregatedSearchListState);
        if (searchTerm) {
            items = items.filter(item => {
                return columns.filter(col => {
                    const colValue = getObjectValue<string>(item, col.fieldName, '');
                    return typeof colValue === 'string' && colValue.toLowerCase().indexOf(searchTerm) !== -1;
                }).length > 0;
            });
        }
        return { items, columns, groups: AggregatedSearchList.getGroups(items, groupBy) };
    }

    /**
     * Export to Excel
     */
    private async exportToExcel(evt: React.MouseEvent<any> | React.KeyboardEvent<any>): Promise<void> {
        evt.preventDefault();
        this.setState({ isExporting: true });
        let { items, columns } = this.getFilteredData();
        try {
            await ExcelExportService.export(this.props.title, items, columns);
            this.setState({ isExporting: false });
        } catch (error) {
            this.setState({ isExporting: false });
        }
    }

    /**
     * Fetch items
     */
    private async fetchItems(): Promise<any[]> {
        let {
            pageContext,
            queryTemplate,
            dataSource,
            selectProperties,
            columns,
            postFetch,
        } = this.props;
        try {
            if (!queryTemplate) {
                let web = sp.web;
                if (!isHubSite(pageContext)) {
                    web = (await HubSiteService.GetHubSite(sp, pageContext)).web;
                }
                const { QueryTemplate } = await new DataSourceService(web).getByName(dataSource);
                if (QueryTemplate) {
                    queryTemplate = QueryTemplate;
                } else {
                    throw format(strings.DataSourceNotFound, dataSource);
                }
            }
            let { PrimarySearchResults } = await sp.search({
                QueryTemplate: queryTemplate,
                Querytext: '*',
                RowLimit: 500,
                TrimDuplicates: false,
                SelectProperties: selectProperties || ['Path', 'SPWebUrl', ...columns.map(col => col.key)],
            });
            return postFetch ? postFetch(PrimarySearchResults) : PrimarySearchResults;
        } catch (error) {
            throw format(strings.DataSourceError, dataSource);
        }
    }
}

export { IAggregatedSearchListProps };

