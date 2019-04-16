import * as React from 'react';
import * as ReactDom from 'react-dom';
import "@pnp/polyfill-ie11";
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneSlider, PropertyPaneToggle, PropertyPaneDropdown, IPropertyPaneDropdownOption } from '@microsoft/sp-webpart-base';
import * as strings from 'ProjectPhasesWebPartStrings';
import { IProjectPhasesWebPartProps } from './IProjectPhasesWebPartProps';
import ProjectPhases, { IProjectPhasesProps } from './components/ProjectPhases';
import MSGraphHelper from 'msgraph-helper';
import HubSiteService from 'sp-hubsite-service';
import SpEntityPortalService from 'sp-entityportal-service';

export default class ProjectPhasesWebPart extends BaseClientSideWebPart<IProjectPhasesWebPartProps> {
  private _spEntityPortalService: SpEntityPortalService;

  public async onInit() {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement);
    await MSGraphHelper.Init(this.context.msGraphClientFactory, 'v1.0');
    sp.setup({ spfxContext: this.context });
    const hubSite = await HubSiteService.GetHubSiteById(this.context.pageContext.web.absoluteUrl, this.context.pageContext.legacyPageContext.hubSiteId);
    const params = { webUrl: hubSite.url, ...this.properties.entity };
    this._spEntityPortalService = new SpEntityPortalService(params);
  }

  public render(): void {
    const element: React.ReactElement<IProjectPhasesProps> = React.createElement(ProjectPhases, {
      spEntityPortalService: this._spEntityPortalService,
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
