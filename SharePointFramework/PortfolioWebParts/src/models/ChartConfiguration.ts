import { ChartData, DataField } from './';
import * as objectAssign from 'object-assign';
import { SPChartConfigurationItem } from 'data';

export const CHARTCONFIGBASE_CONTENTTYPEID = '0x0100FAC6DE5CA35FAB46ABCF3CD575663D9D';
export const CHART_TYPES = ['bar', 'column', 'pie'];

export class ChartConfiguration {
    constructor(public item: SPChartConfigurationItem, public fields: DataField[]) {
        this.item = item;
        this.fields = fields;
    }

    public clone(): ChartConfiguration {
        return objectAssign(Object.create(this), this);
    }


    protected get type() {
        const typeIndex = parseInt(this.item.ContentTypeId.replace(CHARTCONFIGBASE_CONTENTTYPEID, '').substring(0, 2), 10) - 1;
        return CHART_TYPES[typeIndex];
    }

    protected get width(): { [key: string]: number } {
        return {
            sm: this.item.GtPiWidthSm,
            md: this.item.GtPiWidthMd,
            lg: this.item.GtPiWidthLg,
            xl: this.item.GtPiWidthXl,
            xxl: this.item.GtPiWidthXxl,
            xxxl: this.item.GtPiWidthXxxl,
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
                        case 'text': {
                            return [{
                                name: field.title,
                                data: data.getValuesUnique(field).map(value => data.getItemsWithStringValue(field, value).length),
                            }];
                        }
                        case 'tags': {
                            return [{
                                name: field.title,
                                data: data.getValuesUnique(field).map(value => data.getItemsWithStringValue(field, value).length),
                            }];
                        }
                    }
                }
                return this.fields.map(sf => ({ name: sf.title, data: data.getValues(sf) }));
            }
            case 'pie': {
                if (this.fields.length === 1) {
                    const [field] = this.fields;
                    switch (field.type) {
                        case 'number': {
                            return [{
                                type: 'pie',
                                colorByPoint: true,
                                data: data.getItems(field).map((i, index) => ({ name: i.name, y: data.getPercentage(field, index) })),
                            }];
                        }
                        case 'text': {
                            return [{
                                type: 'pie',
                                colorByPoint: true,
                                data: data.getValuesUnique(field).map(value => {
                                    const itemsMatch = data.getItemsWithStringValue(field, value);
                                    const name = value || 'N/A';
                                    const y = (itemsMatch.length / data.getCount()) * 100;
                                    return { name, y };
                                }),
                            }];
                        }
                        case 'tags': {
                            return [{
                                type: 'pie',
                                colorByPoint: true,
                                data: data.getValuesUnique(field).map(value => {
                                    const itemsMatch = data.getItemsWithStringValue(field, value);
                                    const name = value ? value.split(';').join(', ') : 'N/A';
                                    const y = (itemsMatch.length / data.getCount()) * 100;
                                    return { name, y };
                                }),
                            }];
                        }
                    }
                } else {
                    return [{
                        type: 'pie',
                        colorByPoint: true,
                        data: this.fields.map(sf => ({ name: sf.title, y: data.getAverage(sf) })),
                    }];
                }
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
        } catch (errtext) {
            throw `<b>${this.item.Title}:</b> ${errtext}`;
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
                        case 'text': {
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
