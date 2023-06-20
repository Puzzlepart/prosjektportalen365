import { DataField } from './DataField'
import { ChartDataItem } from './ChartDataItem'

export class ChartData {
  public includeEmptyValues: boolean
  private _items: ChartDataItem[]

  /**
   * Constructor
   *
   * @param items ITems
   */
  constructor(items: ChartDataItem[]) {
    this._items = items
  }

  /**
   * Get items
   *
   * @param field Field
   */
  public getItems(field?: DataField): ChartDataItem[] {
    if (field) {
      return this._items.filter((item) => (this.includeEmptyValues ? true : item.hasValue(field)))
    }
    return this._items
  }

  /**
   * Get items with non zero value
   *
   * @param field Field
   */
  public getItemsWithNonZeroValue(field: DataField): ChartDataItem[] {
    return this._items.filter((i) => i.getValue(field) !== 0)
  }

  /**
   * Get items with the specified string value
   *
   * @param field Field
   * @param value Value
   */
  public getItemsWithStringValue(field: DataField, value: string): ChartDataItem[] {
    return this.getItems(field).filter((i) => i.getValue(field) === value)
  }

  /**
   * Get item at index
   *
   * @param index Index
   */
  public getItem(index: number): ChartDataItem {
    return this._items[index]
  }

  /**
   * Get count
   *
   * @param field Field
   */
  public getCount(field?: DataField): number {
    return this.getItems(field).length
  }

  public isEmpty(): boolean {
    return this.getCount() === 0
  }

  /**
   * Get average
   *
   * @param field Field
   */
  public getAverage(field?: DataField) {
    return this.getTotal(field) / this.getCount(field)
  }

  /**
   * Get values for the specified field
   *
   * @param field Field
   */
  public getValues(field: DataField) {
    return this._items
      .filter((item) => (this.includeEmptyValues ? true : item.hasValue(field)))
      .map((item) => item.getValue(field))
  }

  /**
   * Get unique values for the specified field
   *
   * @param field Field
   */
  public getValuesUnique(field: DataField): Array<string> {
    return this.getValues(field).filter((value, index, self) => self.indexOf(value) === index)
  }

  /**
   * Get names
   *
   * If field is specified and includeEmptyValues is set to false, it will only return names where the field(s) has value
   *
   * @param field Field(s) to check
   */
  public getNames(...field: Array<DataField>) {
    if (field) {
      return this._items
        .filter((item) => {
          if (this.includeEmptyValues) {
            return true
          }
          if (Array.isArray(field)) {
            return field.filter((f) => item.hasValue(f)).length === field.length
          } else {
            return item.hasValue(field as DataField)
          }
        })
        .map((item) => item.name)
    }
    return this._items.map((item) => item.name)
  }

  /**
   * Get total
   *
   * @param field Field
   */
  public getTotal(field: DataField) {
    return this._items
      .filter((i) => i.hasValue(field))
      .map((i) => i.getValue(field))
      .reduce((prev, curr) => (prev += curr), 0)
  }

  /**
   * Get percentage
   *
   * @param field Field
   * @param index Index
   * @param fractionDigits Number of decimals (defaults to 2)
   */
  public getPercentage(field: DataField, index: number, fractionDigits = 2) {
    return parseFloat(
      ((this._items[index].getValue(field) / this.getTotal(field)) * 100).toFixed(fractionDigits)
    )
  }
}
