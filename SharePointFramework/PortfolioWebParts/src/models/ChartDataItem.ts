import { DataField } from './DataField';

export class ChartDataItem {
    public name: string;
    public data: { [key: string]: any };

    /**
     * Constructor
     *
     * @param {string} name Name
     * @param {Object} data Data
     */
    constructor(name: string, data: { [key: string]: any }) {
        this.name = name;
        this.data = data;
    }

    /**
     * Checks if there's a value for the data field
     *
     * @param {DataField} field Field
     */
    public hasValue(field: DataField): boolean {
        return this._getRawValue(field) != null;
    }

    /**
     * Get value for data field
     *
     * @param {DataField} field Field
     */
    public getValue(field: DataField) {
        const rawValue = this._getRawValue(field);
        switch (field.type) {
            case 'percentage': {
                if (this.hasValue(field)) {
                    return Math.floor((parseFloat(rawValue) * 100));
                }
                return 0;
            }
            case 'currency': case 'number': {
                if (this.hasValue(field)) {
                    return parseInt(rawValue, 10);
                }
                return 0;
            }
            case 'text': {
                if (this.hasValue(field)) {
                    if (field.fieldName.indexOf('OWSUSER') !== -1 && typeof rawValue === 'string' && rawValue.indexOf(' | ') !== -1) {
                        return rawValue.split(' | ')[1];
                    }
                    return rawValue;
                }
                return null;
            }
            default: {
                return rawValue;
            }
        }
    }

    /**
     * Get raw value for data field
     *
     * @param {DataField} field Field
     */
    protected _getRawValue(field: DataField): any {
        const rawValue = this.data[field.fieldName];
        return rawValue;
    }
}
