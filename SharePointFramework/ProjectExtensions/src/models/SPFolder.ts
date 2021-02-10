import { Folder } from "@pnp/sp"

export class SPFolder {
    public id: string
    public name: string
    public url: string
    public folders: SPFolder[]

    /**
     * Constructor
     * 
     * @param {any} data Data
     */
    constructor(data: any) {
        this.id = data?.Id || data?.UniqueId
        this.name = data?.Title || data?.Name
        this.url = data?.RootFolder?.ServerRelativeUrl || data?.ServerRelativeUrl
        this.folders = (data?.RootFolder?.Folders || data?.Folders || []).map((f: any) => new SPFolder(f))
    }
}
