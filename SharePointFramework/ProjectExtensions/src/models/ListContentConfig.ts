export class ListContentConfig {
    public title: string;
    public sourceList: string;
    public destinationList: string;
    public destinationLibrary: string;
    public fields: string[];
    public isDefault: boolean;

    constructor(public spItem: any, public web: any) {
        this.title = spItem.Title;
        this.sourceList = spItem.GtLccSourceList;
        this.destinationList = spItem.GtLccDestinationList;
        this.destinationLibrary = spItem.GtLccDestinationLibrary;
        this.fields = spItem.GtLccFields ? spItem.GtLccFields.split(',') : [];
        this.isDefault = spItem.GtLccDefault;
    }
}
