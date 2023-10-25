import { useMemo } from 'react'
import {
  BoxFilled,
  BoxRegular,
  bundleIcon,
  SlideTextMultipleFilled,
  SlideTextMultipleRegular,
  TagFilled,
  TagRegular
} from '@fluentui/react-icons'
import { ListMenuItem } from '../../../Toolbar'
import strings from 'SharedLibraryStrings'
import { ITimelineProps } from '../types'

/**
 * Object containing icons used in the toolbar.
 */
const Icons = {
  Box: bundleIcon(BoxFilled, BoxRegular),
  Tag: bundleIcon(TagFilled, TagRegular),
  SlideTextMultiple: bundleIcon(SlideTextMultipleFilled, SlideTextMultipleRegular)
}

/**
 * Returns an array of menu items for the toolbar in the Timeline component.
 *
 * @param props - The ITimelineProps object containing the necessary data for generating the toolbar items.
 * @param selectedGroupBy - The currently selected group by value.
 * @param setSelectedGroupBy - The function to set the currently selected group by value.
 * @param setShowFilterPanel - The function to set the visibility of the filter panel.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems(
  setShowFilterPanel: React.Dispatch<React.SetStateAction<boolean>>,
  selectedGroupBy: string,
  setSelectedGroupBy: React.Dispatch<React.SetStateAction<string>>,
  props: ITimelineProps
) {
  const groups = [
    {
      text: strings.ProjectLabel,
      icon: Icons.Box
    },
    {
      text: strings.CategoryFieldLabel,
      icon: Icons.SlideTextMultiple
    },
    {
      text: strings.TypeLabel,
      icon: Icons.Tag
    }
  ]

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        props.isGroupByEnabled &&
          new ListMenuItem(`${strings.GroupByLabel} ${selectedGroupBy}`, null)
            .setIcon(groups.filter((group) => group.text === selectedGroupBy)[0]?.icon)
            .setWidth('fit-content')
            .setStyle({ minWidth: '145px' })
            .setItems(
              groups.map((group) =>
                new ListMenuItem(group.text, null)
                  .setIcon(group.icon)
                  .makeCheckable({
                    name: 'groupBy',
                    value: group.text
                  })
                  .setOnClick(() => {
                    setSelectedGroupBy(group.text)
                    props.onGroupByChange(group.text)
                  })
              ),
              { groupBy: [selectedGroupBy] }
            ),
        new ListMenuItem(null, strings.FilterText).setIcon('Filter').setOnClick((ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          setShowFilterPanel(true)
        })
      ].filter(Boolean),
    [props]
  )

  return menuItems
}
