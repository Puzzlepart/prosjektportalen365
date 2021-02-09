import { View } from '../Views'

export default interface IFooterProps {
  /**
   * Current view
   */
  view: View

  /**
   * Set view
   */
  setView: (view: View) => void
}
