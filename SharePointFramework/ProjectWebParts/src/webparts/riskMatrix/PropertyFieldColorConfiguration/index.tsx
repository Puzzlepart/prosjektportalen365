import {
    IPropertyPaneField,
    PropertyPaneFieldType
} from '@microsoft/sp-property-pane'
import React from 'react'
import { render } from 'react-dom'
import { IPropertyFieldColorConfigurationProps } from './types'
import { PropertyFieldColorConfiguration } from './components/PropertyFieldColorConfiguration'

class PropertyFieldColorConfigurationBuilder implements IPropertyPaneField<IPropertyFieldColorConfigurationProps> {
    public targetProperty: string
    public type: PropertyPaneFieldType = PropertyPaneFieldType.Custom
    public properties: IPropertyFieldColorConfigurationProps

    public constructor(_targetProperty: string, _properties: IPropertyFieldColorConfigurationProps) {
        this.targetProperty = _targetProperty
        this.properties = {
            ..._properties,
            value:[
                { percentage: 10, color: [44, 186, 0] },
                { percentage: 30, color: [163, 255, 0] },
                { percentage: 50, color: [255, 244, 0] },
                { percentage: 70, color: [255, 167, 0] },
                { percentage: 90, color: [255, 0, 0] }
              ],
            onRender: this.onRender.bind(this)
        }
    }

    public onRender(element: HTMLElement, context?: any, changeCallback?: (targetProperty?: string, newValue?: any) => void): void {
        // eslint-disable-next-line no-console
        console.log(context, changeCallback)
        render(<PropertyFieldColorConfiguration {...this.properties} onChange={changeCallback} />, element)
    }
}

export default function (targetProperty: string, properties: Omit<IPropertyFieldColorConfigurationProps, 'onRender'>): IPropertyPaneField<IPropertyFieldColorConfigurationProps> {
    return new PropertyFieldColorConfigurationBuilder(targetProperty, {
        ...properties,
        onRender: null
    })
}