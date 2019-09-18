import { stringIsNullOrEmpty } from '@pnp/common';
import { sp, List, ItemUpdateResult } from '@pnp/sp';
import { ISPList } from 'models/ISPList';
import { makeUrlAbsolute } from 'shared/lib/helpers';
import { SpEntityPortalService } from 'sp-entityportal-service';
import * as _ from 'underscore';
import { IProjectInformationData } from '../components/ProjectInformation/IProjectInformationData';

export interface ISPDataAdapterSettings {
    spEntityPortalService: SpEntityPortalService;
    siteId: string;
    webUrl: string;
}

export default new class SPDataAdapter {
    private _settings: ISPDataAdapterSettings = {
        spEntityPortalService: null,
        siteId: '',
        webUrl: '',
    };

    public configure(settings: ISPDataAdapterSettings) {
        this._settings = settings;
    }
    /**
      * Sync property item from site to associated hub
      * 
      * @param {IProjectInformationData} data Data
      * @param {string[]} skip Property names to skip
      */
    public async syncPropertyItemToHub(data: IProjectInformationData, skipProps: string[] = ['GtSiteId', 'GtGroupId', 'GtSiteUrl']): Promise<ItemUpdateResult> {
        try {
            const fieldToSync = data.fields.filter(fld => fld.InternalName.indexOf('Gt') === 0);
            const properties = _.omit(fieldToSync.reduce((obj, fld) => {
                let fieldValue = data.fieldValuesText[fld.InternalName];
                if (stringIsNullOrEmpty(fieldValue)) return obj;
                switch (fld.TypeAsString) {
                    case 'TaxonomyFieldType': case 'TaxonomyFieldTypeMulti': {
                        let [textField] = data.fields.filter(f => f.Id === fld.TextField);
                        if (textField) {
                            obj[textField.InternalName] = data.fieldValuesText[textField.InternalName];
                        }
                    }
                        break;
                    case 'User': {
                        obj[`${fld.InternalName}Id`] = data.fieldValues[`${fld.InternalName}Id`];
                    }
                        break;
                    case 'DateTime': {
                        obj[fld.InternalName] = new Date(data.fieldValues[fld.InternalName]);
                    }
                        break;
                    case 'Currency': {
                        obj[fld.InternalName] = data.fieldValues[fld.InternalName];
                    }
                        break;
                    default: {
                        obj[fld.InternalName] = fieldValue;
                    }
                        break;
                }
                return obj;
            }, {}), skipProps);
            return await this._settings.spEntityPortalService.updateEntityItem(this._settings.siteId, properties);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get property item from site
     * 
     * @param {string} listName List name
     * @param {string} urlSource Url source
     */
    public async getPropertyItem(listName: string, urlSource: string = encodeURIComponent(document.location.href)) {
        try {
            let [list] = await sp.web.lists.filter(`Title eq '${listName}'`).select('Id', 'DefaultEditFormUrl').get<ISPList[]>();
            if (!list) return null;
            let [item] = await sp.web.lists.getById(list.Id).items.select('Id').top(1).get<{ Id: number }[]>();
            if (!item) return null;
            // tslint:disable-next-line: naming-convention
            let [fieldValuesText, fieldValues] = await Promise.all([
                sp.web.lists.getById(list.Id).items.getById(item.Id).fieldValuesAsText.get(),
                sp.web.lists.getById(list.Id).items.getById(item.Id).get(),
            ]);
            let editFormUrl = makeUrlAbsolute(`${list.DefaultEditFormUrl}?ID=${item.Id}&Source=${urlSource}`);
            let versionHistoryUrl = `${this._settings.webUrl}/_layouts/15/versions.aspx?list=${list.Id}&ID=${item.Id}`;
            return { fieldValuesText, fieldValues, editFormUrl, versionHistoryUrl };
        } catch (error) {
            return null;
        }
    }
};