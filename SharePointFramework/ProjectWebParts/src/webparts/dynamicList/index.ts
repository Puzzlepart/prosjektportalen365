import * as React from 'react'
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneDropdown,
  PropertyPaneButton,
  IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane'
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'
import { PropertyFieldOrder } from '@pnp/spfx-property-controls/lib/PropertyFieldOrder'
import {
  PropertyFieldCollectionData,
  CustomCollectionFieldType
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import { IDynamicListProps, DynamicListMode, WebContextMode } from 'components/DynamicList'
import { DynamicList } from 'components/DynamicList/DynamicList'
import '@fluentui/react/dist/css/fabric.min.css'
import { BaseProjectWebPart } from '../baseProjectWebPart'
import * as strings from 'ProjectWebPartsStrings'
import SPDataAdapter from '../../data'
import { getWeb } from '../../components/DynamicList/utils'
import { isVisibleListField } from '../../components/DynamicList/utils/fieldUtils'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/views'
import '@pnp/sp/fields'

export default class DynamicListWebPart extends BaseProjectWebPart<IDynamicListProps> {
  private _listOptions: IPropertyPaneDropdownOption[] = []
  private _listsLoading: boolean = false
  private _viewOptions: IPropertyPaneDropdownOption[] = []
  private _viewsLoading: boolean = false
  private _columnOptions: IPropertyPaneDropdownOption[] = []
  private _columnsLoading: boolean = false

  public async onInit() {
    await super.onInit()
    await this._loadListOptions()

    if (this.properties.listName) {
      await this._loadViewOptions()
      await this._loadColumnOptions()
    }
  }

  /**
   * Load available lists from the selected site (or current site if not specified)
   * Excludes hidden lists and folder lists.
   */
  private async _loadListOptions(): Promise<void> {
    try {
      this._listsLoading = true

      const web = getWeb(
        this.properties.webUrl,
        this.properties.webContextMode || WebContextMode.CurrentProject
      )

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
          })`,
          data: { baseTemplate: list.BaseTemplate }
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

      const web = getWeb(
        this.properties.webUrl,
        this.properties.webContextMode || WebContextMode.CurrentProject
      )

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
   * Load available columns from the selected list.
   * Uses the exact same filtering logic as fetchListData to ensure consistency.
   */
  private async _loadColumnOptions(): Promise<void> {
    try {
      this._columnsLoading = true

      if (!this.properties.listName) {
        this._columnOptions = []
        this._columnsLoading = false
        return
      }

      const web = getWeb(
        this.properties.webUrl,
        this.properties.webContextMode || WebContextMode.CurrentProject
      )

      const allFields = await SPDataAdapter.portalDataService.getListFields(
        this.properties.listName,
        undefined,
        web
      )

      let projectContentColumns = []
      try {
        if (SPDataAdapter.portalDataService?.isConfigured) {
          projectContentColumns = await SPDataAdapter.portalDataService.fetchProjectContentColumns(
            'PROJECT_CONTENT_COLUMNS'
          )
        }
      } catch (error) {
        console.warn('Could not fetch ProjectContentColumns configuration:', error)
      }

      this._columnOptions = allFields
        .filter((field) => isVisibleListField(field, projectContentColumns))
        .map((field) => ({
          key: field.InternalName,
          text: field.Title
        }))

      // Store available columns in properties for PropertyFieldOrder
      this.properties.availableColumns = this._columnOptions.map((opt) => opt.key as string)

      this._columnsLoading = false
    } catch (error) {
      console.error('Error loading columns:', error)
      this._columnOptions = []
      this._columnsLoading = false
    }
  }

  public render(): void {
    this.renderComponent<IDynamicListProps>(DynamicList)
  }

  /**
   * Checks if the selected list has a GtSiteId field
   */
  private _hasSiteIdField(): boolean {
    const hasGtSiteId = this._columnOptions.some((col) => col.key === 'GtSiteId')
    const hasGtSiteTitle = this._columnOptions.some((col) => col.key === 'GtSiteTitle')
    return hasGtSiteId && hasGtSiteTitle
  }

  /**
   * Checks if the selected list is a document library using BaseTemplate
   */
  private _isDocumentLibrary(): boolean {
    const selectedList = this._listOptions.find((opt) => opt.key === this.properties.listName)
    return (selectedList as any)?.data?.baseTemplate === 101
  }

  /**
   * Adds GtSiteId field to the selected list
   */
  private async _addSiteIdColumn(): Promise<void> {
    if (!this.properties.listName) return

    try {
      const web = getWeb(
        this.properties.webUrl,
        this.properties.webContextMode || WebContextMode.CurrentProject
      )

      const list = web.lists.getByTitle(this.properties.listName)

      await list.fields.addText('GtSiteId', {
        MaxLength: 255,
        Group: 'Prosjektportalen'
      })

      await list.fields.getByInternalNameOrTitle('GtSiteId').update({
        Title: 'Område-ID',
        Description: 'ID for området/prosjektet som elementet tilhører'
      })

      await list.fields.addText('GtSiteTitle', {
        MaxLength: 255,
        Group: 'Prosjektportalen'
      })

      await list.fields.getByInternalNameOrTitle('GtSiteTitle').update({
        Title: 'Område tittel',
        Description: 'Tittel for området/prosjektet som elementet tilhører'
      })

      await this._loadColumnOptions()
      this.context.propertyPane.refresh()

      alert('Område-ID og Område tittel kolonnene ble opprettet!')
    } catch (error) {
      console.error('Error adding GtSiteId and GtSiteTitle columns:', error)
      alert('Kunne ikke opprette kolonnene. Se konsollen for detaljer.')
    }
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
      this.properties.hiddenViewColumns = []
      this.properties.nonFilterableColumns = []
      await this._loadListOptions()
      this.context.propertyPane.refresh()
    }

    if (propertyPath === 'listName') {
      this.properties.viewName = 'All Fields'
      this.properties.defaultViewId = null
      this.properties.hiddenColumns = []
      this.properties.hiddenViewColumns = []
      this.properties.nonFilterableColumns = []
      this.properties.availableColumns = []
      this.properties.columnOrder = []
      await this._loadViewOptions()
      await this._loadColumnOptions()
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

      await this._loadColumnOptions()
      this.context.propertyPane.refresh()
      this.render()
    }

    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue)
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
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
                    disabled: true
                  })
              ]
            },
            {
              groupName: 'Felter og kolonner',
              isCollapsed: true,
              groupFields: [
                this.properties.listName &&
                  PropertyFieldMultiSelect('hiddenColumns', {
                    key: 'hiddenColumns',
                    label: 'Skjulte felt (redigeringspanel)',
                    options: this._columnOptions,
                    selectedKeys: this.properties.hiddenColumns || [],
                    disabled: this._columnsLoading
                  }),
                this.properties.listName &&
                  PropertyFieldMultiSelect('hiddenViewColumns', {
                    key: 'hiddenViewColumns',
                    label: 'Skjulte kolonner (listevisning)',
                    options: this._columnOptions,
                    selectedKeys: this.properties.hiddenViewColumns || [],
                    disabled: this._columnsLoading
                  }),
                this.properties.listName &&
                  PropertyFieldMultiSelect('nonFilterableColumns', {
                    key: 'nonFilterableColumns',
                    label: 'Ikke-filtrerbare kolonner',
                    options: this._columnOptions,
                    selectedKeys: this.properties.nonFilterableColumns || [],
                    disabled: this._columnsLoading
                  }),
                this.properties.listName &&
                  PropertyFieldOrder('columnOrder', {
                    key: 'columnOrder',
                    label: 'Kolonnerekkefølge',
                    items: this.properties.availableColumns || [],
                    onRenderItem: (fieldName: string) => {
                      const option = this._columnOptions.find((opt) => opt.key === fieldName)
                      return React.createElement('span', null, option?.text || fieldName)
                    },
                    disabled: this._columnsLoading,
                    properties: this.properties,
                    onPropertyChange: this.onPropertyPaneFieldChanged
                  })
              ]
            },
            {
              groupName: 'Utseende',
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Tittel',
                  description: 'Tittel som vises over listen'
                }),
                PropertyPaneTextField('minHeight', {
                  label: 'Minimum høyde',
                  description:
                    'Minimum høyde for webdelen (f.eks. 500px, 50vh, eller bare tall for piksler) NB! Gjelder kun listevisning'
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
                }),
                PropertyPaneToggle('showItemTitle', {
                  label: 'Vis elementtittel (enkeltvisning)',
                  onText: 'På',
                  offText: 'Av'
                })
              ]
            },
            {
              groupName: 'Område-id funksjonalitet',
              isCollapsed: true,
              groupFields: [
                PropertyPaneToggle('useSiteIdFiltering', {
                  label: 'Anvend område-id funksjonalitet',
                  onText: 'På',
                  offText: 'Av',
                  checked: this.properties.useSiteIdFiltering || false
                }),
                this.properties.useSiteIdFiltering &&
                  !this._hasSiteIdField() &&
                  PropertyPaneButton('addSiteIdColumn', {
                    text: 'Legg til område-id kolonne',
                    buttonType: 0,
                    onClick: () => this._addSiteIdColumn()
                  }),
                this.properties.useSiteIdFiltering &&
                  this._isDocumentLibrary() &&
                  PropertyPaneToggle('useProjectFolder', {
                    label: 'Anvend prosjektmappe i dokumentbibliotek',
                    onText: 'På',
                    offText: 'Av',
                    checked: this.properties.useProjectFolder || false
                  })
              ].filter(Boolean)
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
                }),
                PropertyPaneToggle('showCustomActions', {
                  label: 'Vis egendefinerte handlinger',
                  onText: 'På',
                  offText: 'Av'
                })
              ]
            },
            {
              groupName: 'Egendefinerte handlinger',
              isCollapsed: true,
              groupFields: [
                PropertyFieldCollectionData('customActions', {
                  key: 'customActionsCollection',
                  label: 'Egendefinerte handlinger for kommandolinje',
                  panelProps: {
                    type: 6
                  },
                  panelHeader: 'Konfigurer egendefinerte handlinger',
                  manageBtnLabel: 'Konfigurer handlinger',
                  value: this.properties.customActions || [],
                  fields: [
                    {
                      id: 'order',
                      title: 'Rekkefølge',
                      type: CustomCollectionFieldType.number,
                      defaultValue: 10
                    },
                    {
                      id: 'name',
                      title: 'Navn',
                      type: CustomCollectionFieldType.string,
                      required: true,
                      placeholder: 'F.eks. Send til godkjenning'
                    },
                    {
                      id: 'icon',
                      title: 'Ikon',
                      type: CustomCollectionFieldType.string,
                      placeholder: 'F.eks. Send, Checkmark, Edit'
                    },
                    {
                      id: 'description',
                      title: 'Beskrivelse',
                      type: CustomCollectionFieldType.string,
                      placeholder: 'Beskrivelse/tooltip for handlingen'
                    },
                    {
                      id: 'actionType',
                      title: 'Handlingstype',
                      type: CustomCollectionFieldType.dropdown,
                      required: true,
                      options: [
                        { key: 'Trigger', text: 'Trigger (POST til URL)' },
                        { key: 'Dialog', text: 'Dialog (iframe)' }
                      ],
                      defaultValue: 'Trigger'
                    },
                    {
                      id: 'hookUrl',
                      title: 'Hook URL',
                      type: CustomCollectionFieldType.string,
                      placeholder: 'https://...',
                      required: false
                    },
                    {
                      id: 'iframeContent',
                      title: 'iframe-innhold (for Dialog)',
                      type: CustomCollectionFieldType.custom,
                      onCustomRender: (field, value, onUpdate) => {
                        return React.createElement('textarea', {
                          value: value || '',
                          onChange: (e: any) => onUpdate(field.id, e.target.value),
                          placeholder:
                            '<iframe src="https://..." width="100%" height="500px"></iframe>',
                          rows: 6,
                          style: {
                            width: '100%',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            padding: '8px'
                          }
                        })
                      }
                    }
                  ]
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
