import { IRenderItemColumnProps } from '../types'

/**
 * Configures the separator used to split a column value into tags.
 */
export interface ITagsColumnProps extends IRenderItemColumnProps {
  valueSeparator?: string
}
