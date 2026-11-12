import { IRenderItemColumnProps, ProjectColumnConfigDictionaryItem } from 'pp365-shared-library'

/** Cell value and its matching project-column display configuration. */
export interface IConfigColumnProps
  extends Omit<IRenderItemColumnProps, 'color'>, ProjectColumnConfigDictionaryItem {}
