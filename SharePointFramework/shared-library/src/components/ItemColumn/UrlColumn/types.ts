import { IRenderItemColumnProps } from '../types'

/**
 * Configures a link column's text and navigation target.
 */
export interface IUrlColumnProps extends IRenderItemColumnProps {
  openInNewTab?: boolean
  description?: string
}
