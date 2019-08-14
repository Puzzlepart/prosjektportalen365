import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import { IProjectPhasesProps, ProjectPhases } from 'components/ProjectPhases';
import MSGraphHelper from 'msgraph-helper';
import * as ProjectPhasesWebPartStrings from 'ProjectPhasesWebPartStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import SpEntityPortalService from 'sp-entityportal-service';
import HubSiteService from 'sp-hubsite-service';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;

export default class ProjectPhasesWebPart extends BaseClientSideWebPart<IProjectPhasesProps> {
  private spEntityPortalService: SpEntityPortalService;

  public async onInit() {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement);
    sp.setup({ spfxContext: this.context });
    await MSGraphHelper.Init(this.context.msGraphClientFactory, 'v1.0');
    const hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    this.spEntityPortalService = new SpEntityPortalService({ webUrl: hubSite.url, ...this.properties.entity });
  }

  public render(): void {
    const element: React.ReactElement<IProjectPhasesProps> = React.createElement(ProjectPhases, {
      spEntityPortalService: this.spEntityPortalService,
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
              groupName: ProjectPhasesWebPartStrings.SettingsGroupName,
              groupFields: [
                PropertyPaneToggle('automaticReload', {
                  label: ProjectPhasesWebPartStrings.AutomaticReloadFieldLabel,
                }),
                PropertyPaneSlider('reloadTimeout', {
                  label: ProjectPhasesWebPartStrings.ReloadTimeoutFieldLabel,
                  min: 0,
                  max: 10,
                  step: 1,
                  disabled: !this.properties.automaticReload,
                }),
                PropertyPaneToggle('confirmPhaseChange', {
                  label: ProjectPhasesWebPartStrings.ConfirmPhaseChangeFieldLabel,
                }),
                PropertyPaneTextField('phaseSubTextProperty', {
                  label: ProjectPhasesWebPartStrings.PhaseSubTextPropertyFieldLabel,
                }),
              ]
            },
            {
              groupName: ProjectPhasesWebPartStrings.ViewsGroupName,
              groupFields: [
                PropertyPaneTextField('currentPhaseViewName', {
                  label: ProjectPhasesWebPartStrings.CurrentPhaseViewNameFieldLabel,
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
