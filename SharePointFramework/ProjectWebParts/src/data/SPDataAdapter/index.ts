import { stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { ItemUpdateResult, sp, SPConfiguration } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import * as strings from 'ProjectWebPartsStrings';
import * as _ from 'underscore';
import { ISPDataAdapterSettings } from './ISPDataAdapterSettings';
import { ProjectDataService } from 'shared/lib/services';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export default new class SPDataAdapter {
    public spConfiguration: SPConfiguration = {
        defaultCachingStore: 'session',
        defaultCachingTimeoutSeconds: 90,
        enableCacheExpiration: true,
        cacheExpirationIntervalMilliseconds: 2500,
        globalCacheDisable: false,
    };
    public project: ProjectDataService;
    private _settings: ISPDataAdapterSettings;

    /**
     * Configure the SP data adapter
     * 
     * @param {WebPartContext} spfxContext Context
     * @param {ISPDataAdapterSettings} settings Settings
     */
    public configure(spfxContext: WebPartContext, settings: ISPDataAdapterSettings) {
        this._settings = settings;
        sp.setup({ spfxContext, ...this.spConfiguration });
        taxonomy.setup({ spfxContext });
        this.project = new ProjectDataService({ ...this._settings, propertiesListName: strings.ProjectPropertiesListName, sp, taxonomy });
        this.project.spConfiguration = this.spConfiguration;
    }

    /**
     * Sync property item from site to associated hub
     * 
     * @param {any[]} fields Fields
     * @param {TypedHash} fieldValues Field values for the properties item
     * @param {TypedHash} fieldValuesText Field values in text format for the properties item
     * @param {void} progressFunc Progress function
     */
    public async syncPropertyItemToHub(fields: any[], fieldValues: TypedHash<any>, fieldValuesText: TypedHash<string>, progressFunc: ({ description: string }) => void): Promise<ItemUpdateResult> {
        try {
            progressFunc({ description: strings.SyncProjectPropertiesValuesProgressDescription });
            const fieldToSync = fields.filter(fld => fld.InternalName.indexOf('Gt') === 0);
            const properties = _.omit(fieldToSync.reduce((obj, fld) => {
                let fieldValue = fieldValuesText[fld.InternalName];
                if (stringIsNullOrEmpty(fieldValue)) return obj;
                switch (fld.TypeAsString) {
                    case 'TaxonomyFieldType': case 'TaxonomyFieldTypeMulti': {
                        let [textField] = fields.filter(f => f.Id === fld.TextField);
                        if (textField) {
                            obj[textField.InternalName] = fieldValuesText[textField.InternalName];
                        }
                    }
                        break;
                    case 'User': {
                        obj[`${fld.InternalName}Id`] = fieldValues[`${fld.InternalName}Id`];
                    }
                        break;
                    case 'DateTime': {
                        obj[fld.InternalName] = new Date(fieldValues[fld.InternalName]);
                    }
                        break;
                    case 'Currency': {
                        obj[fld.InternalName] = fieldValues[fld.InternalName];
                    }
                        break;
                    default: {
                        obj[fld.InternalName] = fieldValue;
                    }
                        break;
                }
                return obj;
            }, {}), ['GtSiteId', 'GtGroupId', 'GtSiteUrl']);
            return await this._settings.spEntityPortalService.updateEntityItem(this._settings.siteId, properties);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fetch term field context
     * 
     * @param {string} fieldName Field name for phase
     */
    public async getTermFieldContext(fieldName: string) {
        const [phaseField, textField] = await Promise.all([
            sp.web.fields.getByInternalNameOrTitle(fieldName)
                .select('TermSetId')
                .usingCaching()
                .get<{ TermSetId: string }>(),
            sp.web.fields.getByInternalNameOrTitle(`${fieldName}_0`)
                .select('InternalName')
                .usingCaching()
                .get<{ InternalName: string }>(),
        ]);
        return { termSetId: phaseField.TermSetId, phaseTextField: textField.InternalName };
    }
};