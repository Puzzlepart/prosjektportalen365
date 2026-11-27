import { useAnnounce } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { ContentConfigType, format } from 'pp365-shared-library'
import { useState } from 'react'
import { isAddedBefore } from '../../../extensions/projectSetup/listContentRecord'
import { ProjectSetupValidation } from '../../../extensions/projectSetup/types'
import { useProjectSetupDialogContext } from '../context'
import { ON_LIST_CONTENT_CONFIG_CHANGED } from '../reducer'
import { SEARCH_MIN_ITEMS } from '../types'
import { useItemOrder } from '../useItemOrder'
import { useSearchAnnouncement } from '../useSearchAnnouncement'

/** Filters list content and manages mandatory selections, allowing existing content to be re-added. */
export function useContentConfigSection() {
  const context = useProjectSetupDialogContext()
  const [searchTerm, setSearchTerm] = useState('')

  const template = context.state.selectedTemplate
  // A cloud template brings its own list content, known once its package has been read.
  const available = !template
    ? []
    : template.isCloudTemplate
      ? (context.state.resolvedCloudTemplate?.contentConfig ?? [])
      : (context.props.data.contentConfig ?? [])
  const allItems = available.filter((contentConfig) => !contentConfig.hidden)

  const addedKeys = new Set(
    allItems
      .filter((item) => isAddedBefore(context.props.data.addedListContent, template, item))
      .map((item) => String(item.key))
  )

  const mandatoryKeys = new Set(
    allItems
      .filter((item) => item.isMandatoryForTemplate(template) && !addedKeys.has(String(item.key)))
      .map((item) => String(item.key))
  )

  const selectedKeys = new Set(context.state.selectedContentConfig.map((e) => String(e.key)))

  const sortedItems = useItemOrder(
    allItems,
    (item) =>
      mandatoryKeys.has(String(item.key)) ? 0 : selectedKeys.has(String(item.key)) ? 1 : 2,
    `${template?.id}|${context.state.resolvedCloudTemplate?.templateId}`
  )

  const items = searchTerm
    ? sortedItems.filter(
        (item) =>
          item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          selectedKeys.has(String(item.key))
      )
    : sortedItems

  const onSelectionChange = (selectedIds: (string | number)[]) => {
    const newSelection = new Set(selectedIds.map(String))
    mandatoryKeys.forEach((key) => newSelection.add(key))
    const selectedItems = allItems.filter((item) => newSelection.has(String(item.key)))
    context.dispatch(ON_LIST_CONTENT_CONFIG_CHANGED(selectedItems))
  }

  const onToggle = (key: string, checked: boolean) =>
    onSelectionChange(
      checked ? [...selectedKeys, key] : [...selectedKeys].filter((selected) => selected !== key)
    )

  // Hidden selections are applied but never listed, so they are not counted.
  const visibleSelectedCount = allItems.filter((item) => selectedKeys.has(String(item.key))).length

  const countText = format(strings.SelectedOfTotalLabel, visibleSelectedCount, allItems.length)
  useSearchAnnouncement(searchTerm, items.length, allItems.length)

  // Planner refuses a user Microsoft 365 has not registered as a member of the group yet, which
  // on a new site takes some minutes: said on the Planner content it concerns, with a way to ask
  // again without loading the page.
  const { announce } = useAnnounce()
  const [isMembershipPending, setIsMembershipPending] = useState(
    context.props.validation === ProjectSetupValidation.UserNotGroupMember
  )
  const [isCheckingMembership, setIsCheckingMembership] = useState(false)
  const [membershipCheckFailed, setMembershipCheckFailed] = useState(false)
  const plannerKeys = new Set(
    isMembershipPending
      ? allItems
          .filter(
            (item) => item.type === ContentConfigType.Planner && selectedKeys.has(String(item.key))
          )
          .map((item) => String(item.key))
      : []
  )

  const onCheckMembership = context.props.onCheckGroupMembership
    ? async () => {
        setIsCheckingMembership(true)
        let isMember = false
        try {
          isMember = await context.props.onCheckGroupMembership()
        } catch {
          isMember = false
        }
        setIsCheckingMembership(false)
        setIsMembershipPending(!isMember)
        setMembershipCheckFailed(!isMember)
        announce(
          isMember
            ? strings.PlannerMembershipConfirmedText
            : strings.PlannerMembershipStillPendingText,
          { polite: true }
        )
      }
    : undefined

  return {
    items,
    selectedKeys,
    onSelectionChange,
    onToggle,
    searchTerm,
    onSearch: setSearchTerm,
    showSearch: allItems.length > SEARCH_MIN_ITEMS,
    countText,
    // What the template requires stays selected.
    lockedKeys: mandatoryKeys,
    addedKeys,
    plannerKeys,
    onCheckMembership,
    isCheckingMembership,
    membershipCheckFailed
  }
}
