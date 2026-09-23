import { IRenderItemColumnProps, ProjectColumnConfigDictionaryItem } from 'pp365-shared-library'

export interface IConfigColumnProps
  extends Omit<IRenderItemColumnProps, 'color'>, ProjectColumnConfigDictionaryItem {
}
