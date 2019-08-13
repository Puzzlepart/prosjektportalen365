import { dateAdd } from "@pnp/common";
import { sp } from '@pnp/sp';
import * as PortfolioInsightsWebPartStrings from 'PortfolioInsightsWebPartStrings';
import { IPortfolioOverviewConfiguration, PortfolioOverviewView } from 'webparts/portfolioOverview/config';
import * as portfolioOverviewData from '../../portfolioOverview/data';
import { ISPChartConfiguration } from '../interfaces/ISPChartConfiguration';
import { ISPColumnConfiguration } from '../interfaces/ISPColumnConfiguration';
import { ChartConfiguration, ChartData, ChartDataItem, DataField } from '../models';
import { DataFieldType } from '../models/DataField';

/**
 * Fetch data
 * 
 * @param {string} siteId Site id
 * @param {PortfolioOverviewView} view View
 * @param {IPortfolioOverviewConfiguration} configuration Configuration
 */
export async function fetchData(siteId: string, view: PortfolioOverviewView, configuration: IPortfolioOverviewConfiguration) {
    try {
        const [chartItems, columnConfigItems, contentTypes] = await Promise.all([
            sp.web.lists.getByTitle(PortfolioInsightsWebPartStrings.SPChartConfigurationList).items
                .select(
                    'ContentTypeId',
                    'Title',
                    'GtPiSubTitle',
                    'GtPiDataSourceLookup/Id',
                    'GtPiDataSourceLookup/GtSearchQuery',
                    'GtPiFieldsId',
                    'GtPiCategoryFieldId',
                    'GtPiWidthSm',
                    'GtPiWidthMd',
                    'GtPiWidthLg',
                    'GtPiWidthXl',
                    'GtPiWidthXxl',
                    'GtPiWidthXxxl',
                )
                .expand('GtPiDataSourceLookup')
                .get<ISPChartConfiguration[]>(),
            sp.web.lists.getByTitle(PortfolioInsightsWebPartStrings.SPColumnConfigurationList).items
                .select(
                    'Id',
                    'Title',
                    'GtManagedProperty',
                    'GtFieldDataType',
                )
                .usingCaching({
                    key: 'portfolioinsights_columns',
                    storeName: 'local',
                    expiration: dateAdd(new Date(), 'hour', 1),
                })
                .get<ISPColumnConfiguration[]>(),
            sp.web.lists.getByTitle(PortfolioInsightsWebPartStrings.SPChartConfigurationList).contentTypes
                .select(
                    'StringId',
                    'Name',
                    'NewFormUrl',
                )
                .usingCaching({
                    key: 'portfolioinsights_contenttypes',
                    storeName: 'local',
                    expiration: dateAdd(new Date(), 'hour', 1),
                })
                .get<{ StringId: string, Name: string, NewFormUrl: string }[]>(),
        ]);
        let charts: ChartConfiguration[] = chartItems.map(item => {
            let fields = item.GtPiFieldsId.map(id => {
                const [fld] = columnConfigItems.filter(_fld => _fld.Id === id);
                return new DataField(fld.Title, fld.GtManagedProperty, fld.GtFieldDataType as DataFieldType);
            });
            let chart = new ChartConfiguration(item, fields);
            return chart;
        });
        let data = await portfolioOverviewData.fetchData(view, configuration, siteId);
        return {
            charts,
            chartData: new ChartData(data.items.map(item => new ChartDataItem(item.Title, item))),
            contentTypes,
        };
    } catch (error) {
        console.log(error);
        throw PortfolioInsightsWebPartStrings.ErrorText;
    }
}