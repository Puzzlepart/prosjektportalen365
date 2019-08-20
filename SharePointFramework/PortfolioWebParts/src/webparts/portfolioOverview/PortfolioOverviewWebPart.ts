import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel } from '@pnp/logging';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { setupWebPart } from '../@setup';


export default class PortfolioOverviewWebPart extends BaseClientSideWebPart<IPortfolioOverviewProps> {
  public render(): void {
    Logger.log({ message: '(PortfolioOverviewWebPart) render: Rendering <PortfolioOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IPortfolioOverviewProps> = React.createElement(PortfolioOverview, {
      ...this.properties,
      pageContext: this.context.pageContext,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(PortfolioOverviewWebPart) onInit: Initializing PortfolioOverviewWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: strings.TitleLabel,
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
