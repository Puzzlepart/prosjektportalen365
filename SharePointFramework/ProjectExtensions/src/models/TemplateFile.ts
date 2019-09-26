import { TypedHash, stringIsNullOrEmpty } from '@pnp/common';
import { FileAddResult, Folder, Web } from '@pnp/sp';
import { formatDate } from 'shared/lib/helpers';

export class TemplateFile {
    /**
     * @todo Describe property
     */
    public id: string;

    /**
     * @todo Describe property
     */
    public name: string;

    /**
     * @todo Describe property
     */
    public title: string;

    /**
     * @todo Describe property
     */
    public newName: string;

    /**
     * @todo Describe property
     */
    public newTitle: string;

    /**
     * @todo Describe property
     */
    public serverRelativeUrl: string;

    /**
     * @todo Describe property
     */
    public modified: string;

    /**
     * @todo Describe property
     */
    public errorMessage: string;

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
     * @param {boolean} shouldOverwrite Should overwrite
     * 
     * @returns true if the operation is successful
     */
    public async copyTo(folder: Folder, shouldOverwrite: boolean = true): Promise<FileAddResult> {
        try {
            const content = await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getBlob();
            const fileAddResult = await folder.files.addChunked(this.newName, content, () => { }, shouldOverwrite);
            await (await fileAddResult.file.getItem()).update({ Title: this.newTitle });
            return fileAddResult;
        } catch (error) {
            throw error;
        }
    }

    /**
    * On input changed
    * 
    * @param {Object} properties Updated properties
    */
    public update(properties: TypedHash<string>) {
        Object.keys(properties).forEach(prop => {
            if (!stringIsNullOrEmpty(properties[prop])) this[prop] = properties[prop];
        });
    }

    public get nameWithoutExtension() {
        return this.name.split('.')[0];
    }

    public get fileExtension() {
        return this.name.split('.')[1];
    }

    public get folderServerRelativeUrl() {
        return this.serverRelativeUrl.replace(this.name, '');
    }
}