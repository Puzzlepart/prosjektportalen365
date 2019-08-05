import { Web, Folder, FileAddResult } from '@pnp/sp';
import { formatDate } from '@Shared/helpers';

export class TemplateFile {
    public id: string;
    public name: string;
    public title: string;
    public newName: string;
    public newTitle: string;
    public serverRelativeUrl: string;
    public modified: string;

    constructor(spItem: any, public web: Web) {
        this.id = spItem.File.UniqueId;
        this.name = spItem.File.Name;
        this.title = spItem.File.Title;
        this.newName = this.name;
        this.newTitle = this.title;
        this.serverRelativeUrl = spItem.File.ServerRelativeUrl;
        this.modified = formatDate(spItem.File.TimeLastModified);
    }

    /**
     * Copy to
     * 
     * @param {Folder} folder Folder
     * @returns true if the operation is successful
     */
    public async copyTo(folder: Folder): Promise<FileAddResult> {
        try {
            const content = await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getBlob();
            const fileAddResult = await folder.files.addChunked(this.newName, content);
            await (await fileAddResult.file.getItem()).update({ Title: this.newTitle });
            return fileAddResult;
        } catch (error) {
            throw error;
        }
    }
}