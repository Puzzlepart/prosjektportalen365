import { Version } from '@microsoft/sp-core-library'
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { getColumns } from 'pp365-portfoliowebparts/lib/components/BenefitsOverview/columns'
import {
  CONTENT_TYPE_ID_BENEFITS,
  CONTENT_TYPE_ID_INDICATORS,
  CONTENT_TYPE_ID_MEASUREMENTS
} from 'pp365-portfoliowebparts/lib/components/BenefitsOverview/config'
import { PortfolioAggregation } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import {
  Benefit,
  BenefitMeasurement,
  BenefitMeasurementIndicator
} from 'pp365-portfoliowebparts/lib/models'
import * as strings from 'ProgramWebPartsStrings'
import React from 'react'
import * as ReactDom from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IProgramBenefitsWebPartProps } from './types'

export default class ProgramBenefitsWebPart extends BaseProgramWebPart<IProgramBenefitsWebPartProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    const columns = getColumns({ hiddenColumns: [] })
    ReactDom.render(
      <>
        <PortfolioAggregation
          title={this.pageTitle ?? this.properties.title}
          pageContext={this.context.pageContext}
          dataAdapter={this.dataAdapter}
          showCommandBar={this.properties.showCommandBar}
          showExcelExportButton={this.properties.showExcelExportButton}
          showSearchBox={this.properties.showSearchBox}
          dataSource={this.properties.dataSource}
          columns={columns}
          selectProperties={[
            'Path',
            'SPWebURL',
            'Title',
            'ListItemId',
            'SiteTitle',
            'SiteId',
            'ContentTypeID',
            'GtDesiredValueOWSNMBR',
            'GtMeasureIndicatorOWSTEXT',
            'GtMeasurementUnitOWSCHCS',
            'GtStartValueOWSNMBR',
            'GtMeasurementValueOWSNMBR',
            'GtMeasurementCommentOWSMTXT',
            'GtMeasurementDateOWSDATE',
            'GtGainsResponsibleOWSUSER',
            'GtGainsTurnoverOWSMTXT',
            'GtGainsTypeOWSCHCS',
            'GtPrereqProfitAchievementOWSMTXT',
            'GtRealizationTimeOWSDATE',
            'GtGainLookupId',
            'GtMeasureIndicatorLookupId',
            'GtGainsResponsible',
            'GtGainsOwner',
            'Path',
            'SPWebURL',
            'SiteTitle'
          ]}
          postTransform={this._postTransform}
          lockedColumns={true}
          isParent={true}
          onUpdateProperty={this._onUpdateProperty}
        />
      </>,
      this.domElement
    )
  }

  private _postTransform(results: any[]): any[] {
    const benefits = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_BENEFITS) === 0)
      .map((res) => new Benefit(res))
    const measurements = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_MEASUREMENTS) === 0)
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())
    const indicactors = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_INDICATORS) === 0)
      .map((res) => {
        const indicator = new BenefitMeasurementIndicator(res)
          .setMeasurements(measurements)
          .setBenefit(benefits)
        return indicator
      })
      .filter((i) => i.Benefit)
    return indicactors
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0')
  }

  private _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    this.context.propertyPane.refresh()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupFields: [
                PropertyPaneTextField('webPartTitle', {
                  label: strings.WebPartTitleLabel,
                  value: strings.BenefitsTitle
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel,
                  value: strings.BenefitDataSource
                }),
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel,
                  checked: true
                }),
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel,
                  checked: true
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel,
                  checked: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
