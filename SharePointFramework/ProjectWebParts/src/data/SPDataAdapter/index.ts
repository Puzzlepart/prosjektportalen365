import { WebPartContext } from '@microsoft/sp-webpart-base';
import { stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { ItemUpdateResult } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as strings from 'ProjectWebPartsStrings';
import { SPDataAdapterBase } from 'shared/lib/data';
import { ProjectDataService } from 'shared/lib/services';
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration';

export default new class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
    public project: ProjectDataService;

    /**
     * Configure the SP data adapter
     * 
     * @param {WebPartContext} spfxContext Context
     * @param {ISPDataAdapterConfiguration} settings Settings
     */
    public configure(spfxContext: WebPartContext, configuration: ISPDataAdapterConfiguration) {
        super.configure(spfxContext, configuration);
        taxonomy.setup({ spfxContext });
        this.project = new ProjectDataService({
            ...this.settings,
            entityService: this.entityService,
            propertiesListName: strings.ProjectPropertiesListName,
            sp: this.sp,
            taxonomy,
        });
        this.project.spConfiguration = this.spConfiguration;
    }

    /**
     * Sync property item from site to associated hub
     * 
     * @param {TypedHash} fieldValues Field values for the properties item
     * @param {TypedHash} fieldValuesText Field values in text format for the properties item
     * @param {void} progressFunc Progress function
     */
    public async syncPropertyItemToHub(fieldValues: TypedHash<any>, fieldValuesText: TypedHash<string>, progressFunc: (props: IProgressIndicatorProps) => void): Promise<ItemUpdateResult> {
        try {
            progressFunc({ label: strings.SyncProjectPropertiesValuesProgressDescription, description: 'Vennligst vent...' });
            const [fields, siteUsers] = await Promise.all([
                this.entityService.getEntityFields(),
                this.sp.web.siteUsers.select('Id', 'Email', 'LoginName').get<{ Id: number, Email: string, LoginName: string }[]>(),
            ]);
            const fieldToSync = fields.filter(fld => {
                if (fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') !== -1) return false;
                if (fld.InternalName.indexOf('Gt') !== 0) return false;
                return true;
            });
            let properties: TypedHash<any> = {};
            for (let i = 0; i < fieldToSync.length; i++) {
                let fld = fieldToSync[i];
                let fldValue = fieldValues[fld.InternalName];
                let fldValueTxt = fieldValuesText[fld.InternalName];
                switch (fld.TypeAsString) {
                    case 'TaxonomyFieldType': case 'TaxonomyFieldTypeMulti': {
                        let [textField] = fields.filter(f => f.Id === fld.TextField);
                        if (!textField) continue;
                        properties[textField.InternalName] = fieldValuesText[textField.InternalName];
                    }
                        break;
                    case 'User': {
                        let [siteUser] = siteUsers.filter(u => u.Id === fieldValues[`${fld.InternalName}Id`]);
                        let user = siteUser ? await this.entityService.web.ensureUser(siteUser.LoginName) : null;
                        properties[`${fld.InternalName}Id`] = user ? user.data.Id : null;
                    }
                        break;
                    case 'DateTime': {
                        properties[fld.InternalName] = fldValue ? new Date(fldValue) : null;
                    }
                        break;
                    case 'Currency': {
                        properties[fld.InternalName] = fldValue || null;
                    }
                        break;
                    default: {
                        properties[fld.InternalName] = fldValueTxt || null;
                    }
                        break;
                }
            }
            return await this.entityService.updateEntityItem(this.settings.siteId, properties);
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
        let phaseField = await this.sp.web.fields.getByInternalNameOrTitle(fieldName)
            .select('InternalName', 'TermSetId', 'TextField')
            .usingCaching()
            .get<{ InternalName: string, TermSetId: string, TextField: string }>();
        let phaseTextField = await this.sp.web.fields.getById(phaseField.TextField)
            .select('InternalName')
            .usingCaching()
            .get<{ InternalName: string }>();
        return {
            fieldName: phaseField.InternalName,
            termSetId: phaseField.TermSetId,
            phaseTextField: phaseTextField.InternalName,
        };
    }

    /**
     * Clear cache
     */
    public clearCache() {
        this.project.clearCache();
    }
};