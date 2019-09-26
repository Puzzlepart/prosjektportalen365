import { IEntityField } from 'sp-entityportal-service';
export class ProjectPropertyModel {
    public internalName: string;
    public displayName: string;
    public value?: string;
    public description?: string;
    public type?: string;
    public empty?: boolean;
    public required?: any;
    public visible?: boolean;
    /**
     * Creates an instance of ProjectPropertyModel
     *
     * @param {IEntityField} field Field
     * @param {string} value Value
    */
    constructor(field: IEntityField, value: string) {
        this.internalName = field.InternalName;
        this.displayName = field.Title;
        this.value = value;
        this.type = field.TypeAsString;
        this.empty = value === '';
        this.visible = field.SchemaXml.indexOf('ShowInDisplayForm=\'FALSE\'') !== -1;
    }
}
