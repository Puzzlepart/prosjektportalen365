import {
  Badge,
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import React from 'react'
import { SelectionGroup } from '../SelectionGroup'
import { ProjectSetupDialogSectionComponent } from '../types'
import { useContentConfigSection } from './useContentConfigSection'

/**
 * Section for selection of content configurations.
 */
export const ContentConfigSection: ProjectSetupDialogSectionComponent = () => {
  const {
    items,
    selectedKeys,
    onToggle,
    searchTerm,
    onSearch,
    showSearch,
    countText,
    lockedKeys,
    addedKeys,
    plannerKeys,
    onCheckMembership,
    isCheckingMembership,
    membershipCheckFailed
  } = useContentConfigSection()

  return (
    <SelectionGroup
      title={strings.ContentConfigSectionHeaderText}
      info={strings.ContentConfigSectionTooltip}
      items={items}
      selectedKeys={selectedKeys}
      lockedKeys={lockedKeys}
      lockedText={strings.ContentConfigLockedTooltipText}
      onToggle={onToggle}
      countText={countText}
      emptyText={strings.ContentConfigSectionDisabledTooltip}
      note={addedKeys.size > 0 ? strings.ContentConfigAddedInfoText : undefined}
      showSearch={showSearch}
      searchTerm={searchTerm}
      onSearch={onSearch}
      searchLabel={strings.ContentConfigSectionSearchLabel}
      searchPlaceholder={strings.ContentConfigSectionSearchPlaceholder}
      renderItemBadge={(item) =>
        addedKeys.has(String(item.key)) && (
          <Badge appearance='tint' color='informative' size='small'>
            {strings.ContentConfigAddedText}
          </Badge>
        )
      }
      renderItemMessage={(item) =>
        plannerKeys.has(String(item.key)) && (
          <MessageBar intent='warning' layout='multiline'>
            <MessageBarBody>
              {strings.PlannerMembershipPendingMessage}
              {membershipCheckFailed && ` ${strings.PlannerMembershipStillPendingText}`}
            </MessageBarBody>
            {onCheckMembership && (
              <MessageBarActions>
                <Button
                  size='small'
                  disabledFocusable={isCheckingMembership}
                  icon={isCheckingMembership ? <Spinner size='tiny' /> : undefined}
                  onClick={onCheckMembership}
                >
                  {strings.PlannerMembershipRecheckButtonText}
                </Button>
              </MessageBarActions>
            )}
          </MessageBar>
        )
      }
    />
  )
}
