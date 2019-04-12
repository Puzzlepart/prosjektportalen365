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
  private _taxonomyFields: { InternalName: string, Title: string }[];
  private _spEntityPortalService: SpEntityPortalService;

  constructor() {
    super();
    this._taxonomyFields = [];
  }

  public async onInit() {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement);
    await MSGraphHelper.Init(this.context.msGraphClientFactory, 'v1.0');
    sp.setup({ spfxContext: this.context });
    const [taxonomyFields, hubSite] = await Promise.all([
      sp.web.fields.select('InternalName', 'Title').filter(`TypeAsString eq 'TaxonomyFieldType'`).get(),
      HubSiteService.GetHubSiteById(this.context.pageContext.web.absoluteUrl, this.context.pageContext.legacyPageContext.hubSiteId),
    ]);
    const params = { webUrl: hubSite.url, ...this.properties.entity };
    this._taxonomyFields = taxonomyFields;
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
                PropertyPaneDropdown('phaseField', {
                  label: strings.PhaseFieldFieldLabel,
                  options: this._taxonomyFields.map(field => ({ key: field.Title, text: field.Title })),
                }),
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
            },
            {
              groupName: strings.LookAndFeelGroupName,
              groupFields: [
                PropertyPaneSlider('fontSize', {
                  label: strings.FontSizeFieldLabel,
                  min: 10,
                  max: 25,
                  step: 1,
                }),
                PropertyPaneSlider('gutter', {
                  label: strings.GutterFieldLabel,
                  min: 10,
                  max: 50,
                  step: 2,
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
