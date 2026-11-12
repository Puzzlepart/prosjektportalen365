import {
  ContentView24Filled,
  ContentView24Regular,
  EditFilled,
  EditRegular,
  FormNewFilled,
  FormNewRegular,
  bundleIcon
} from '@fluentui/react-icons'

/**
 * Stable bundled icon components for aggregation view commands.
 */
export const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular),
  FormNew: bundleIcon(FormNewFilled, FormNewRegular),
  Edit: bundleIcon(EditFilled, EditRegular)
}
