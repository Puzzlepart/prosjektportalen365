import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import "@pnp/polyfill-ie11";
import { sp } from '@pnp/sp';
import MSGraphHelper from 'msgraph-helper';
import * as strings from 'ProjectPhasesWebPartStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import ProjectPhases, { IProjectPhasesProps } from './components/ProjectPhases';
import { IProjectPhasesWebPartProps } from './IProjectPhasesWebPartProps';

export default class ProjectPhasesWebPart extends BaseClientSideWebPart<IProjectPhasesWebPartProps> {
  public async onInit() {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement);
    await MSGraphHelper.Init(this.context.msGraphClientFactory, 'v1.0');
    sp.setup({ spfxContext: this.context });
  }

  public render(): void {
    const element: React.ReactElement<IProjectPhasesProps> = React.createElement(ProjectPhases, {
      pageContext: this.context.pageContext,
      ...this.properties,
    });
    ReactDom.render(element, this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
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
        }
      ]
    };
  }
}
