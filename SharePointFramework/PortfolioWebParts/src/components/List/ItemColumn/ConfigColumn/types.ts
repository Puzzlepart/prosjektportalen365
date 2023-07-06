import { ProjectColumnConfigDictionaryItem } from 'pp365-shared-library'
import { IRenderItemColumnProps } from '../types'
import { ICalloutProps } from '@fluentui/react'

export interface IConfigColumnProps
  extends Omit<IRenderItemColumnProps, 'color'>,
    ProjectColumnConfigDictionaryItem {
  calloutProps?: ICalloutProps
}
