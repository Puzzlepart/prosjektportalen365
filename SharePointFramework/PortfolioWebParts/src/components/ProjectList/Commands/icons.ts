import {
  AppsListFilled,
  AppsListRegular,
  GridFilled,
  GridRegular,
  TextBulletListLtrFilled,
  TextBulletListLtrRegular,
  TextSortAscendingFilled,
  TextSortAscendingRegular,
  TextSortDescendingFilled,
  TextSortDescendingRegular,
  bundleIcon
} from '@fluentui/react-icons'

/**
 * Object containing icons used in the `Commands` component.
 */
export const Icons = {
  Grid: bundleIcon(GridFilled, GridRegular),
  AppsList: bundleIcon(AppsListFilled, AppsListRegular),
  TextBulletList: bundleIcon(TextBulletListLtrFilled, TextBulletListLtrRegular),
  TextSortAscending: bundleIcon(TextSortAscendingFilled, TextSortAscendingRegular),
  TextSortDescending: bundleIcon(TextSortDescendingFilled, TextSortDescendingRegular)
}