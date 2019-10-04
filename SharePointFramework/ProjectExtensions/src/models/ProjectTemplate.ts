import { TypedHash } from '@pnp/common';
import { Web } from '@pnp/sp';
import { getId } from '@uifabric/utilities';
import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Schema } from 'sp-js-provisioning';

export interface IProjectTemplateSPItem {
    File?: { UniqueId: string, Name: string, Title: string, ServerRelativeUrl: string };
    FieldValuesAsText?: TypedHash<string>;
}

export class ProjectTemplate implements IDropdownOption {
    public id: string;
    public key: string;
    public text: string;
    public description: string;
    public serverRelativeUrl: string;

    constructor(spItem: IProjectTemplateSPItem, public web: Web) {
        this.id = spItem.File.UniqueId;
        this.key = getId(`projecttemplate_${this.id}`);
        this.text = spItem.File.Title;
        this.description = spItem.FieldValuesAsText.GtDescription;
        this.serverRelativeUrl = spItem.File.ServerRelativeUrl;
    }

    public async getSchema(): Promise<Schema> {
        return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON();
    }
}

export class ProjectExtension extends ProjectTemplate {
    constructor(spItem: IProjectTemplateSPItem, web: Web) {
        super(spItem, web);
        this.key = getId(`projectextension_${this.id}`);
    }
}