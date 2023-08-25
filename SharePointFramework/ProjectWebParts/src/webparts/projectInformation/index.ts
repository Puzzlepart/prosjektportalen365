import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'
import { IProjectInformationProps, ProjectInformation } from 'components/ProjectInformation'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from '../baseProjectWebPart'

export default class ProjectInformationWebPart extends BaseProjectWebPart<IProjectInformationProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectInformationProps>(ProjectInformation, {
      onFieldExternalChanged: this._onFieldExternalChanged.bind(this),
      adminPageLink: this.properties.adminPageLink ?? strings.DefaultAdminPageLink
    })
  }

  private _onFieldExternalChanged(fieldName: string, checked: boolean) {
    const showFieldExternal = { ...(this.properties.showFieldExternal || {}), [fieldName]: checked }
    this.properties.showFieldExternal = showFieldExternal
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const propertiesWithDefaults = { ...ProjectInformation.defaultProps, ...this.properties }
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
                      key: 'showAllProjectInformationAction',
                      text: strings.ShowAllProjectInformationText
                    },
                    {
                      key: 'viewVersionHistoryAction',
                      text: strings.ViewVersionHistoryText
                    },
                    {
                      key: 'editProjectInformationAction',
                      text: strings.EditProjectInformationText
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
                    }
                  ],
                  selectedKeys: this.properties.hideActions ?? []
                }),
                !this.properties.hideAllActions &&
                  PropertyPaneToggle('useFramelessButtons', {
                    label: strings.UseFramelessButtonsLabel
                  }),
                PropertyPaneTextField('adminPageLink', {
                  label: strings.AdminPageLinkLabel
                })
              ].filter(Boolean)
            },
            {
              groupName: strings.ParentProjectsGroupName,
              groupFields: [
                PropertyPaneToggle('hideParentProjects', {
                  label: strings.HideParentProjectsLabel,
                  checked: propertiesWithDefaults.hideParentProjects
                })
              ]
            },
            {
              groupName: strings.ProjectStatusGroupName,
              groupFields: [
                PropertyPaneToggle('hideStatusReport', {
                  label: strings.HideStatusReportLabel,
                  checked: propertiesWithDefaults.hideStatusReport
                }),
                !propertiesWithDefaults.hideStatusReport &&
                  PropertyPaneToggle('statusReportShowOnlyIcons', {
                    label: strings.StatusReportShowOnlyIconsLabel,
                    checked: propertiesWithDefaults.statusReportShowOnlyIcons
                  }),
                !propertiesWithDefaults.hideStatusReport &&
                  !propertiesWithDefaults.statusReportShowOnlyIcons &&
                  PropertyPaneSlider('statusReportTruncateComments', {
                    label: strings.StatusReportTruncateCommentsLabel,
                    min: 25,
                    max: 150,
                    step: 5
                  })
              ].filter(Boolean)
            }
          ]
        }
      ]
    }
  }
}
