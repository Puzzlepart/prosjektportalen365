import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as strings from "ProgramWebPartsStrings";
import ProgramAddProject from "components/ProgramAddProject/ProgramAddProject";
import { IProgramAddProjectProps } from "../../components/ProgramAddProject/IProgramAddProjectProps";

export interface IProgramAddProjectWebPartProps {
  description: string;
}

export default class ProgramAddProjectWebPart extends BaseClientSideWebPart<IProgramAddProjectWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IProgramAddProjectProps> =
      React.createElement(ProgramAddProject, {
        description: this.properties.description,
      });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.BenefitOwnerLabel,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: "test",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
