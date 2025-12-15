import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneDropdown,
  IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane'
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'
import { IDynamicListProps, DynamicListMode, WebContextMode } from 'components/DynamicList'
import { DynamicList } from 'components/DynamicList/DynamicList'
import '@fluentui/react/dist/css/fabric.min.css'
import { BaseProjectWebPart } from '../baseProjectWebPart'
import * as strings from 'ProjectWebPartsStrings'
import SPDataAdapter from '../../data'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/views'

export default class DynamicListWebPart extends BaseProjectWebPart<IDynamicListProps> {
  private _listOptions: IPropertyPaneDropdownOption[] = []
  private _listsLoading: boolean = false
  private _viewOptions: IPropertyPaneDropdownOption[] = []
  private _viewsLoading: boolean = false
  private _columnOptions: IPropertyPaneDropdownOption[] = []

  public async onInit() {
    await super.onInit()
    await this._loadListOptions()

    if (this.properties.listName) {
      await this._loadViewOptions()
    }
  }

  /**
   * Load available lists from the selected site (or current site if not specified)
   * Excludes hidden lists and folder lists.
   */
  private async _loadListOptions(): Promise<void> {
    try {
      this._listsLoading = true

      let web = SPDataAdapter.sp.web
      const webContextMode = this.properties.webContextMode || WebContextMode.CurrentProject

      if (webContextMode === WebContextMode.HubSite) {
        web = SPDataAdapter.portalDataService.web
      } else if (webContextMode === WebContextMode.CustomSite && this.properties.webUrl) {
        const { Web } = await import('@pnp/sp/webs')
        web = Web([SPDataAdapter.sp.web, this.properties.webUrl])
      }

      const lists = await web.lists
        .select('Title', 'Id', 'Hidden', 'BaseTemplate', 'ItemCount')
        .filter('Hidden eq false and BaseTemplate ne 850')()

      this._listOptions = lists
        .filter(
          (list) =>
            !list.Title.startsWith('_') && (list.BaseTemplate === 100 || list.BaseTemplate === 101)
        )
        .sort((a, b) => a.Title.localeCompare(b.Title))
        .map((list) => ({
          key: list.Title,
          text: `${list.Title} (${list.ItemCount || 0} ${
            list.BaseTemplate === 101 ? 'dokumenter' : 'elementer'
          })`
        }))

      this._listsLoading = false
    } catch (error) {
      console.error('Error loading lists:', error)
      this._listOptions = []
      this._listsLoading = false
    }
  }

  /**
   * Load available views from the selected list
   * Always add "All Fields" as the first option.
   */
  private async _loadViewOptions(): Promise<void> {
    try {
      this._viewsLoading = true

      if (!this.properties.listName) {
        this._viewOptions = [{ key: 'All Fields', text: 'Alle felt' }]
        this._viewsLoading = false
        return
      }

      let web = SPDataAdapter.sp.web
      if (this.properties.webUrl) {
        const { Web } = await import('@pnp/sp/webs')
        web = Web([SPDataAdapter.sp.web, this.properties.webUrl])
      }

      const list = web.lists.getByTitle(this.properties.listName)
      const views = await list.views
        .select('Title', 'Id', 'DefaultView')
        .filter('Hidden eq false')()

      this._viewOptions = [
        { key: 'All Fields', text: 'Alle felt' },
        ...views
          .sort((a, b) => {
            if (a.DefaultView) return -1
            if (b.DefaultView) return 1
            return a.Title.localeCompare(b.Title)
          })
          .map((view) => ({
            key: view.Id,
            text: view.DefaultView ? `${view.Title} (Standard)` : view.Title,
            data: { title: view.Title, isDefault: view.DefaultView }
          }))
      ]

      this._viewsLoading = false
    } catch (error) {
      console.error('Error loading views:', error)
      this._viewOptions = [{ key: 'All Fields', text: 'Alle felt' }]
      this._viewsLoading = false
    }
  }

  /**
   * Get the selected view key for the property pane dropdown.
   * Prioritizes defaultViewId over viewName.
   */
  private _getSelectedViewKey(): string {
    if (this.properties.defaultViewId) {
      return this.properties.defaultViewId
    }
    return this.properties.viewName || 'All Fields'
  }

  /**
   * Get column options from the rendered component's state data.
   * Called when property pane configuration is built.
   */
  private _getColumnOptions(): void {
    try {
      // Access the component's data through the domElement
      const dataElement = this.domElement.querySelector('[data-list-columns]')
      if (dataElement) {
        const columnsJson = dataElement.getAttribute('data-list-columns')
        if (columnsJson) {
          const columns = JSON.parse(columnsJson)
          this._columnOptions = columns.map((col: any) => ({
            key: col.fieldName || col.key,
            text: col.name
          }))
          return
        }
      }
    } catch (error) {
      console.error('Error getting column options from component:', error)
    }
    this._columnOptions = []
  }

