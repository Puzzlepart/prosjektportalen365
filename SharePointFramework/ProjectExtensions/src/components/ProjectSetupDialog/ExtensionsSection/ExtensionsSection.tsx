import strings from 'ProjectExtensionsStrings'
import React from 'react'
import { SelectionGroup } from '../SelectionGroup'
import { ProjectSetupDialogSectionComponent } from '../types'
import { useExtensionsSection } from './useExtensionsSection'

/**
 * Section for selection of project extensions.
 */
export const ExtensionsSection: ProjectSetupDialogSectionComponent = () => {
  const { items, selectedKeys, onToggle, searchTerm, onSearch, showSearch, countText, lockedKeys } =
    useExtensionsSection()

  return (
    <SelectionGroup
      title={strings.ExtensionsSectionHeaderText}
      info={strings.ExtensionsSectionTooltip}
      items={items}
      selectedKeys={selectedKeys}
      lockedKeys={lockedKeys}
      lockedText={strings.ExtensionLockedTooltipText}
      onToggle={onToggle}
      countText={countText}
      emptyText={strings.ExtensionsSectionDisabledTooltip}
      showSearch={showSearch}
      searchTerm={searchTerm}
      onSearch={onSearch}
      searchLabel={strings.ExtensionsSectionSearchLabel}
      searchPlaceholder={strings.ExtensionsSectionSearchPlaceholder}
    />
  )
}
