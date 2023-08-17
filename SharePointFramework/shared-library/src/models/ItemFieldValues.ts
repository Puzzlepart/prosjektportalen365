type ItemFieldValue = {
    value: any
    valueAsText: string
}

export class ItemFieldValues {
    private _values: Map<string, ItemFieldValue>

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
    private _shouldOmitKey(key: string): boolean {
        return key.toLowerCase().startsWith('odata')
    }

    /**
     * Set internal _values property based on field values and field values as text.
     */
    private _setValues() {
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
     * @param asText Return value as text
     * @param defaultValue Default value if field does not exist or is null
     */
    public getValue<T = any>(fieldName: string, asText: boolean = false, defaultValue: T = null): T {
        if (!this._values.has(fieldName)) return defaultValue
        const value = this._values.get(fieldName)
        return ((asText ? value.valueAsText : value.value) ?? defaultValue) as unknown as T
    }
}