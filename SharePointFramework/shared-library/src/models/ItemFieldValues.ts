export type ItemFieldValue = {
  value: any
  valueAsText: string
}

type GetFieldValueOptions<T = any> = {
  asText?: boolean
  asObject?: boolean
  defaultValue?: T
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
   * Get field value for the given field name. Optionally return as text.
   *
   * @param fieldName Field name
   * @param options Options (`asText`, `asObject`, `defaultValue`)
   */
  public get<T = any>(fieldName: string, options: GetFieldValueOptions<T> = {}): T {
    const { asText = false, asObject = false, defaultValue = null } = options
    if (!this._values.has(fieldName)) {
      if (asObject) return {} as unknown as T
      return defaultValue
    }
    if (asObject) return this._values.get(fieldName) as unknown as T
    if (asText) return this._values.get(fieldName).valueAsText as unknown as T
    return this._values.get(fieldName).value as unknown as T
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
