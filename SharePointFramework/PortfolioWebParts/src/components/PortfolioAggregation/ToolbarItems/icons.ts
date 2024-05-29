import {
  ContentView24Filled,
  ContentView24Regular,
  EditFilled,
  EditRegular,
  FormNewFilled,
  FormNewRegular, bundleIcon
} from '@fluentui/react-icons'

/**
 * Object containing icons used in the toolbar.
 */
export const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular),
  FormNew: bundleIcon(FormNewFilled, FormNewRegular),
  Edit: bundleIcon(EditFilled, EditRegular)
}
