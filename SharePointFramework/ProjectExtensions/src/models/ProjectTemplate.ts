import { TypedHash } from '@pnp/common';
import { Web } from '@pnp/sp';
import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Schema } from 'sp-js-provisioning';

export interface IProjectTemplateSPItem {
    ListContentConfigLookupId?: number[];
    File?: { UniqueId: string, Name: string, Title: string, ServerRelativeUrl: string };
    FieldValuesAsText?: TypedHash<string>;
}

export class ProjectTemplate implements IDropdownOption {
    public id: string;
    public key: string;
    public text: string;
    public description: string;
    public serverRelativeUrl: string;
    public listContentConfigIds: number[];

    constructor(spItem: IProjectTemplateSPItem, public web: Web) {
        this.id = spItem.File.UniqueId;
        this.key = `projecttemplate_${this.id}`;
        this.text = spItem.File.Title;
        this.description = spItem.FieldValuesAsText.GtDescription;
        this.serverRelativeUrl = spItem.File.ServerRelativeUrl;
        this.listContentConfigIds = (spItem.ListContentConfigLookupId && spItem.ListContentConfigLookupId.length > 0) ? spItem.ListContentConfigLookupId : null;
    }

    public async getSchema(): Promise<Schema> {
        return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON();
    }
}