  public render(): void {
    this.renderComponent<IDynamicListProps>(DynamicList)
  }

  protected async onPropertyPaneFieldChanged(
    propertyPath: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    if (propertyPath === 'webContextMode' || propertyPath === 'webUrl') {
      this.properties.listName = ''
      this.properties.viewName = 'All Fields'
      this.properties.defaultViewId = null
      this.properties.hiddenColumns = []
      await this._loadListOptions()
      this.context.propertyPane.refresh()
    }

    if (propertyPath === 'listName') {
      this.properties.viewName = 'All Fields'
      this.properties.defaultViewId = null
      this.properties.hiddenColumns = []
      await this._loadViewOptions()
      this.context.propertyPane.refresh()
      this.render()
    }

    if (propertyPath === 'defaultViewId') {
      if (newValue && newValue !== 'All Fields') {
        const selectedView = this._viewOptions.find((opt) => opt.key === newValue)
        this.properties.viewName = (selectedView as any)?.data?.title || newValue
      } else {
        this.properties.viewName = 'All Fields'
      }
    }

    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue)
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    // Update column options from rendered component state
    this._getColumnOptions()

    return {
      pages: [
        {
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneDropdown('webContextMode', {
                  label: 'Område',
                  options: [
                    { key: WebContextMode.CurrentProject, text: 'Gjeldende prosjekt' },
                    { key: WebContextMode.HubSite, text: 'Porteføljeområde (hub)' },
                    { key: WebContextMode.CustomSite, text: 'Egendefinert område' }
                  ],
                  selectedKey: this.properties.webContextMode || WebContextMode.CurrentProject
                }),
                this.properties.webContextMode === WebContextMode.CustomSite &&
                  PropertyPaneTextField('webUrl', {
                    label: 'Nettadresse',
                    description: 'Angi URL til SharePoint-området',
                    placeholder: this.context.pageContext.web.absoluteUrl
                  }),
                PropertyPaneDropdown('listName', {
                  label: strings.ListNameFieldLabel,
                  options: this._listOptions,
                  selectedKey: this.properties.listName,
                  disabled: this._listsLoading
                }),
                this.properties.listName &&
                  PropertyPaneDropdown('defaultViewId', {
                    label: 'Standardvisning',
                    options: this._viewOptions,
                    selectedKey: this._getSelectedViewKey(),
                    disabled: this._viewsLoading
                  }),
                this.properties.listName &&
                  PropertyFieldMultiSelect('hiddenColumns', {
                    key: 'hiddenColumns',
                    label: 'Skjul kolonner',
                    options: this._columnOptions,
                    selectedKeys: this.properties.hiddenColumns || []
                  })
              ]
            },
            {
              groupName: 'Utseende',
              isCollapsed: false,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Tittel',
                  description: 'Tittel som vises over listen'
                }),
                PropertyPaneDropdown('mode', {
                  label: 'Visningsmodus',
                  options: [
                    { key: DynamicListMode.Multi, text: 'Flere elementer (Rutenettvisning)' },
                    { key: DynamicListMode.Single, text: 'Enkelt element (Detaljvisning)' }
                  ],
                  selectedKey: this.properties.mode || DynamicListMode.Multi
                }),
                PropertyPaneToggle('useProjectContentColumnNames', {
                  label: 'Bruk kolonnenavn fra Prosjektinnholdskolonner',
                  onText: 'På',
                  offText: 'Av'
                })
              ]
            },
            {
              groupName: 'Vis/skjul (Kommandolinje)',
              isCollapsed: true,
              groupFields: [
                PropertyPaneToggle('showCommandBar', {
                  label: 'Vis kommandolinje',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showSearchBox', {
                  label: 'Vis søkeboks',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showViewSelector', {
                  label: 'Vis visningsvelger',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showFilters', {
                  label: 'Vis filtre',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showNewButton', {
                  label: 'Vis Ny-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showEditButton', {
                  label: 'Vis Rediger-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showDeleteButton', {
                  label: 'Vis Slett-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showRefreshButton', {
                  label: 'Vis Oppdater-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showExportButton', {
                  label: 'Vis Eksporter-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showUploadButton', {
                  label: 'Vis Last opp-knapp (dokumentbibliotek)',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showNewWordButton', {
                  label: 'Vis Nytt Word-dokument-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showNewExcelButton', {
                  label: 'Vis Nytt Excel-dokument-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showNewPowerPointButton', {
                  label: 'Vis Nytt PowerPoint-dokument-knapp',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showViewModeToggle', {
                  label: 'Vis mappe/flat visning-veksling',
                  onText: 'På',
                  offText: 'Av'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
