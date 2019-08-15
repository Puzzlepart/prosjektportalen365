import { DataFieldType } from 'types';

export class DataField {
    /**
     * Constructor
     * 
     * @param {string} title Title
     * @param {string} fieldName Field name
     * @param {DataFieldType} type Data field type
     */
    constructor(
        public title: string,
        public fieldName: string,
        public type: DataFieldType,
    ) {
        this.title = title;
        this.fieldName = fieldName;
        this.type = type;
    }
}
