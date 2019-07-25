import { sp } from '@pnp/sp';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'PortfolioOverviewWebPartStrings';
import IPortfolioOverviewConfiguration from './IPortfolioOverviewConfiguration';
import { IPortfolioOverviewColumnSpItem, PortfolioOverviewColumn } from './PortfolioOverviewColumn';
import { IPortfolioOverviewViewSpItem, PortfolioOverviewView } from './PortfolioOverviewView';
import { IProjectStatusConfigSpItem, ProjectStatusConfig, ProjectStatusConfigDictionary } from './ProjectStatusConfig';

/**
 * Get config from lists
 */
export async function getConfig(): Promise<IPortfolioOverviewConfiguration> {
    try {
        const spItems = await Promise.all([
            sp.web.lists.getByTitle(strings.ProjectStatusConfigListName).items.orderBy('ID', true).get<IProjectStatusConfigSpItem[]>(),
            sp.web.lists.getByTitle(strings.ProjectColumnsListName).items.orderBy('GtSortOrder', true).get<IPortfolioOverviewColumnSpItem[]>(),
            sp.web.lists.getByTitle(strings.PortfolioViewsListName).items.orderBy('GtSortOrder', true).get<IPortfolioOverviewViewSpItem[]>(),
        ]);
        const statusConfig = spItems[0].map(c => new ProjectStatusConfig(c));
        const columns = spItems[1].map(c => {
            let column = new PortfolioOverviewColumn(c);
            column.statusConfig = statusConfig
                .filter(_c => _c.columnId === c.Id)
                .reduce((obj, _c) => ({ ...obj, [_c.statusValue]: { statusColor: _c.statusColor, statusIconName: _c.statusIconName } }), {}) as ProjectStatusConfigDictionary;
            return column;
        });
        const views = spItems[2].map(c => new PortfolioOverviewView(c, columns));
        const refiners = columns.filter(col => col.isRefinable);
        const config: IPortfolioOverviewConfiguration = { columns, refiners, views };
        return config;
    } catch (error) {
        throw {
            message: strings.GetConfigErrorMessage,
            type: MessageBarType.error
        };
    }
}

export { IPortfolioOverviewConfiguration, PortfolioOverviewView, PortfolioOverviewColumn };

