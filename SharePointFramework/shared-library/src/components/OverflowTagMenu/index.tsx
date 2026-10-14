import {
  InteractionTag,
  InteractionTagPrimary,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  Tag,
  TagGroup,
  useIsOverflowItemVisible,
  useOverflowMenu
} from '@fluentui/react-components'
import React, { FC } from 'react'
import strings from 'SharedLibraryStrings'
import _ from 'underscore'
import styles from './OverflowTagMenu.module.scss'
import { IOverflowTagMenuProps, OverflowMenuItemProps } from './types'
import { useOverflowTagMenu } from './useOverflowTagMenu'
import { format, withDefaults } from '../../util'

const OverflowMenuItem: FC<OverflowMenuItemProps> = (props) => {
  const { tag } = props
  const isVisible = useIsOverflowItemVisible(tag?.value ?? '')

  if (isVisible || !tag?.value) return null

  return (
    <MenuItem key={tag.value} className={styles.menuItem}>
      <Tag className={styles.tag} title={tag.value} appearance='brand' size='small'>
        {tag.value}
      </Tag>
    </MenuItem>
  )
}

/**
 * The `+n` button for the tags out of room, and the menu that lists them. An item of the tags'
 * list, so the list holds items only. The button is named by how many tags it holds, and takes the
 * menu trigger's state (`aria-haspopup`, `aria-expanded`) on itself, the element that has focus.
 */
const OverflowMenu: FC<{
  tags: {
    key: string
    value: string
    primaryText: string
    children: string
  }[]
}> = (props) => {
  const { tags } = props
  const { isOverflowing, overflowCount } = useOverflowMenu<HTMLButtonElement>()

  if (!isOverflowing) {
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const name = format(strings.Aria.MenuOverflowCount, overflowCount)

  return (
    <div role='listitem' onClick={handleClick} onMouseDown={handleClick}>
      <InteractionTag appearance='brand'>
        <Menu closeOnScroll>
          <MenuTrigger disableButtonEnhancement>
            <InteractionTagPrimary
              aria-label={name}
              title={name}
              primaryText={`+${overflowCount}`}
            />
          </MenuTrigger>
          <MenuPopover style={{ maxWidth: 600 }}>
            <MenuList hasCheckmarks={false}>
              {!_.isEmpty(tags) &&
                tags
                  .slice(-overflowCount)
                  .map((tag) => <OverflowMenuItem key={tag.key} tag={tag} />)}
            </MenuList>
          </MenuPopover>
        </Menu>
      </InteractionTag>
    </div>
  )
}

const OVERFLOW_TAG_MENU_DEFAULT_PROPS: Partial<IOverflowTagMenuProps> = {
  minimumVisibleTags: 1
}

/**
 * Tags as a list of labels; those that do not fit go behind a `+n` button that opens a menu of
 * them. The tags are text, not buttons, since they do nothing when clicked, and the list is named
 * by `text` when it has one (WCAG 4.1.2).
 */
export const OverflowTagMenu: FC<IOverflowTagMenuProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, OVERFLOW_TAG_MENU_DEFAULT_PROPS)
  const { tags, icon } = useOverflowTagMenu(props)
  const Icon = icon
  const shouldApplyPreviewStyles = props.isTagPreview && tags.length > 1

  return (
    <div className={styles.tags} hidden={props.hidden}>
      {!_.isEmpty(tags) && (
        <Overflow minimumVisible={props.minimumVisibleTags} padding={12}>
          {/* A list, not Fluent's default toolbar: the tags are not controls. */}
          <TagGroup className={styles.tagGroup} size='small' role='list' aria-label={props.text}>
            {tags.map((tag) => (
              <OverflowItem key={tag.key} id={tag.key}>
                <Tag
                  role='listitem'
                  className={[styles.tag, shouldApplyPreviewStyles && styles.tagPreview]
                    .filter(Boolean)
                    .join(' ')}
                  appearance='brand'
                  size='small'
                  title={tag.value}
                  icon={props.icon && <Icon />}
                  primaryText={{
                    className: shouldApplyPreviewStyles ? styles.tagPrimary : undefined
                  }}
                >
                  {tag.value}
                </Tag>
              </OverflowItem>
            ))}
            <OverflowMenu tags={tags} />
          </TagGroup>
        </Overflow>
      )}
    </div>
  )
}
