import { IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import '@pnp/polyfill-ie11';
import { IProjectPhasesProps, ProjectPhases } from 'components/ProjectPhases';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import * as strings from 'ProjectWebPartsStrings';
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart';
import { LOGGING_PAGE } from 'webparts/PropertyPane';

export default class ProjectPhasesWebPart extends BaseProjectWebPart<IProjectPhasesProps> {
  public async onInit() {
    await super.onInit();
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
                PropertyPaneTextField('phaseSubTextProperty', {
                  label: strings.PhaseSubTextPropertyFieldLabel,
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
        LOGGING_PAGE,
      ]
    };
  }
}
