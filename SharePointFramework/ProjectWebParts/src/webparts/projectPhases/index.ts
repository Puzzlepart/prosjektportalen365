import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import { IProjectPhasesProps, ProjectPhases } from 'components/ProjectPhases';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ApplicationInsightsLogListener } from 'shared/lib/logging/ApplicationInsightsLogListener';
import { SpEntityPortalService } from 'sp-entityportal-service';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import SPDataAdapter from '../../data/index';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Warning;

export default class ProjectPhasesWebPart extends BaseClientSideWebPart<IProjectPhasesProps> {
  private _hubSite: IHubSite;

  public async onInit() {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement);
    Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
    sp.setup({ spfxContext: this.context });
    this._hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      hubSiteUrl: this._hubSite.url,
    });
  }

  public render(): void {
    const element: React.ReactElement<IProjectPhasesProps> = React.createElement(ProjectPhases, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
      hubSiteUrl: this._hubSite.url,
      ...this.properties,
    });
    ReactDom.render(element, this.domElement);
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
        }
      ]
    };
  }
}
