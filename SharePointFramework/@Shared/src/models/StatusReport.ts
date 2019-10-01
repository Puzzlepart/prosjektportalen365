export class StatusReport {
    public id: number;
    public created: string;

    /**
     * 
     * @param {any} item SP item
     */
    constructor(item: any) {
        this.id = item.Id;
        this.created = item.Created;
    }

    public url(urlSourceParam: string) {
        return `SitePages/Prosjektstatus.aspx?selectedReport=${this.id}&Source=${encodeURIComponent(urlSourceParam)}`;
    }
}