import { ChartData, DataField } from './';
import { ISPDataSource, ISPChartConfiguration } from 'interfaces';
import * as objectAssign from 'object-assign';

export const CHARTCONFIGBASE_CONTENTTYPEID = '0x0100FAC6DE5CA35FAB46ABCF3CD575663D9D';
export const CHART_TYPES = ['bar', 'column', 'pie'];

export class ChartConfiguration {
    public item: ISPChartConfiguration;
    public searchQuery: ISPDataSource;
    public fields: DataField[];
    public type: string;
    public width: { [key: string]: number };

    constructor(item: ISPChartConfiguration, fields: DataField[]) {
        this.item = item;
        this.fields = fields;
        this.initType(item.ContentTypeId);
        this.initWidth(item);
    }

    public clone(): ChartConfiguration {
        return objectAssign(Object.create(this), this);
    }

    /**
     * Initialize chart type from content type id
     * 
     * @param {string} contentTypeId Content type id
     */
    protected initType(contentTypeId: string) {
        const typeIndex = parseInt(contentTypeId.replace(CHARTCONFIGBASE_CONTENTTYPEID, '').substring(0, 2), 10) - 1;
        this.type = CHART_TYPES[typeIndex];
    }

    /**
     * Initialize width properties
     * 
     * @param {ISPChartConfiguration} item Item
     */
    protected initWidth(item: ISPChartConfiguration) {
        this.width = {
            sm: item.GtPiWidthSm,
            md: item.GtPiWidthMd,
            lg: item.GtPiWidthLg,
            xl: item.GtPiWidthXl,
            xxl: item.GtPiWidthXxl,
            xxxl: item.GtPiWidthXxxl,
        };
    }

    /**
     * Get base config
     */
    private getBaseConfig() {
        let base: any = {};
        base.chart = { type: this.type };
        base.title = { text: this.item.Title };
        base.subtitle = { text: this.item.GtPiSubTitle };
        base.tooltip = { valueSuffix: '' };
        base.credits = { enabled: false };
        return base;
    }

    /**
     * Generate chart series
     * 
     * @param {string} type Type
     * @param {ChartData} data Data
     */
    public generateSeries(type: string, data: ChartData) {
        switch (type) {
            case 'column': {
                return this.fields.map(sf => {
                    const values = data.getValues(sf);
                    return { name: sf.title, data: values };
                });
            }
            case 'bar': {
                if (this.fields.length === 1) {
                    const [field] = this.fields;
                    switch (field.type) {
                        case 'Text': {
                            const stringValues = data.getValuesUnique(field);
                            const _data = stringValues.map(value => data.getItemsWithStringValue(field, value).length);
                            return [{ name: field.title, data: _data }];
                        }
                    }
                }
                return this.fields.map(sf => {
                    const values = data.getValues(sf);
                    return { name: sf.title, data: values };
                });
            }
            case 'pie': {
                let _data: any[];
                if (this.fields.length === 1) {
                    const [field] = this.fields;
                    switch (field.type) {
                        case 'Number': {
                            _data = data.getItems(field).map((i, index) => {
                                const y = data.getPercentage(field, index);
                                return { name: i.name, y };
                            });
                        }
                            break;
                        case 'Text': {
                            _data = data.getValuesUnique(field).map(value => {
                                const itemsMatch = data.getItemsWithStringValue(field, value);
                                const name = value || 'N/A';
                                const y = (itemsMatch.length / data.getCount()) * 100;
                                return { name, y };
                            });
                        }
                            break;
                    }
                } else {
                    _data = this.fields.map(sf => {
                        const y = data.getAverage(sf);
                        return { name: sf.title, y };
                    });
                }
                return [{ type: 'pie', colorByPoint: true, data: _data }];
            }
            default: {
                throw null;
            }
        }
    }

    /**
     * Generate HighChart chart config
     * 
     * @param {ChartData} data Chart data
     */
    public generateHighChartConfig(data: ChartData) {
        try {
            let chartConfig: any = {
                ...this.getBaseConfig(),
            };
            switch (this.type) {
                case 'bar': {
                    chartConfig.series = this.generateSeries(this.type, data);
                    chartConfig.xAxis = this.getXAxis(data);
                    chartConfig.yAxis = this.getYAxis();
                    chartConfig.legend = this.getLegend();
                    chartConfig.plotOptions = { bar: { dataLabels: { enabled: true } } };
                    break;
                }
                case 'column': {
                    chartConfig.series = this.generateSeries(this.type, data);
                    chartConfig.xAxis = this.getXAxis(data);
                    chartConfig.yAxis = this.getYAxis();
                    chartConfig.legend = this.getLegend();
                    chartConfig.plotOptions = { series: { stacking: false } };
                    break;
                }
                case 'pie': {
                    chartConfig.series = this.generateSeries(this.type, data);
                    chartConfig.plotOptions = {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b>: {point.percentage: .1f} %',
                                style: { color: 'black' },
                            },
                        },
                    };
                    chartConfig.tooltip = { pointFormat: '<b>{point.percentage: .1f}%</b>' };
                }
                    break;
            }
            return chartConfig;
        } catch (errText) {
            throw `<b>${this.item.Title}:</b> ${errText}`;
        }
    }

    /**
     * Get Y axis
     */
    protected getYAxis() {
        let yAxis: any = {
            title: { text: '', align: 'high' },
            labels: { overflow: 'justify' },
        };
        // if (this.yAxisMin) {
        //     yAxis.min = this.yAxisMin;
        // }
        // if (this.yAxisMax) {
        //     yAxis.max = this.yAxisMax;
        // }
        // if (this.yAxisTickInterval) {
        //     yAxis.tickInterval = this.yAxisTickInterval;
        // }
        return yAxis;
    }

    /**
     * Get X axis based on type
     * 
     * @param {ChartData} data Data
     */
    protected getXAxis(data: ChartData) {
        let categories = data.getNames();
        if (this.fields.length === 1) {
            categories = data.getNames(this.fields[0]);
        }
        switch (this.type) {
            case 'bar': {
                if (this.fields.length === 1) {
                    const [field] = this.fields;
                    switch (field.type) {
                        case 'Text': {
                            categories = data.getValuesUnique(field);
                        }
                            break;
                    }
                }
                return { categories, title: { text: '' } };
            }
            default: {
                return { categories, title: { text: '' } };
            }
        }
    }

    /**
     * Get legend
     */
    protected getLegend() {
        switch (this.type) {
            case 'bar': {
                return { layout: 'vertical' };
            }
            case 'column': {
                return { reversed: true };
            }
        }
    }
}
