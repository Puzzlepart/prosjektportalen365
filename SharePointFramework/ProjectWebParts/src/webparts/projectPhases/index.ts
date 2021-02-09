import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import '@pnp/polyfill-ie11'
import { sp } from '@pnp/sp'
import { IProjectPhasesProps, ProjectPhases } from 'components/ProjectPhases'
import 'office-ui-fabric-react/dist/css/fabric.min.css'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart'

export default class ProjectPhasesWebPart extends BaseProjectWebPart<IProjectPhasesProps> {
  private _fields: { Title: string; InternalName: string }[] = []

  public async onInit() {
    await super.onInit()
    this._fields = await sp.web.fields
      // eslint-disable-next-line quotes
      .filter("TypeAsString eq 'TaxonomyFieldType'")
      .select('Title', 'InternalName')
      .get()
  }

  public render(): void {
    this.renderComponent(ProjectPhases, {})
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.SettingsGroupName,
              groupFields: [
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
            }
          ]
        }
      ]
    }
  }
}
