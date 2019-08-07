import { sp } from '@pnp/sp';
import { getObjectValue } from '@Shared/helpers';
import { DataSourceService } from '@Shared/services';
import * as moment from 'moment';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { ConstrainMode, DetailsList, DetailsListLayoutMode, IColumn, IGroup, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import HubSiteService from 'sp-hubsite-service';
import * as stringFormat from 'string-format';
import styles from './AggregatedSearchList.module.scss';
import { IAggregatedSearchListProps } from './IAggregatedSearchListProps';
import { IAggregatedSearchListState } from './IAggregatedSearchListState';

export default class AggregatedSearchList extends React.Component<IAggregatedSearchListProps, IAggregatedSearchListState> {
    public static defaultProps: Partial<IAggregatedSearchListProps> = {
        showCommandBar: true,
        showSearchBox: true,
        layoutMode: DetailsListLayoutMode.justified,
        constrainMode: ConstrainMode.horizontalConstrained,
        selectionMode: SelectionMode.none,
        groupByColumns: [],
    };

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
                        <Spinner label={this.getLoadingText()} type={SpinnerType.large} />
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
                        <SearchBox onChange={this.onSearch} labelText={this.getSearchBoxLabelText()} />
                    </div>
                    <div className={styles.listContainer}>
                        <DetailsList
                            items={items}
                            columns={columns}
                            groups={groups}
                            onRenderItemColumn={this.onRenderItemColumn}
                            onColumnHeaderClick={this.onColumnHeaderSort}
                            layoutMode={this.props.layoutMode}
                            constrainMode={this.props.constrainMode}
                            selectionMode={this.props.selectionMode} />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Get loading text
     */
    private getLoadingText() {
        if (this.props.loadingText) {
            return this.props.loadingText;
        }
        return stringFormat(PortfolioWebPartsStrings.DataLoadingText, this.props.dataSource.toLowerCase());
    }

    /**
     * Get search box label text
     */
    private getSearchBoxLabelText() {
        if (this.props.searchBoxLabelText) {
            return this.props.searchBoxLabelText;
        }
        return stringFormat(PortfolioWebPartsStrings.SearchBoxLabelText, this.props.dataSource.toLowerCase());
    }

    /**
     * On search
     * 
     * Makes the search term lower case and sets state
     * 
     * @param {string} searchTerm Search term
     */
    private onSearch = (searchTerm: string) => {
        this.setState({ searchTerm: searchTerm.toLowerCase() });
    }

    /**
     * On render item column
     * 
     * @param {any} item Item
     * @param {number} index Index
     * @param {IColumn} column Column
     */
    private onRenderItemColumn = (item: any, index: number, column: IColumn) => {
        const fieldNameDisplay: string = getObjectValue(column, 'data.fieldNameDisplay', undefined);
        return column.onRender ? column.onRender(item, index, column) : getObjectValue(item, fieldNameDisplay || column.fieldName, null);
    }

    /**
     * Sorting on column header click
     *
     * @param {React.MouseEvent} _evt Event
     * @param {IColumn} column Column
     */
    private onColumnHeaderSort = (_evt: React.MouseEvent<any>, column: IColumn): void => {
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
                name: PortfolioWebPartsStrings.NoGroupingText,
                minWidth: 0,
            };
            const subItems = [noGrouping, ...this.props.groupByColumns].map(item => ({
                key: item.key,
                name: item.name,
                onClick: () => this.setState({ groupBy: item }),
            }));
            items.push({
                key: 'Group',
                name: getObjectValue(this.state, 'groupBy.name', undefined) || PortfolioWebPartsStrings.NoGroupingText,
                iconProps: { iconName: 'GroupedList' },
                itemType: ContextualMenuItemType.Header,
                onClick: event => event.preventDefault(),
                subMenuProps: { items: subItems },
            });
        }
        if (this.props.excelExportConfig) {
            items.push({
                key: "ExcelExport",
                name: PortfolioWebPartsStrings.ExcelExportButtonLabel,
                iconProps: {
                    iconName: 'ExcelDocument',
                    styles: { root: { color: "green !important" } },
                },
                disabled: this.state.isExporting,
                onClick: event => { this.exportToExcel(event); }
            });
        }

        return items;
    }

    /**
     * Get groups
     * 
     * @param {any[]} items Items
     * @param {IColumn} groupBy Group by
     */
    private getGroups(items: any[], groupBy: IColumn): IGroup[] {
        let groups: IGroup[] = null;
        if (groupBy && groupBy.key !== 'NoGrouping') {
            const itemsSortedByGroupBy = items.sort((a, b) => getObjectValue(a, groupBy.key, null) > getObjectValue(b, groupBy.key, null) ? -1 : 1);
            const groupNames: string[] = itemsSortedByGroupBy.map(g => getObjectValue(g, groupBy.key, null));
            groups = groupNames
                .filter((value, index, self) => self.indexOf(value) === index)
                .map((name, idx) => ({
                    key: `Group_${idx}`,
                    name: `${groupBy.name}: ${name}`,
                    startIndex: groupNames.indexOf(name, 0),
                    count: groupNames.filter(n => n === name).length,
                    isCollapsed: false,
                    isShowingAll: true,
                    isDropEnabled: false,
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
        return { items, columns, groups: this.getGroups(items, groupBy) };
    }

    /**
     * Export to Excel
     */
    private exportToExcel = async (event: React.MouseEvent<any> | React.KeyboardEvent<any>): Promise<void> => {
        event.preventDefault();
        const { sheetName, fileNamePrefix } = this.props.excelExportConfig;
        this.setState({ isExporting: true });
        const sheets = [];
        let { items, columns } = this.getFilteredData();
        let _columns = columns.filter(column => column.name);
        sheets.push({
            name: sheetName,
            data: [
                _columns.map(column => column.name),
                ...items.map(item => _columns.map(column => getObjectValue<string>(item, column.fieldName, null))),
            ],
        });
        const fileName = stringFormat("{0}-{1}.xlsx", fileNamePrefix, moment(new Date().toISOString()).format('YYYY-MM-DD-HH-mm'));
        //console.log(fileName);
        // await ExportToExcel({ sheets: [sheet], fileName });
        this.setState({ isExporting: false });
    }

    /**
     * Fetch items
     */
    private async fetchItems(): Promise<any[]> {
        let { pageContext, queryTemplate, dataSource, selectProperties, columns, postFetch } = this.props;
        try {
            if (!queryTemplate) {
                const { siteId, hubSiteId } = pageContext.legacyPageContext;
                let web = sp.web;
                if (siteId.indexOf(hubSiteId) === -1) {
                    web = (await HubSiteService.GetHubSite(sp, pageContext)).web;
                }
                const { QueryTemplate } = await new DataSourceService(web).getByName(dataSource);
                if (QueryTemplate) {
                    queryTemplate = QueryTemplate;
                } else {
                    throw stringFormat(PortfolioWebPartsStrings.DataSourceNotFound, dataSource);
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
            throw stringFormat(PortfolioWebPartsStrings.DataSourceError, dataSource);
        }
    }
}
