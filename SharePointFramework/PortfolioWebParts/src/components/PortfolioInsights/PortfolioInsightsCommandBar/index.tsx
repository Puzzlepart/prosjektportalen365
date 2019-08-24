import * as React from 'react';
import styles from './PortfolioInsightsCommandBar.module.scss';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';
import { IPortfolioInsightsCommandBarProps } from './IPortfolioInsightsCommandBarProps';

export default class PortfolioInsightsCommandBar extends React.Component<IPortfolioInsightsCommandBarProps, {}> {
    public render(): React.ReactElement<IPortfolioInsightsCommandBarProps> {
        return (
            <div className={styles.portfolioInsightsCommandBar}>
                <CommandBar items={this._items} farItems={this._farItems} />
            </div>
        );
    }

    private get _items(): ICommandBarItemProps[] {
        return [
            {
                key: 'NewItem',
                name: 'Ny',
                iconProps: { iconName: 'Add' },
                itemType: ContextualMenuItemType.Header,
                subMenuProps: {
                    items: this.props.contentTypes.map(ct => ({
                        key: ct.StringId,
                        name: ct.Name,
                        onClick: () => {
                            document.location.href = `${ct.NewFormUrl}?ContentTypeId=${ct.StringId}&Source=${encodeURIComponent(document.location.href)}`;
                        },
                    })),
                },
            }
        ];
    }

    private get _farItems(): ICommandBarItemProps[] {
        return [
            {
                key: 'View',
                name: this.props.currentView.title,
                iconProps: { iconName: 'List' },
                itemType: ContextualMenuItemType.Header,
                subMenuProps: {
                    items: this.props.configuration.views.map(view => ({
                        key: `${view.id}`,
                        name: view.title,
                        iconProps: { iconName: view.iconName },
                        onClick: _ => { this.props.onViewChanged(view); }
                    })),
                },
            },
        ];
    }
}
