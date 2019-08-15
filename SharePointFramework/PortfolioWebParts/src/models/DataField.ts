export type DataFieldType =  'Text' | 'Tags' | 'Number' | 'Percentage';

export class DataField {
    /**
       * Constructor
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
