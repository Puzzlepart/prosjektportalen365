import { stringIsNullOrEmpty } from '@pnp/common';
import { List } from '@pnp/sp';
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
    public async syncPropertyItemToHub(data: IProjectInformationData, skipProps: string[] = ['GtSiteId', 'GtGroupId', 'GtSiteUrl']) {
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
            await this._settings.spEntityPortalService.updateEntityItem(this._settings.siteId, properties);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get property item from site
     * 
     * @param {List} propertiesList Properties list
     * @param {string} urlSource Url source
     */
    public async getPropertyItem(propertiesList: List, urlSource: string = encodeURIComponent(document.location.href)) {
        try {
            let [item] = await propertiesList.items.select('Id').top(1).get<{ Id: number }[]>();
            if (!item) return null;
            // tslint:disable-next-line: naming-convention
            let [fieldValuesText, fieldValues, list] = await Promise.all([
                propertiesList.items.getById(item.Id).fieldValuesAsText.get(),
                propertiesList.items.getById(item.Id).get(),
                propertiesList
                    .select(
                        'Id',
                        'DefaultEditFormUrl',
                        'Fields/InternalName',
                        'Fields/TypeAsString',
                        'Fields/TextField',
                        'Fields/Id',
                    )
                    .expand('Fields')
                    .get<ISPList>(),
            ]);
            let editFormUrl = makeUrlAbsolute(`${list.DefaultEditFormUrl}?ID=${item.Id}&Source=${urlSource}`);
            let versionHistoryUrl = `${this._settings.webUrl}/_layouts/15/versions.aspx?list=${list.Id}&ID=${item.Id}`;
            return { fieldValuesText, fieldValues, editFormUrl, versionHistoryUrl };
        } catch (error) {
            return null;
        }
    }
};