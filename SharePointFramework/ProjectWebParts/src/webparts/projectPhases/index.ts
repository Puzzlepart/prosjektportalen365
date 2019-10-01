import { IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import { IProjectPhasesProps, ProjectPhases } from 'components/ProjectPhases';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ApplicationInsightsLogListener } from 'shared/lib/logging/ApplicationInsightsLogListener';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import { LOGGING_PAGE } from 'webparts/PropertyPane';
import SPDataAdapter from '../../data';

export default class ProjectPhasesWebPart extends BaseClientSideWebPart<IProjectPhasesProps> {
  private _hubSite: IHubSite;

  public async onInit() {
    Logger.activeLogLevel = this.properties.logLevel || LogLevel.Error;
    Logger.subscribe(new ConsoleListener());
    Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
    sp.setup({ spfxContext: this.context });
    this._hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      hubSiteUrl: this._hubSite.url,
      logLevel: this.properties.logLevel || LogLevel.Error,
    });
  }

  public render(): void {
    const element: React.ReactElement<IProjectPhasesProps> = React.createElement(ProjectPhases, {
      webUrl: this.context.pageContext.web.absoluteUrl,
      isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
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
        },
        LOGGING_PAGE,
      ]
    };
  }
}
