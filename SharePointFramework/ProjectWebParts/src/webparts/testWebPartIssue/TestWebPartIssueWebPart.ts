import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'TestWebPartIssueWebPartStrings';
import TestWebPartIssue from './components/TestWebPartIssue';
import { ITestWebPartIssueProps } from './components/ITestWebPartIssueProps';

export interface ITestWebPartIssueWebPartProps {
  description: string;
}

export default class TestWebPartIssueWebPart extends BaseClientSideWebPart<ITestWebPartIssueWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ITestWebPartIssueProps > = React.createElement(
      TestWebPartIssue,
      {
        description: this.properties.description
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
