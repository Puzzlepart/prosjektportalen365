import { WebPartContext } from '@microsoft/sp-webpart-base';
import { stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { ItemUpdateResult } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import * as strings from 'ProjectWebPartsStrings';
import { SPDataAdapterBase } from 'shared/lib/data';
import { ProjectDataService } from 'shared/lib/services';
import * as _ from 'underscore';
import { ISPDataAdapterSettings } from './ISPDataAdapterSettings';

export default new class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterSettings> {
    public project: ProjectDataService;

    /**
     * Configure the SP data adapter
     * 
     * @param {WebPartContext} spfxContext Context
     * @param {ISPDataAdapterSettings} settings Settings
     */
    public configure(spfxContext: WebPartContext, settings: ISPDataAdapterSettings) {
        super.configure(spfxContext, settings);
        taxonomy.setup({ spfxContext });
        this.project = new ProjectDataService({
            ...this.settings,
            spEntityPortalService: this.spEntityPortalService,
            propertiesListName: strings.ProjectPropertiesListName,
            sp: this.sp,
            taxonomy,
        });
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
            return await this.spEntityPortalService.updateEntityItem(this.settings.siteId, properties);
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
            this.sp.web.fields.getByInternalNameOrTitle(fieldName)
                .select('TermSetId')
                .usingCaching()
                .get<{ TermSetId: string }>(),
            this.sp.web.fields.getByInternalNameOrTitle(`${fieldName}_0`)
                .select('InternalName')
                .usingCaching()
                .get<{ InternalName: string }>(),
        ]);
        return { termSetId: phaseField.TermSetId, phaseTextField: textField.InternalName };
    }
};