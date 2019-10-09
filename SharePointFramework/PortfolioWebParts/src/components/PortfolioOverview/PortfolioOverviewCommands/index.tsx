import { isArray } from '@pnp/common';
import { getId } from '@uifabric/utilities';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import ExcelExportService from 'shared/lib/services/ExcelExportService';
import { redirect } from 'shared/lib/util';
import { FilterPanel, IFilterProps } from '../../FilterPanel';
import { IPortfolioOverviewCommandsProps } from './IPortfolioOverviewCommandsProps';
import { IPortfolioOverviewCommandsState } from './IPortfolioOverviewCommandsState';

export class PortfolioOverviewCommands extends React.Component<IPortfolioOverviewCommandsProps, IPortfolioOverviewCommandsState> {
    constructor(props: IPortfolioOverviewCommandsProps) {
        super(props);
        this.state = { showFilterPanel: false };
    }

    public render() {
        return (
            <div className={this.props.className} hidden={this.props.hidden}>
                <CommandBar items={this._items} farItems={this._farItems} />
                <FilterPanel
                    isOpen={this.state.showFilterPanel}
                    layerHostId={this.props.layerHostId}
                    headerText={strings.FiltersString}
                    hasCloseButton={false}
                    isLightDismiss={false}
                    filters={this._filters}
                    onFilterChange={this.props.events.onFilterChange} />
            </div>
        );
    }

    protected get _items(): IContextualMenuItem[] {
        return [
            {
                id: getId('ExcelExport'),
                key: getId('ExcelExport'),
                name: strings.ExcelExportButtonLabel,
                iconProps: {
                    iconName: 'ExcelDocument',
                    styles: { root: { color: 'green !important' } },
                },
                data: { isVisible: this.props.showExcelExportButton },
                disabled: this.state.isExporting,
                onClick: this._exportToExcel.bind(this),
            } as IContextualMenuItem,
        ].filter(i => i.data.isVisible);
    }

    protected get _farItems(): IContextualMenuItem[] {
        return [
            {
                id: getId('NewView'),
                key: getId('NewView'),
                name: strings.NewViewText,
                iconProps: { iconName: 'CirclePlus' },
                data: { isVisible: this.props.pageContext.legacyPageContext.isSiteAdmin && this.props.showViewSelector },
                onClick: _ => redirect(this.props.configuration.viewsUrls.defaultNewFormUrl),
            } as IContextualMenuItem,
            {
                id: getId('View'),
                key: getId('View'),
                name: this.props.currentView.title,
                iconProps: { iconName: 'List' },
                itemType: ContextualMenuItemType.Header,
                data: { isVisible: this.props.pageContext.legacyPageContext.isSiteAdmin && this.props.showViewSelector },
                subMenuProps: {
                    items: [
                        {
                            id: getId('List'),
                            key: getId('List'),
                            name: 'Liste',
                            iconProps: { iconName: 'List' },
                            canCheck: true,
                            checked: !this.props.isCompact,
                            onClick: _ => this.props.events.onSetCompact(false),
                        },
                        {
                            id: getId('CompactList'),
                            key: getId('CompactList'),
                            name: 'Kompakt liste',
                            iconProps: { iconName: 'AlignLeft' },
                            canCheck: true,
                            checked: this.props.isCompact,
                            onClick: _ => this.props.events.onSetCompact(true),
                        },
                        {
                            id: getId('Divider'),
                            key: getId('Divider'),
                            itemType: ContextualMenuItemType.Divider,
                        },
                        ...this.props.configuration.views.map(view => ({
                            id: getId(view.id.toString()),
                            key: getId(view.id.toString()),
                            name: view.title,
                            iconProps: { iconName: view.iconName },
                            canCheck: true,
                            checked: view.id === this.props.currentView.id,
                            onClick: _ => this.props.events.onChangeView(view),
                        } as IContextualMenuItem)),
                        {

                            id: getId('Divider'),
                            key: getId('Divider'),
                            itemType: ContextualMenuItemType.Divider,
                        },
                        {
                            id: getId('SaveViewAs'),
                            key: getId('SaveViewAs'),
                            name: strings.SaveViewAsText,
                            disabled: true,
                        },
                        {
                            id: getId('EditView'),
                            key: getId('EditView'),
                            name: strings.EditViewText,
                            onClick: _ => redirect(`${this.props.configuration.viewsUrls.defaultEditFormUrl}?ID=${this.props.currentView.id}`),
                        }
                    ],
                },
            } as IContextualMenuItem,
            {
                id: getId('Filters'),
                key: getId('Filters'),
                name: '',
                iconProps: { iconName: 'Filter' },
                itemType: ContextualMenuItemType.Normal,
                canCheck: true,
                checked: this.state.showFilterPanel,
                data: { isVisible: this.props.showFilters },
                onClick: ev => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    this.setState(prevState => ({ showFilterPanel: !prevState.showFilterPanel }));
                },
            } as IContextualMenuItem,
        ].filter(i => i.data.isVisible);
    }

    protected get _filters(): IFilterProps[] {
        let filters: IFilterProps[] = [
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
        ];
        return filters;
    }

    /**
     * Export to Excel
     */
    protected async _exportToExcel(): Promise<void> {
        this.setState({ isExporting: true });
        try {
            const { fltItems, fltColumns, selectedItems } = this.props;
            let items = (isArray(selectedItems) && selectedItems.length > 0) ? selectedItems : fltItems;
            await ExcelExportService.export(items, fltColumns);
            this.setState({ isExporting: false });
        } catch (error) {
            this.setState({ isExporting: false });
        }
    }
}
