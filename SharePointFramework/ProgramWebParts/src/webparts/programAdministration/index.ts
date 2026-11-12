import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { ProgramAdministration } from 'components/ProgramAdministration/ProgramAdministration'
import { IProgramAdministrationProps } from 'components/ProgramAdministration/types'
import { BaseProgramWebPart } from '../baseProgramWebPart'

/** Hosts child-project administration with the current SPFx context and program data adapter. */
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
