/* eslint-disable max-classes-per-file */
/* eslint-disable default-case */
import assign from 'object-assign'
import { ChartData, DataField } from './'

export const CHARTCONFIGBASE_CONTENTTYPEID =
  '0x0100FAC6DE5CA35FAB46ABCF3CD575663D9D'
export const CHART_TYPES = ['bar', 'column', 'pie']

export class SPChartConfigurationItem {
  public ContentTypeId = ''

  public Title = ''

  public GtPiSubTitle = ''

  public GtPiFieldsId: number[] = []

  public GtPiCategoryFieldId = 0

  public GtPiWidthSm = 0

  public GtPiWidthMd = 0

  public GtPiWidthLg = 0

  public GtPiWidthXl = 0

  public GtPiWidthXxl = 0

  public GtPiWidthXxxl = 0
}

export class ChartConfiguration {
  constructor(
    public item: SPChartConfigurationItem,
    public fields: DataField[]
  ) {
    this.item = item
    this.fields = fields
  }

  public clone(): ChartConfiguration {
    return assign(Object.create(this), this)
  }

  public get width(): { [key: string]: number } {
    return {
      sm: this.item.GtPiWidthSm,
      md: this.item.GtPiWidthMd,
      lg: this.item.GtPiWidthLg,
      xl: this.item.GtPiWidthXl,
      xxl: this.item.GtPiWidthXxl,
      xxxl: this.item.GtPiWidthXxxl
    }
  }

  public get type() {
    const typeIndex =
      parseInt(
        this.item.ContentTypeId.replace(
          CHARTCONFIGBASE_CONTENTTYPEID,
          ''
        ).substring(0, 2),
        10
      ) - 1
    return CHART_TYPES[typeIndex]
  }

  /**
   * Get base config
   */
  private _getBaseConfig() {
    const base: any = {}
    base.chart = { type: this.type }
    base.title = { text: this.item.Title }
    base.subtitle = { text: this.item.GtPiSubTitle }
    base.tooltip = { valueSuffix: '' }
    base.credits = { enabled: false }
    return base
  }

  /**
   * Generate chart series
   *
   * @param type Type
   * @param data Data
   */
  public generateSeries(type: string, data: ChartData) {
    switch (type) {
      case 'column': {
        return this.fields.map((sf) => {
          const values = data.getValues(sf)
          return { name: sf.title, data: values }
        })
      }
      case 'bar': {
        if (this.fields.length === 1) {
          const [field] = this.fields
          switch (field.type) {
            case 'text': {
              return [
                {
                  name: field.title,
                  data: data
                    .getValuesUnique(field)
                    .map(
                      (value) =>
                        data.getItemsWithStringValue(field, value).length
                    )
                }
              ]
            }
            case 'tags': {
              return [
                {
                  name: field.title,
                  data: data
                    .getValuesUnique(field)
                    .map(
                      (value) =>
                        data.getItemsWithStringValue(field, value).length
                    )
                }
              ]
            }
          }
        }
        return this.fields.map((sf) => ({
          name: sf.title,
          data: data.getValues(sf)
        }))
      }
      case 'pie': {
        if (this.fields.length === 1) {
          const [field] = this.fields
          switch (field.type) {
            case 'currency':
            case 'number': {
              return [
                {
                  type: 'pie',
                  colorByPoint: true,
                  data: data
                    .getItems(field)
                    .map((i, index) => ({
                      name: i.name,
                      y: data.getPercentage(field, index)
                    }))
                }
              ]
            }
            case 'text': {
              return [
                {
                  type: 'pie',
                  colorByPoint: true,
                  data: data.getValuesUnique(field).map((value) => {
                    const itemsMatch = data.getItemsWithStringValue(
                      field,
                      value
                    )
                    const name = value || 'N/A'
                    const y = (itemsMatch.length / data.getCount()) * 100
                    return { name, y, test: itemsMatch }
                  })
                }
              ]
            }
            case 'tags': {
              return [
                {
                  type: 'pie',
                  colorByPoint: true,
                  data: data.getValuesUnique(field).map((value) => {
                    const itemsMatch = data.getItemsWithStringValue(
                      field,
                      value
                    )
                    const name = value ? value.split(';').join(', ') : 'N/A'
                    const y = (itemsMatch.length / data.getCount()) * 100
                    return { name, y, test: itemsMatch }
                  })
                }
              ]
            }
          }
        } else {
          return [
            {
              type: 'pie',
              colorByPoint: true,
              data: this.fields.map((sf) => ({
                name: sf.title,
                y: data.getAverage(sf)
              }))
            }
          ]
        }
      }
    }
  }

  /**
   * Generate HighChart chart config
   *
   * @param data Chart data
   */
  public generateHighChartConfig(data: ChartData) {
    try {
      const chartConfig: any = this._getBaseConfig()
      switch (this.type) {
        case 'bar': {
          chartConfig.series = this.generateSeries(this.type, data)
          chartConfig.xAxis = this._getXAxis(data)
          chartConfig.yAxis = this._yAxis
          chartConfig.legend = this._legend
          chartConfig.plotOptions = { bar: { dataLabels: { enabled: true } } }
          break
        }
        case 'column': {
          chartConfig.series = this.generateSeries(this.type, data)
          chartConfig.xAxis = this._getXAxis(data)
          chartConfig.yAxis = this._yAxis
          chartConfig.legend = this._legend
          chartConfig.plotOptions = { series: { stacking: false } }
          break
        }
        case 'pie':
          {
            chartConfig.series = this.generateSeries(this.type, data)
            chartConfig.plotOptions = {
              pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                  enabled: true,
                  formatter: function () {
                    return `<b>${
                      this.point.name
                    }</b>: ${this.point.percentage.toFixed(2)} %`
                  },
                  style: { color: 'black' }
                }
              }
            }
            chartConfig.tooltip = {
              pointFormat: '<b>{point.percentage: .1f}%</b>'
            }
          }
          break
      }
      return chartConfig
    } catch (errtext) {
      throw `<b>${this.item.Title}:</b> ${errtext}`
    }
  }

  private get _yAxis() {
    return {
      title: { text: '', align: 'high' },
      labels: { overflow: 'justify' }
    }
  }

  /**
   * Get X axis based on type
   *
   * @param data Data
   */
  private _getXAxis(data: ChartData) {
    let categories = data.getNames()
    if (this.fields.length === 1) {
      categories = data.getNames(this.fields[0])
    }
    switch (this.type) {
      case 'bar': {
        if (this.fields.length === 1) {
          const [field] = this.fields
          switch (field.type) {
            case 'text':
              {
                categories = data.getValuesUnique(field)
              }
              break
          }
        }
        return { categories, title: { text: '' } }
      }
      default: {
        return { categories, title: { text: '' } }
      }
    }
  }

  private get _legend() {
    switch (this.type) {
      case 'bar': {
        return { layout: 'vertical' }
      }
      case 'column': {
        return { reversed: true }
      }
    }
  }
}
