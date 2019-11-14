import { IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle, PropertyPaneDropdown } from '@microsoft/sp-property-pane';
import '@pnp/polyfill-ie11';
import { IProjectPhasesProps, ProjectPhases } from 'components/ProjectPhases';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import * as strings from 'ProjectWebPartsStrings';
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart';
import { sp } from '@pnp/sp';

export default class ProjectPhasesWebPart extends BaseProjectWebPart<IProjectPhasesProps> {
  private _fields: { Title: string, InternalName: string }[] = [];

  public async onInit() {
    await super.onInit();
    this._fields = await sp.web.fields.filter(`TypeAsString eq 'TaxonomyFieldType'`).select('Title', 'InternalName').get();
  }

  public render(): void {
    this.renderComponent(ProjectPhases, {});
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.SettingsGroupName,
              groupFields: [
                PropertyPaneToggle('automaticReload', {
                  label: strings.AutomaticReloadFieldLabel,
                }),
                PropertyPaneSlider('reloadTimeout', {
                  label: strings.ReloadTimeoutFieldLabel,
                  min: 0,
                  max: 10,
                  step: 1,
                  disabled: !this.properties.automaticReload,
                }),
                PropertyPaneToggle('confirmPhaseChange', {
                  label: strings.ConfirmPhaseChangeFieldLabel,
                }),
                PropertyPaneDropdown('phaseField', {
                  label: strings.PhaseFieldFieldLabel,
                  options: this._fields.map(f => ({
                    key: f.InternalName,
                    text: `${f.Title} (${f.InternalName})`,
                  })),
                }),
              ]
            },
            {
              groupName: strings.ViewsGroupName,
              groupFields: [
                PropertyPaneTextField('currentPhaseViewName', {
                  label: strings.CurrentPhaseViewNameFieldLabel,
                }),
              ]
            }
          ]
        },
      ]
    };
  }
}
