import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { CalloutTriggers } from '@pnp/spfx-property-controls/lib/PropertyFieldHeader'
import { PropertyFieldToggleWithCallout } from '@pnp/spfx-property-controls/lib/PropertyFieldToggleWithCallout'
import React from 'react'
import { IProjectPhasesProps, ProjectPhases } from 'components/ProjectPhases'
import '@fluentui/react/dist/css/fabric.min.css'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from '../@baseProjectWebPart'

export default class ProjectPhasesWebPart extends BaseProjectWebPart<IProjectPhasesProps> {
  private _fields: { Title: string; InternalName: string }[] = []

  public async onInit() {
    await super.onInit()
    this._fields = await this.sp.web.fields
      // eslint-disable-next-line quotes
      .filter("TypeAsString eq 'TaxonomyFieldType'")
      .select('Title', 'InternalName')()
  }

  public render(): void {
    this.renderComponent(ProjectPhases, { webPartContext: this.context })
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.SettingsGroupName,
              groupFields: [
                PropertyPaneToggle('syncPropertiesAfterPhaseChange', {
                  label: strings.SyncPropertiesAfterPhaseChangeFieldLabel
                }),
                PropertyPaneToggle('showSubText', {
                  label: strings.ShowSubTextFieldLabel
                }),
                PropertyPaneSlider('subTextTruncateLength', {
                  label: strings.SubTextTruncateLengthFieldLabel,
                  min: 20,
                  max: 100,
                  step: 2,
                  showValue: true,
                  disabled: !this.properties.showSubText
                }),
                PropertyPaneDropdown('phaseField', {
                  label: strings.PhaseFieldFieldLabel,
                  options: this._fields.map((f) => ({
                    key: f.InternalName,
                    text: `${f.Title} (${f.InternalName})`
                  }))
                })
              ]
            },
            {
              groupName: strings.ViewsGroupName,
              groupFields: [
                PropertyPaneTextField('currentPhaseViewName', {
                  label: strings.CurrentPhaseViewNameFieldLabel
                })
              ]
            },
            {
              groupName: strings.AdvancedGroupName,
              groupFields: [
                PropertyFieldToggleWithCallout('useDynamicHomepage', {
                  calloutTrigger: CalloutTriggers.Click,
                  key: 'useDynamicHomepageFieldId',
                  label: strings.UseDynamicHomepageFieldLabel,
                  onText: 'På',
                  offText: 'Av',
                  calloutWidth: 430,
                  calloutContent: React.createElement(
                    'p',
                    {},
                    strings.UseDynamicHomepageCalloutText
                  ),
                  checked: this.properties.useDynamicHomepage
                }),
                PropertyFieldToggleWithCallout('usePhaseHooks', {
                  calloutTrigger: CalloutTriggers.Click,
                  key: 'usePhaseHooksFieldId',
                  label: strings.UsePhaseHooksFieldLabel,
                  onText: 'På',
                  offText: 'Av',
                  calloutWidth: 430,
                  calloutContent: React.createElement('p', {}, strings.UsePhaseHooksCalloutText),
                  checked: this.properties.usePhaseHooks
                }),
                PropertyPaneTextField('hookUrl', {
                  label: strings.HookUrlFieldLabel,
                  description: strings.HookUrlFieldDescription
                }),
                PropertyPaneTextField('hookAuth', {
                  label: strings.HookAuthFieldLabel,
                  description: strings.HookAuthFieldDescription
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
