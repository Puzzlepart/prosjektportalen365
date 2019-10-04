import { WebPartContext } from '@microsoft/sp-webpart-base';
import { stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { LogLevel } from '@pnp/logging';
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
     * @param {TypedHash} fieldValues Field values for the properties item
     * @param {TypedHash} fieldValuesText Field values in text format for the properties item
     * @param {void} progressFunc Progress function
     */
    public async syncPropertyItemToHub(fieldValues: TypedHash<any>, fieldValuesText: TypedHash<string>, progressFunc: (props: IProgressIndicatorProps) => void): Promise<ItemUpdateResult> {
        try {
            progressFunc({ label: strings.SyncProjectPropertiesValuesProgressDescription, description: 'Vennligst vent...' });
            const fields = await this.spEntityPortalService.getEntityFields();
            const fieldToSync = fields.filter(fld => {
                if (fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') !== -1) return false;
                if (fld.InternalName.indexOf('Gt') !== 0) return false;
                return true;
            });
            const properties = fieldToSync.reduce((obj, fld) => {
                let fldValue = fieldValues[fld.InternalName];
                let fldValueTxt = fieldValuesText[fld.InternalName];
                if (stringIsNullOrEmpty(fldValueTxt)) return obj;
                switch (fld.TypeAsString) {
                    case 'TaxonomyFieldType': case 'TaxonomyFieldTypeMulti': {
                        let [textField] = fields.filter(f => f.Id === fld.TextField);
                        if (textField) obj[textField.InternalName] = fieldValuesText[textField.InternalName];
                    }
                        break;
                    case 'User': {
                        obj[`${fld.InternalName}Id`] = fieldValues[`${fld.InternalName}Id`];
                    }
                        break;
                    case 'DateTime': {
                        obj[fld.InternalName] = new Date(fldValue);
                    }
                        break;
                    case 'Currency': {
                        obj[fld.InternalName] = fldValue;
                    }
                        break;
                    default: {
                        obj[fld.InternalName] = fldValueTxt;
                    }
                        break;
                }
                return obj;
            }, {});
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

    /**
     * Clear storage
     */
    public clearStorage(): void {
        this.project.clearStorage();
    }
};