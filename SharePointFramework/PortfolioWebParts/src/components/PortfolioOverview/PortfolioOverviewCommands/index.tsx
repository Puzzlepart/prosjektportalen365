import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import { getObjectValue } from 'shared/lib/helpers/getObjectValue';
import { ExcelExportService } from 'shared/lib/services';
import { redirect } from 'shared/lib/util';
import { FilterPanel, IFilterProps } from '../../';
import { IPortfolioOverviewCommandsProps } from './IPortfolioOverviewCommandsProps';
import { IPortfolioOverviewCommandsState } from './IPortfolioOverviewCommandsState';
import { isNull } from 'shared/lib/helpers/isNull';


export class PortfolioOverviewCommands extends React.Component<IPortfolioOverviewCommandsProps, IPortfolioOverviewCommandsState> {
    constructor(props: IPortfolioOverviewCommandsProps) {
        super(props);
        this.state = { showFilterPanel: false };
    }

    public render() {
        return (
            <div className={this.props.className} hidden={this.props.hidden}>
                <CommandBar items={this.items} farItems={this.farItems} />
                <FilterPanel
                    isOpen={this.state.showFilterPanel}
                    hasCloseButton={true}
                    filters={this.filters}
                    isLightDismiss={true}
                    onDismiss={_ => this.setState({ showFilterPanel: false })}
                    onFilterChange={this.props.onFilterChange} />
            </div>
        );
    }

    protected get items(): IContextualMenuItem[] {
        return [
            {
                key: 'GroupBy',
                name: getObjectValue<string>(this.props, 'groupBy.name', strings.NoGroupingText),
                iconProps: { iconName: 'GroupedList' },
                itemType: ContextualMenuItemType.Header,
                data: { isVisible: this.props.showGroupBy },
                subMenuProps: {
                    items: [
                        {
                            key: 'NoGrouping',
                            name: strings.NoGroupingText,
                            canCheck: true,
                            checked: isNull(this.props.groupBy),
                            onClick: _ => this.props.onGroupBy(null),
                        },
                        {
                            key: 'divider_0',
                            itemType: ContextualMenuItemType.Divider,
                        },
                        ...this.props.configuration.columns
                            .filter(col => col.isGroupable)
                            .map((col, idx) => ({
                                key: `${idx}`,
                                name: col.name,
                                canCheck: true,
                                checked: getObjectValue<string>(this.state, 'groupBy.fieldName', '') === col.fieldName,
                                onClick: _ => this.props.onGroupBy(col),
                            })) as IContextualMenuItem[],
                    ],
                },
            } as IContextualMenuItem,
            {
                key: "ExcelExport",
                name: strings.ExcelExportButtonLabel,
                iconProps: {
                    iconName: 'ExcelDocument',
                    styles: { root: { color: "green !important" } },
                },
                data: { isVisible: this.props.showExcelExportButton },
                disabled: this.state.isExporting,
                onClick: _ => { this.exportToExcel(); },
            } as IContextualMenuItem,
        ].filter(i => i.data.isVisible);
    }

    protected get farItems(): IContextualMenuItem[] {
        return [
            {
                key: 'NewView',
                name: strings.NewViewText,
                iconProps: { iconName: 'CirclePlus' },
                data: { isVisible: this.props.pageContext.legacyPageContext.isSiteAdmin && this.props.showViewSelector },
                onClick: _ => redirect(this.props.configuration.viewNewFormUrl),
            } as IContextualMenuItem,
            {
                key: 'View',
                name: this.props.currentView.title,
                iconProps: { iconName: 'List' },
                itemType: ContextualMenuItemType.Header,
                data: { isVisible: this.props.pageContext.legacyPageContext.isSiteAdmin && this.props.showViewSelector },
                subMenuProps: {
                    items: [
                        {
                            key: 'List',
                            name: 'Liste',
                            iconProps: { iconName: 'List' },
                            canCheck: true,
                            checked: !this.props.isCompact,
                            onClick: _ => this.props.onSetCompact(false),
                        },
                        {
                            key: 'CompactList',
                            name: 'Kompakt liste',
                            iconProps: { iconName: 'AlignLeft' },
                            canCheck: true,
                            checked: this.props.isCompact,
                            onClick: _ => this.props.onSetCompact(true),
                        },
                        {
                            key: 'divider_0',
                            itemType: ContextualMenuItemType.Divider,
                        },
                        ...this.props.configuration.views.map(view => ({
                            key: `${view.id}`,
                            name: view.title,
                            iconProps: { iconName: view.iconName },
                            canCheck: true,
                            checked: view.id === this.props.currentView.id,
                            onClick: _ => this.props.onChangeView(view),
                        } as IContextualMenuItem)),
                        {
                            key: 'divider_1',
                            itemType: ContextualMenuItemType.Divider,
                        },
                        {
                            key: 'SaveViewAs',
                            name: strings.SaveViewAsText,
                            disabled: true,
                        },
                        {
                            key: 'EditView',
                            name: strings.EditViewText,
                            onClick: _ => redirect(`${this.props.configuration.viewEditFormUrl}?ID=${this.props.currentView.id}`),
                        }
                    ],
                },
            } as IContextualMenuItem,
            {
                key: 'Filters',
                name: '',
                iconProps: { iconName: 'Filter' },
                itemType: ContextualMenuItemType.Normal,
                canCheck: true,
                checked: this.state.showFilterPanel,
                data: { isVisible: this.props.showFilters },
                onClick: _ => this.setState(prevState => ({ showFilterPanel: !prevState.showFilterPanel })),
            } as IContextualMenuItem,
        ].filter(i => i.data.isVisible);
    }

    protected get filters(): IFilterProps[] {
        return [
            {
                column: {
                    key: 'SelectedColumns',
                    fieldName: 'SelectedColumns',
                    name: strings.SelectedColumnsLabel,
                    minWidth: 0,
                },
                items: this.props.configuration.columns.map(col => ({
                    name: col.name,
                    value: col.fieldName,
                    selected: this.props.fltColumns.indexOf(col) !== -1,
                })),
                defaultCollapsed: true,
            },
            ...this.props.filters,
        ] as IFilterProps[];
    }

    /**
     * Export to Excel
     */
    protected async exportToExcel(): Promise<void> {
        this.setState({ isExporting: true });
        try {
            await ExcelExportService.export(this.props.title, this.props.fltItems, this.props.fltColumns);
            this.setState({ isExporting: false });
        } catch (error) {
            this.setState({ isExporting: false });
        }
    }
}
