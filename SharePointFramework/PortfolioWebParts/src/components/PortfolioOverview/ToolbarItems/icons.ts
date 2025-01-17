import {
    AppsListFilled,
    AppsListRegular,
    bundleIcon,
    ChevronLeftFilled,
    ChevronLeftRegular,
    CollectionsFilled,
    CollectionsRegular,
    ContentView24Filled,
    ContentView24Regular,
    EditFilled,
    EditRegular,
    FormNewFilled,
    FormNewRegular,
    TextBulletListLtrFilled,
    TextBulletListLtrRegular
} from '@fluentui/react-icons'

/**
 * Object containing icons used in the toolbar.
 */
export const Icons = {
    ContentView: bundleIcon(ContentView24Filled, ContentView24Regular),
    AppsList: bundleIcon(AppsListFilled, AppsListRegular),
    TextBulletList: bundleIcon(TextBulletListLtrFilled, TextBulletListLtrRegular),
    ChevronLeft: bundleIcon(ChevronLeftFilled, ChevronLeftRegular),
    FormNew: bundleIcon(FormNewFilled, FormNewRegular),
    Edit: bundleIcon(EditFilled, EditRegular),
    Collections: bundleIcon(CollectionsFilled, CollectionsRegular)
}