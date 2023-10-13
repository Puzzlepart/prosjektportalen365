import _ from 'lodash'

export type ItemFieldValue = {
  /**
   * The value of the field.
   */
  value?: any

  /**
   * The value of the field as text.
   */
  valueAsText?: string
}

type FieldValueFormat = 'object' | 'text' | 'term_text' | 'user_id' | 'date' | 'number'

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
    private _fieldValues: Record<string, any> = {},
    private _fieldValuesAsText: Record<string, string> = {}
  ) {
    this._setValues()
  }

  /**
   * Get the item ID.
   */
  public get id(): number {
    return this._values?.get('Id')?.value ?? null
  }

  /**
   * Get field value keys.
   */
  public get keys() {
    return Array.from(this._values.keys())
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
   * Set internal `_values` property based on field values and field values as text.
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
   * @param fieldValue Field value
   * @param format Format to return the value in
   * @param defaultValue Default value to return if the field value is not set
   */
  private _getValueInFormat<T = any>(
    fieldValue: ItemFieldValue,
    format: FieldValueFormat,
    defaultValue: T = null
  ): T {
    if (!fieldValue.value) return defaultValue
    switch (format) {
      case 'text':
        return fieldValue.valueAsText as unknown as T
      case 'object':
        return fieldValue as unknown as T
      case 'term_text': {
        if (_.isArray(fieldValue.value)) {
          return fieldValue.value
            .map(({ TermGuid, Label, WssId = -1 }) => `${WssId};#${Label}|${TermGuid}`)
            .join(';#') as unknown as T
        } else {
          const { TermGuid, Label, WssId = -1 } = fieldValue.value
          return `${WssId};#${Label}|${TermGuid}` as unknown as T
        }
      }
      case 'user_id': {
        return fieldValue.value as unknown as T
      }
      case 'date': {
        return new Date(fieldValue.value) as unknown as T
      }
      case 'number': {
        return parseFloat(fieldValue.value) as unknown as T
      }
    }
  }

  /**
   * Get field value for the given field name. Optionally return in the
   * specified format.
   *
   * @param fieldName Field name
   * @param options Options (`format`, `defaultValue`)
   */
  public get<T = any>(fieldName: string, options: GetFieldValueOptions<T> = {}): T {
    const { defaultValue = null, format = null } = options
    if (!this._values.has(fieldName)) {
      if (format === 'object') return (defaultValue ?? {}) as unknown as T
      return defaultValue
    }
    const value = this._values.get(fieldName) ?? {}
    if (format) return this._getValueInFormat<T>(value, format, options.defaultValue)
    return value as unknown as T
  }

  /**
   * Updates the field values of the item with the provided properties.
   *
   * @param properties - The properties to update the field values with.
   */
  public update(properties: Record<string, any>) {
    this._fieldValues = { ...this._fieldValues, ...properties }
    this._setValues()
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
