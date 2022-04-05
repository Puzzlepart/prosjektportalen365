import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { IProjectListProps, ProjectList } from 'components/ProjectList'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'
import { Session, ITaxonomySession } from '@pnp/sp-taxonomy'
import * as _ from 'lodash'

export default class ProjectListWebPart extends BasePortfolioWebPart<IProjectListProps> {
  public render(): void {
    this.renderComponent<IProjectListProps>(ProjectList)
  }

  private async _setupTaxonomy() {
    const taxonomySession: ITaxonomySession = new Session()
    const termSetIds = this.properties.termSetIds ? this.properties.termSetIds.split(',') : []
    const termSetArray = []
    const termStore = await taxonomySession.getDefaultSiteCollectionTermStore()
    for (const termSetId of termSetIds) {
      termSetArray.push(termStore.getTermSetById(termSetId).terms.get())
    }
    const fullTerms = _.flatten(await Promise.all(termSetArray))
    this.properties.phaseLevel = fullTerms.map(term => {
      return {
        name: term.Name,
        phaseLevel: term.LocalCustomProperties?.PhaseLevel ? term.LocalCustomProperties?.PhaseLevel : 0,
      }
    })
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    await this._setupTaxonomy()
  }


  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('sortBy', {
                  label: strings.SortByFieldLabel,
                  disabled: true
                }),
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                }),
                PropertyPaneToggle('showAsTiles', {
                  label: strings.ShowAsTilesLabel
                })
              ]
            },
            {
              groupName: strings.TileViewGroupName,
              groupFields: [
                PropertyPaneToggle('showProjectLogo', {
                  label: strings.ShowProjectLogoFieldLabel
                }),
                PropertyPaneToggle('showProjectOwner', {
                  label: strings.ShowProjectOwnerFieldLabel
                }),
                PropertyPaneToggle('showProjectManager', {
                  label: strings.ShowProjectManagerFieldLabel
                }),
                PropertyPaneToggle('showLifeCycleStatus', {
                  label: strings.ShowLifeCycleStatusFieldLabel,
                }),
                PropertyPaneToggle('showServiceArea', {
                  label: strings.ShowServiceAreaFieldLabel
                }),
                PropertyPaneToggle('showType', {
                  label: strings.ShowTypeFieldLabel
                }),
                PropertyPaneTextField('termSetIds', {
                  label: strings.PhaseTermSetIdLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
