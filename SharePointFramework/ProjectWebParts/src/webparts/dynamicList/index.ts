import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneSlider,
  PropertyPaneDropdown,
  IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane'
import { IDynamicListProps, DynamicListMode } from 'components/DynamicList'
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

  public async onInit() {
    await super.onInit()
    // Load lists for the current/selected site
    await this._loadListOptions()
    // Load views for the selected list
    if (this.properties.listName) {
      await this._loadViewOptions()
    }
  }

  /**
   * Load available lists from the selected site (or current site if not specified)
   */
  private async _loadListOptions(): Promise<void> {
    try {
      this._listsLoading = true

      const lists = await SPDataAdapter.sp.web.lists
        .select('Title', 'Id', 'Hidden', 'BaseTemplate', 'ItemCount')
        .filter('Hidden eq false and BaseTemplate ne 850')() // Exclude hidden lists and document libraries

      this._listOptions = lists
        .filter(
          (list) => !list.Title.startsWith('_') && list.BaseTemplate === 100 // Generic list
        )
        .sort((a, b) => a.Title.localeCompare(b.Title))
        .map((list) => ({
          key: list.Title,
          text: `${list.Title} (${list.ItemCount || 0} elementer)`
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
   */
  private async _loadViewOptions(): Promise<void> {
    try {
      this._viewsLoading = true

      if (!this.properties.listName) {
        this._viewOptions = [{ key: 'All Fields', text: 'Alle felt' }]
        this._viewsLoading = false
        return
      }

      const list = SPDataAdapter.sp.web.lists.getByTitle(this.properties.listName)
      const views = await list.views
        .select('Title', 'Id', 'DefaultView')
        .filter('Hidden eq false')()

      // Always add "All Fields" as the first option
      this._viewOptions = [
        { key: 'All Fields', text: 'Alle felt' },
        ...views
          .sort((a, b) => {
            // Default view first, then alphabetically
            if (a.DefaultView) return -1
            if (b.DefaultView) return 1
            return a.Title.localeCompare(b.Title)
          })
          .map((view) => ({
            key: view.Id, // Use ID as key for better integration
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

  public render(): void {
    this.renderComponent<IDynamicListProps>(DynamicList)
  }

  protected async onPropertyPaneFieldChanged(
    propertyPath: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    // When webUrl changes, reload the list options
    if (propertyPath === 'webUrl') {
      this.properties.listName = '' // Clear the selected list
      this.properties.viewName = 'All Fields' // Reset to default view
      this.properties.defaultViewId = null // Clear default view ID
      await this._loadListOptions()
      this.context.propertyPane.refresh()
    }

    // When listName changes, reload the view options
    if (propertyPath === 'listName') {
      this.properties.viewName = 'All Fields' // Reset to default view
      this.properties.defaultViewId = null // Clear default view ID
      await this._loadViewOptions()
      this.context.propertyPane.refresh()
    }

    // When defaultViewId changes, update viewName for backward compatibility
    if (propertyPath === 'defaultViewId') {
      if (newValue && newValue !== 'All Fields') {
        // Find the view title from the options
        const selectedView = this._viewOptions.find((opt) => opt.key === newValue)
        this.properties.viewName = (selectedView as any)?.data?.title || newValue
      } else {
        this.properties.viewName = 'All Fields'
      }
    }

    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue)
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: 'Listeinnstillinger',
              groupFields: [
                PropertyPaneTextField('webUrl', {
                  label: 'Nettadresse',
                  description: 'La stå tom for å bruke gjeldende område',
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
                PropertyPaneTextField('title', {
                  label: 'Tittel',
                  description: 'Tittel som vises over listen'
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
                PropertyPaneDropdown('mode', {
                  label: 'Visningsmodus',
                  options: [
                    { key: DynamicListMode.Multi, text: 'Flere elementer (Rutenettvisning)' },
                    { key: DynamicListMode.Single, text: 'Enkelt element (Detaljvisning)' }
                  ],
                  selectedKey: this.properties.mode || DynamicListMode.Multi
                }),
                PropertyPaneSlider('maxItems', {
                  label: 'Maksimalt antall elementer',
                  min: 0,
                  max: 10,
                  step: 1,
                  value: this.properties.maxItems || 0,
                  showValue: true
                }),
                PropertyPaneToggle('showCommandBar', {
                  label: 'Vis kommandolinje',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('showFilters', {
                  label: 'Vis filtre',
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneSlider('pageSize', {
                  label: 'Elementer per side',
                  min: 10,
                  max: 100,
                  step: 10,
                  value: this.properties.pageSize || 30,
                  showValue: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
