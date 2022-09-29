import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { CalloutTriggers } from '@pnp/spfx-property-controls/lib/PropertyFieldHeader'
import { PropertyFieldToggleWithCallout } from '@pnp/spfx-property-controls/lib/PropertyFieldToggleWithCallout'
import { IProjectInformationProps, ProjectInformation } from 'components/ProjectInformation'
import * as strings from 'ProjectWebPartsStrings'
import React from 'react'
import { BaseProjectWebPart } from '../@baseProjectWebPart'

export default class ProjectInformationWebPart extends BaseProjectWebPart<
  IProjectInformationProps
> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectInformationProps>(ProjectInformation, {
      onFieldExternalChanged: this._onFieldExternalChanged.bind(this),
      adminPageLink: this.properties.adminPageLink ?? strings.DefaultAdminPageLink,
      webPartContext: this.context
    })
  }

  private _onFieldExternalChanged(fieldName: string, checked: boolean) {
    const showFieldExternal = { ...(this.properties.showFieldExternal || {}), [fieldName]: checked }
    this.properties.showFieldExternal = showFieldExternal
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle('skipSyncToHub', {
                  label: strings.SkipSyncToHubLabel
                }),
                PropertyPaneTextField('adminPageLink', {
                  label: strings.AdminPageLinkLabel
                })
              ]
            },
            {
              groupName: strings.AdvancedGroupName,
              groupFields: [
                PropertyFieldToggleWithCallout('useIdeaProcessing', {
                  calloutTrigger: CalloutTriggers.Click,
                  key: 'useIdeaProcessingFieldId',
                  label: strings.UseIdeaProcessingFieldLabel,
                  onText: 'På',
                  offText: 'Av',
                  calloutWidth: 430,
                  calloutContent:
                    [React.createElement(
                      'h2', {}, strings.UseIdeaProcessingFieldLabel
                    ),
                    React.createElement(
                      'p', {}, strings.UseIdeaProcessingCalloutText
                    )],
                  checked: this.properties.useIdeaProcessing
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
