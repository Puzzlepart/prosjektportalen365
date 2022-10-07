import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { CalloutTriggers } from '@pnp/spfx-property-controls/lib/PropertyFieldHeader'
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'
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
                PropertyPaneToggle('hideAllActions', {
                  label: strings.HideAllActionsLabel
                }),
                PropertyFieldMultiSelect('hideActions', {
                  key: 'hideActions',
                  label: strings.HideActionsLabel,
                  disabled: this.properties.hideAllActions,
                  options: [
                    {
                      key: 'viewAllPropertiesAction',
                      text: strings.ViewAllPropertiesLabel
                    },
                    {
                      key: 'viewVersionHistoryAction',
                      text: strings.ViewVersionHistoryText
                    },
                    {
                      key: 'editPropertiesAction',
                      text: strings.EditPropertiesText
                    },
                    {
                      key: 'editSiteInformationAction',
                      text: strings.EditSiteInformationText
                    },
                    {
                      key: 'administerChildrenAction',
                      text: strings.ChildProjectAdminLabel
                    },
                    {
                      key: 'transformToParentProject',
                      text: strings.CreateParentProjectLabel
                    },
                    {
                      key: 'syncProjectPropertiesAction',
                      text: strings.SyncProjectPropertiesText
                    }
                  ],
                  selectedKeys: this.properties.hideActions ?? []
                }),
                PropertyPaneTextField('adminPageLink', {
                  label: strings.AdminPageLinkLabel
                }),
                PropertyPaneToggle('hideParentProjects', {
                  label: strings.HideParentProjectsLabel
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
                  calloutContent: [
                    React.createElement('h2', {}, strings.UseIdeaProcessingFieldLabel),
                    React.createElement('p', {}, strings.UseIdeaProcessingCalloutText)
                  ],
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
