import * as React from 'react';
import "@pnp/polyfill-ie11";
import { Web, PermissionKind } from '@pnp/sp';
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneSlider, PropertyPaneToggle, PropertyPaneDropdown, IPropertyPaneDropdownOption } from '@microsoft/sp-webpart-base';
import * as strings from 'ProjectPhasesWebPartStrings';
import { IProjectPhasesWebPartProps } from './IProjectPhasesWebPartProps';
import ProjectPhases from './components/ProjectPhases';
import BaseWebPart from '../baseWebPart';

export default class ProjectPhasesWebPart extends BaseWebPart<IProjectPhasesWebPartProps> {
  private web: Web;
  private currentUserManageWeb: boolean = false;
  private optionsPhaseField: IPropertyPaneDropdownOption[] = [];

  constructor() {
    super();
  }

  public async onInit() {
    await super.onInit();
    this.web = new Web(this.context.pageContext.web.absoluteUrl);
    const [currentUserManageWeb, taxonomyFields] = await Promise.all([
      this.getCurrentUserManageWeb(),
      this.web.fields.select('InternalName', 'Title').filter(`TypeAsString eq 'TaxonomyFieldType'`).get(),
    ]);
    this.currentUserManageWeb = currentUserManageWeb;
    this.optionsPhaseField = taxonomyFields.map(field => ({ key: field.Title, text: field.Title }));
    this.isInitialized = true;
  }

  public render(): void {
    super._render(ProjectPhases, {
      currentUserManageWeb: this.currentUserManageWeb,
      webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
      web: this.web,
      domElement: this.domElement,
    });
  }

  protected async getCurrentUserManageWeb(): Promise<boolean> {
    try {
      const currentUserManageWeb = await this.web.currentUserHasPermissions(PermissionKind.ManageWeb);
      return currentUserManageWeb;
    } catch (err) {
      return false;
    }
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
                  options: this.optionsPhaseField,
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
                PropertyPaneToggle('updateViewsDocuments', {
                  label: strings.UpdateViewsDocumentsFieldLabel,
                }),
                PropertyPaneToggle('updateViewsRisks', {
                  label: strings.UpdateViewsRisksFieldLabel,
                }),
                PropertyPaneTextField('updateViewName', {
                  label: strings.UpdateViewNameFieldLabel,
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
