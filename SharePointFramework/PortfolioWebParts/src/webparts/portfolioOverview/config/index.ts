import { sp } from '@pnp/sp';
import IPortfolioOverviewConfiguration from './IPortfolioOverviewConfiguration';
import { PortfolioOverviewView, IPortfolioOverviewViewSpItem } from './PortfolioOverviewView';
import { PortfolioOverviewColumn, IPortfolioOverviewColumnSpItem } from './PortfolioOverviewColumn';

/**
 * Get config from lists
 */
export async function getConfig(): Promise<IPortfolioOverviewConfiguration> {
    const [viewsSpItems, columnsSpItems] = await Promise.all([
        sp.web.lists.getByTitle('Porteføljevisninger').items.orderBy('GtSortOrder', true).get<IPortfolioOverviewViewSpItem[]>(),
        sp.web.lists.getByTitle('Prosjektkolonner').items.orderBy('GtSortOrder', true).get<IPortfolioOverviewColumnSpItem[]>(),
    ]);

    const columns = columnsSpItems.map(c => new PortfolioOverviewColumn(c));
    const views = viewsSpItems.map(c => new PortfolioOverviewView(c, columns));
    const refiners = columns.filter(col => col.isRefinable);

    return { columns, refiners, views };
}

export { IPortfolioOverviewConfiguration, PortfolioOverviewView, PortfolioOverviewColumn };

