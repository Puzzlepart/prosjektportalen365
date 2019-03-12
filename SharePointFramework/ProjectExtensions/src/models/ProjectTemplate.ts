import { Schema } from 'sp-js-provisioning';


export class ProjectTemplate {
    public title: string;
    public serverRelativeUrl: string;

    constructor(spFile: any, public web: any) {
        this.title = spFile.Title;
        this.serverRelativeUrl = spFile.ServerRelativeUrl;
    }

    public async getSchema(): Promise<Schema> {
        return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON();
    }
}