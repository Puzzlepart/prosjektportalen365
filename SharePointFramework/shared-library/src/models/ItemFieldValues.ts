import _ from 'lodash'

export type ItemFieldValue = {
  /**
   * The value of the field.
   */
  value: any

  /**
   * The value of the field as text.
   */
  valueAsText: string
}

type FieldValueFormat = 'object' | 'text' | 'term_text' | 'user_id'

type GetFieldValueOptions<T = any> = {
  /**
   * Default value to return if the field value is not set.
   */
  defaultValue?: T

  /**
   * Format to return the value in. If `object` is used the
   * type `ItemFieldValue` is returned and can be used as
   * generic type `T`.
   */
  format?: FieldValueFormat
}

type ItemFieldValuesData = {
  fieldValues: Record<string, any>
  fieldValuesAsText: Record<string, string>
}

export class ItemFieldValues {
  protected _values: Map<string, ItemFieldValue>

  constructor(
    private _fieldValues: Record<string, any>,
    private _fieldValuesAsText: Record<string, string>
  ) {
    this._setValues()
  }

  /**
   * Check if the given key should be omitted from the field values.
   *
   * @param key Key to check
   */
  protected _shouldOmitKey(key: string): boolean {
    return key.toLowerCase().startsWith('odata')
  }

  /**
   * Set internal _values property based on field values and field values as text.
   */
  protected _setValues() {
    this._values = Object.keys(this._fieldValues).reduce((map, key) => {
      if (this._shouldOmitKey(key)) return map
      const value = this._fieldValues[key]
      const valueAsText = this._fieldValuesAsText[key]
      map.set(key, { value, valueAsText })
      return new Map(map)
    }, new Map<string, ItemFieldValue>())
  }

  /**
   * Get field value in the specified format.
   *
   * @param fieldName Field name
   * @param format Format to return the value in
   * @param defaultValue Default value to return if the field value is not set
   */
  private _getValueInFormat<T = any>(
    fieldName: string,
    format: FieldValueFormat,
    defaultValue: T = null
  ): T {
    const { value, valueAsText } = this._values.get(fieldName)
    switch (format) {
      case 'text':
        return valueAsText as unknown as T
      case 'object':
        return this._values.get(fieldName) as unknown as T
      case 'term_text': {
        if (_.isArray(value)) {
          return value
            .map(({ TermGuid, Label, WssId = -1 }) => `${WssId};#${Label}|${TermGuid}`)
            .join(';#') as unknown as T
        } else {
          const { TermGuid, Label, WssId = -1 } = value
          return `${WssId};#${Label}|${TermGuid}` as unknown as T
        }
      }
      case 'user_id': {
        const test = this._values.get(`${fieldName}Id`)
        // eslint-disable-next-line no-console
        console.log(test)
        // eslint-disable-next-line no-console
        // console.log(this._values.get(`${fieldName}Id`))
        // if (!userIdValue) return defaultValue
        // // eslint-disable-next-line no-console
        // console.log('userIdValue', userIdValue)
        return defaultValue
      }
    }
  }

  /**
   * Get field value for the given field name. Optionally return as text.
   *
   * @param fieldName Field name
   * @param options Options (`format`, `defaultValue`)
   */
  public get<T = any>(fieldName: string, options: GetFieldValueOptions<T> = {}): T {
    const { defaultValue = null, format = null } = options
    if (!this._values.has(fieldName) && !this._values.has(`${fieldName}Id`)) {
      if (format === 'object') return (defaultValue ?? {}) as unknown as T
      return defaultValue
    }
    if (format) return this._getValueInFormat(fieldName, format, options.defaultValue)
    return this._values.get(fieldName) as unknown as T
  }

  /**
   * Create an instance of `ItemFieldValues`.
   *
   * @param data Data to create the instance from (`fieldValues`, `fieldValuesAsText`)
   *
   * @returns an instance of `ItemFieldValues`
   */
  public static create(data: ItemFieldValuesData) {
    return new ItemFieldValues(data.fieldValues, data.fieldValuesAsText)
  }
}
