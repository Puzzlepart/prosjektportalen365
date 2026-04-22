import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { ProgramAdministration } from 'components/ProgramAdministration/ProgramAdministration'
import { IProgramAdministrationProps } from 'components/ProgramAdministration/types'
import { BaseProgramWebPart } from '../baseProgramWebPart'

export default class ProgramAdministrationWebPart extends BaseProgramWebPart<IProgramAdministrationProps> {
  public render(): void {
    this.renderComponent<IProgramAdministrationProps>(ProgramAdministration, {
      context: this.context,
      dataAdapter: this._dataAdapter
    })
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}
