import { sp, Web } from '@pnp/sp';
import { getId } from '@uifabric/utilities';
import * as arraySort from 'array-sort';
import * as arrayUnique from 'array-unique';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { DetailsList, DetailsListLayoutMode, ConstrainMode, SelectionMode, IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import { getObjectValue, isHubSite, isNull, isEmpty } from 'shared/lib/helpers';
import { DataSourceService, ExcelExportService } from 'shared/lib/services';
import HubSiteService from 'sp-hubsite-service';
import * as format from 'string-format';
import styles from './AggregatedSearchList.module.scss';
import { AggregatedSearchListDefaultProps, IAggregatedSearchListProps } from './IAggregatedSearchListProps';
import { IAggregatedSearchListState } from './IAggregatedSearchListState';
import { DataSource } from 'shared/lib/models/DataSource';

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
            const { items, selectedDataSource, dataSources } = await this.fetchData();
            this.setState({ items, selectedDataSource, dataSources, isLoading: false });
        } catch (error) {
            this.setState({ error, isLoading: false });
        }
    }

    public render(): React.ReactElement<IAggregatedSearchListProps> {
        if (this.state.isLoading) {
            return (
                <div className={this.props.className}>
                    <div className={styles.container}>
                        <Spinner label={format(strings.LoadingText, this.props.title)} type={SpinnerType.large} />
                    </div>
                </div>
            );
        }
        if (this.state.error) {
            return (
                <div className={this.props.className}>
                    <div className={styles.container}>
                        <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
                    </div>
                </div>
            );
        }

        let { items, columns, groups } = this.getFilteredData();

        return (
            <div className={this.props.className}>
                <div className={styles.container}>
                    {this.commandBar()}
                    <div className={styles.header}>
                        <div className={styles.title}>{this.props.title}</div>
                    </div>
                    <div className={styles.searchBox} hidden={!this.props.showSearchBox}>
                        <SearchBox onChange={this.onSearch.bind(this)} labelText={this.searchBoxLabelText} />
                    </div>
                    <div className={styles.listContainer}>
                        <DetailsList
                            items={items}
                            columns={columns}
                            groups={groups}
                            onRenderItemColumn={this.onRenderItemColumn.bind(this)}
                            onColumnHeaderClick={this.onColumnHeaderSort.bind(this)}
                            constrainMode={ConstrainMode.unconstrained}
                            layoutMode={DetailsListLayoutMode.fixedColumns}
                            selectionMode={SelectionMode.none} />
                    </div>
                </div>
            </div>
        );
    }

    private get searchBoxLabelText(): string {
        if (!isEmpty(this.props.searchBoxPlaceholderText)) {
            return this.props.searchBoxPlaceholderText;
        }
        if (this.props.dataSource) {
            return format(strings.SearchBoxPlaceholderText, this.props.dataSource.toLowerCase());
        }
        if (this.state.selectedDataSource) {
            return format(strings.SearchBoxPlaceholderText, this.state.selectedDataSource.title.toLowerCase());
        }
        return '';
    }

    /**
     * On search
     * 
     * Makes the search term lower case and sets state
     * 
     * @param {string} searchTerm Search term
     */
    private onSearch(searchTerm: string): void {
        this.setState({ searchTerm: searchTerm.toLowerCase() });
    }

    private async onDataSourceChanged(dataSource: DataSource) {
        let items = await this.fetchItems(dataSource.searchQuery);
        this.setState({ items, selectedDataSource: dataSource });
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
     * @param {React.MouseEvent} _ev Event
     * @param {IColumn} column Column
     */
    private onColumnHeaderSort(_ev: React.MouseEvent<any>, column: IColumn): void {
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

    private commandBar() {
        const items: ICommandBarItemProps[] = [];

        if (this.props.groupByColumns.length > 0) {
            items.push({
                id: getId('GroupBy'),
                key: getId('GroupBy'),
                name: getObjectValue(this.state, 'groupBy.name', undefined) || strings.NoGroupingText,
                iconProps: { iconName: 'GroupedList' },
                itemType: ContextualMenuItemType.Header,
                onClick: event => event.preventDefault(),
                subMenuProps: {
                    items: [
                        {
                            id: getId('NoGrouping'),
                            key: getId('NoGrouping'),
                            name: strings.NoGroupingText,
                            canCheck: true,
                            checked: isNull(this.state.groupBy),
                            onClick: _ => this.setState({ groupBy: null }),
                        } as IContextualMenuItem,
                        {
                            id: getId('Divider'),
                            key: getId('Divider'),
                            itemType: ContextualMenuItemType.Divider,
                        } as IContextualMenuItem,
                        ...this.props.groupByColumns.map(col => ({
                            id: getId(col.key),
                            key: getId(col.key),
                            name: col.name,
                            canCheck: true,
                            checked: getObjectValue<string>(this.state, 'groupBy.fieldName', '') === col.fieldName,
                            onClick: () => this.setState({ groupBy: col }),
                        })) as IContextualMenuItem[],
                    ],
                },
            });
        }
        if (this.props.showExcelExportButton) {
            items.push({
                id: getId('ExcelExport'),
                key: getId('ExcelExport'),
                name: strings.ExcelExportButtonLabel,
                iconProps: {
                    iconName: 'ExcelDocument',
                    styles: { root: { color: "green !important" } },
                },
                disabled: this.state.isExporting,
                onClick: ev => { this.exportToExcel(ev); },
            });
        }

        const farItems: ICommandBarItemProps[] = [];

        if (this.state.selectedDataSource) {
            farItems.push({
                id: getId('DataSource'),
                key: getId('DataSource'),
                name: this.state.selectedDataSource.title,
                iconProps: { iconName: this.state.selectedDataSource.iconName || 'DataConnectionLibrary' },
                disabled: this.state.dataSources.length === 1,
                subMenuProps: {
                    items: this.state.dataSources.map(dataSource => ({
                        id: getId(dataSource.title),
                        key: getId(dataSource.title),
                        name: dataSource.title,
                        iconProps: { iconName: dataSource.iconName || 'DataConnectionLibrary' },
                        canCheck: true,
                        checked: this.state.selectedDataSource.id === dataSource.id,
                        onClick: () => { this.onDataSourceChanged(dataSource); },
                    })) as IContextualMenuItem[],
                }
            });
        }

        return (
            <div className={styles.commandBar} hidden={!this.props.showCommandBar}>
                <CommandBar items={items} farItems={farItems} />
            </div>
        );
    }

    /**
    * Get groups
    *
    * @param {any[]} items Items
    * @param {IColumn} groupBy Group by column
    * @param {IColumn} sortBy Sort by column
    */
    public static getGroups(items: any[], groupBy: IColumn, sortBy?: IColumn): IGroup[] {
        if (!groupBy) return null;
        const itemsSort = { props: [groupBy.fieldName], opts: { reverse: false } };
        if (sortBy) {
            itemsSort.props.push(sortBy.fieldName);
            itemsSort.opts.reverse = !sortBy.isSortedDescending;
        }
        const groupItems: any[] = arraySort(items, itemsSort.props, itemsSort.opts);
        const groupByValues: string[] = groupItems.map(g => g[groupBy.fieldName] ? g[groupBy.fieldName] : strings.NotSet);
        const uniqueGroupValues: string[] = arrayUnique([].concat(groupByValues));
        return uniqueGroupValues
            .sort((a, b) => a > b ? 1 : -1)
            .map((name, idx) => ({
                key: `Group_${idx}`,
                name: `${groupBy.name}: ${name}`,
                startIndex: groupByValues.indexOf(name, 0),
                count: [].concat(groupByValues).filter(n => n === name).length,
                isShowingAll: true,
            } as IGroup));
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
     * 
     * @param {React.MouseEvent<any> | React.KeyboardEvent<any>} ev Event
     */
    private async exportToExcel(ev: React.MouseEvent<any> | React.KeyboardEvent<any>): Promise<void> {
        ev.preventDefault();
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
     * Get data source
     * 
     * @param {Web} web Web
     * @param {string} dataSource Data source name
     */
    private async getDataSource(web: Web, dataSource: string): Promise<DataSource> {
        return await new DataSourceService(web).getByName(dataSource);
    }

    /**
     * Get data sources
     * 
     * @param {Web} web Web
     * @param {string} dataSourceCategory Data source category
     */
    private async getDataSources(web: Web, dataSourceCategory: string): Promise<DataSource[]> {
        return await new DataSourceService(web).getByCategory(dataSourceCategory);
    }

    /**
     * Fetch items
     * 
     * @param {string} queryTemplate Query template
     */
    private async fetchItems(queryTemplate: string) {
        let { PrimarySearchResults } = await sp.search({
            QueryTemplate: queryTemplate,
            Querytext: '*',
            RowLimit: 500,
            TrimDuplicates: false,
            SelectProperties: this.props.selectProperties || ['Path', 'SPWebUrl', ...this.props.columns.map(col => col.key)],
        });
        return this.props.postTransform ? this.props.postTransform(PrimarySearchResults) : PrimarySearchResults;
    }

    /**
     * Fetch data
     */
    private async fetchData(): Promise<{ items: any[], selectedDataSource: DataSource, dataSources?: DataSource[] }> {
        try {
            let selectedDataSource: DataSource = null;
            let dataSources: DataSource[] = [];
            if (isEmpty(this.props.queryTemplate)) {
                let web = sp.web;
                if (!isHubSite(this.props.pageContext)) {
                    web = (await HubSiteService.GetHubSite(sp, this.props.pageContext)).web;
                }
                if (!isEmpty(this.props.dataSource)) {
                    selectedDataSource = await this.getDataSource(web, this.props.dataSource);
                    dataSources.push(selectedDataSource);
                } else if (!isEmpty(this.props.dataSourceCategory)) {
                    dataSources = await this.getDataSources(web, this.props.dataSourceCategory);
                    selectedDataSource = dataSources.filter(d => d.isDefault)[0];
                }
            }
            let items = await this.fetchItems(this.props.queryTemplate || selectedDataSource.searchQuery);
            return {
                items,
                selectedDataSource,
                dataSources,
            };
        } catch (error) {
            throw format(strings.DataSourceError, this.props.dataSource);
        }
    }
}

export { IAggregatedSearchListProps };

