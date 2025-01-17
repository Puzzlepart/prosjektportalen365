import { getId } from '@fluentui/react';
import { IPropertyPaneCustomFieldProps, IPropertyPaneField, PropertyPaneFieldType } from '@microsoft/sp-property-pane'
import { createElement } from "react";
import { render, unmountComponentAtNode } from "react-dom";

interface IPropertyPaneDescriptionProps extends IPropertyPaneCustomFieldProps {
    description: string
    hidden?: boolean
}

class PropertyPaneDescriptionBuilder implements IPropertyPaneField<IPropertyPaneDescriptionProps> {
    public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom;
    public targetProperty: string;
    public properties: IPropertyPaneDescriptionProps;
    private elem: HTMLElement;

    constructor(targetProperty: string, properties: IPropertyPaneDescriptionProps) {
        this.targetProperty = targetProperty;
        this.properties = {
            ...properties,
            onRender: this.onRender.bind(this),
            onDispose: this.onDispose.bind(this)
        };
    }

    public render(): void {
        if (!this.elem) {
            return;
        }

        this.onRender(this.elem);
    }

    private onDispose(element: HTMLElement): void {
        unmountComponentAtNode(element);
    }

    private onRender(elem: HTMLElement): void {
        if (!this.elem) {
            this.elem = elem;
        }
        render(createElement('div', {
            hidden: this.properties.hidden,
            style: {
                padding: '4px 0 0 0',
                color: 'rgb(96, 94, 92)',
                fontSize: 10
            }
        }, this.properties.description), elem);
    }
}

/**
 * Helper method to create a description element for the property pane.
 * 
 * @param description The description to show
 * @param condition Condition to show the description
 */
export function PropertyPaneDescription(description: string, condition = true): IPropertyPaneField<any> {
    const targetProperty = getId('PropertyPaneDescription');
    const key = getId('PropertyPaneDescription');
    return new PropertyPaneDescriptionBuilder(targetProperty, {
        description,
        hidden: !condition,
        key,
        onRender: null,
        onDispose: null
    })
}