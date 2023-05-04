import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneDropdown, PropertyPaneToggle, IPropertyPaneDropdownOption } from '@microsoft/sp-property-pane'
import strings from 'PortfolioWebPartsStrings'
import { IPortfolioAggregationProps } from 'components/PortfolioAggregation/types'
import { IAggregatedListConfiguration } from 'interfaces/IAggregatedListConfiguration'
import _ from 'lodash'
import { first } from 'underscore'


/**
 * Get options for PropertyPaneDropdown
 * 
 * @param configuration Configuration
 */
const getViewOptions =(configuration: IAggregatedListConfiguration): IPropertyPaneDropdownOption[] =>{
  if (!configuration) return []
  return [...configuration.views.map((view) => ({ key: view.id, text: view.title }))]
}

/**
 * Get property pane configuration for the Portfolio Aggregation web part.
 * 
 * @param configuration Configuration
 * @param properties Properties for the Portfolio Aggregation web part
 */
export const getPropertyPaneConfiguration = (configuration: IAggregatedListConfiguration, properties: IPortfolioAggregationProps): IPropertyPaneConfiguration => {
    return {
        pages: [
          {
            groups: [
              {
                groupName: strings.DataSourceGroupName,
                groupFields: [
                  PropertyPaneTextField('dataSourceCategory', {
                    label: strings.DataSourceCategoryLabel,
                    description: strings.DataSourceCategoryDescription
                  }),
                  PropertyPaneTextField('dataSourceLevel', {
                    label: strings.DataSourceLevelLabel,
                    description: strings.DataSourceLevelDescription,
                    placeholder: configuration?.level
                  }),
                  PropertyPaneDropdown('defaultViewId', {
                    label: strings.DefaultDataSourceViewLabel,
                    options: getViewOptions(configuration),
                    selectedKey:
                      _.find(configuration.views, (v) => v.isDefault)?.id ||
                      first(configuration.views).id
                  })
                ]
              },
              {
                groupName: strings.CommandBarGroupName,
                groupFields: [
                  PropertyPaneToggle('showCommandBar', {
                    label: strings.ShowCommandBarLabel
                  }),
                  PropertyPaneToggle('showFilters', {
                    label: strings.ShowFiltersLabel,
                    disabled: !properties.showCommandBar
                  }),
                  PropertyPaneToggle('showExcelExportButton', {
                    label: strings.ShowExcelExportButtonLabel,
                    disabled: !properties.showCommandBar
                  }),
                  PropertyPaneToggle('showViewSelector', {
                    label: strings.ShowViewSelectorLabel,
                    disabled: !properties.showCommandBar
                  })
                ]
              },
              {
                groupName: strings.SearchBoxGroupName,
                groupFields: [
                  PropertyPaneToggle('showSearchBox', {
                    label: strings.ShowSearchBoxLabel
                  }),
                  PropertyPaneTextField('searchBoxPlaceholderText', {
                    label: strings.SearchBoxPlaceholderTextLabel,
                    description: strings.SearchBoxPlaceholderTextDescription,
                    disabled: !properties.showSearchBox
                  })
                ]
              }
            ]
          }
        ]
      }
}