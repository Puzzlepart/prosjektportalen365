import { sp } from '@pnp/sp';
import { makeUrlAbsolute } from '@Shared/helpers';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as PortfolioOverviewWebPartStrings from 'PortfolioOverviewWebPartStrings';
import IPortfolioOverviewConfiguration from './IPortfolioOverviewConfiguration';
import { IPortfolioOverviewColumnSpItem, PortfolioOverviewColumn } from './PortfolioOverviewColumn';
import { IPortfolioOverviewViewSpItem, PortfolioOverviewView } from './PortfolioOverviewView';
import { IProjectColumnConfigSpItem, ProjectColumnConfig, ProjectColumnConfigDictionary } from './ProjectColumnConfig';
import { dateAdd } from "@pnp/common";

/**
 * Get config from lists
 */
export async function getConfig(): Promise<IPortfolioOverviewConfiguration> {
    try {
        const spItems = await Promise.all([
            sp.web.lists.getByTitle(PortfolioOverviewWebPartStrings.ProjectColumnConfigListName).items
                .orderBy('ID', true)
                .usingCaching({
                    key: 'portfolioverview_projectcolumnconfig',
                    storeName: 'local',
                    expiration: dateAdd(new Date(), 'day', 1),
                })
                .get<IProjectColumnConfigSpItem[]>(),
            sp.web.lists.getByTitle(PortfolioOverviewWebPartStrings.ProjectColumnsListName).items
                .orderBy('GtSortOrder', true)
                .usingCaching({
                    key: 'portfolioverview_columns',
                    storeName: 'local',
                    expiration: dateAdd(new Date(), 'day', 1),
                })
                .get<IPortfolioOverviewColumnSpItem[]>(),
            sp.web.lists.getByTitle(PortfolioOverviewWebPartStrings.PortfolioViewsListName).items
                .orderBy('GtSortOrder', true)
                .usingCaching({
                    key: 'portfolioverview_views',
                    storeName: 'local',
                    expiration: dateAdd(new Date(), 'day', 1),
                })
                .get<IPortfolioOverviewViewSpItem[]>(),
            sp.web.lists.getByTitle(PortfolioOverviewWebPartStrings.PortfolioViewsListName)
                .select('DefaultNewFormUrl')
                .expand('DefaultNewFormUrl')
                .usingCaching({
                    key: 'portfolioverview_defaultnewformurl',
                    storeName: 'local',
                    expiration: dateAdd(new Date(), 'day', 1),
                })
                .get<{ DefaultNewFormUrl: string }>(),
        ]);
        const columnConfig = spItems[0].map(c => new ProjectColumnConfig(c));
        const columns = spItems[1].map(c => {
            let column = new PortfolioOverviewColumn(c);
            column.config = columnConfig
                .filter(_c => _c.columnId === c.Id)
                .reduce((obj, { value, color, iconName }) => ({ ...obj, [value]: { color, iconName } }), {}) as ProjectColumnConfigDictionary;
            return column;
        });
        const views = spItems[2].map(c => new PortfolioOverviewView(c, columns));
        const refiners = columns.filter(col => col.isRefinable);
        const config: IPortfolioOverviewConfiguration = {
            columns,
            refiners,
            views,
            viewNewFormUrl: makeUrlAbsolute(spItems[3].DefaultNewFormUrl),
        };
        return config;
    } catch (error) {
        throw {
            message: PortfolioOverviewWebPartStrings.GetConfigErrorMessage,
            type: MessageBarType.error
        };
    }
}

export { IPortfolioOverviewConfiguration, PortfolioOverviewView, PortfolioOverviewColumn };

