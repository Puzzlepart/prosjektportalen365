import { IRenderItemColumnProps, ProjectColumnConfigDictionaryItem } from 'pp365-shared-library'
import { ICalloutProps } from '@fluentui/react'

export interface IConfigColumnProps
  extends Omit<IRenderItemColumnProps, 'color'>,
    ProjectColumnConfigDictionaryItem {
  calloutProps?: ICalloutProps
}
