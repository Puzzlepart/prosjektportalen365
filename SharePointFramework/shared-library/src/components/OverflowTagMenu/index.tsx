import React, { FC } from 'react'
import styles from './OverflowTagMenu.module.scss'
import { useOverflowTagMenu } from './useOverflowTagMenu'
import _ from 'underscore'
import { InteractionTag, InteractionTagPrimary, Tag, TagGroup } from '@fluentui/react-tags-preview'
import {
  FluentProvider,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  useId,
  useIsOverflowItemVisible,
  useOverflowMenu,
  webLightTheme
} from '@fluentui/react-components'
import { format } from '@fluentui/react'
import { IOverflowTagMenuProps, OverflowMenuItemProps } from './types'
import strings from 'SharedLibraryStrings'

export const OverflowTagMenu: FC<IOverflowTagMenuProps> = (props) => {
  const { tags, icon } = useOverflowTagMenu(props)
  const Icon = icon

  const OverflowMenuItem = (props: OverflowMenuItemProps) => {
    const { tag } = props
    const isVisible = tag && tag.value ? useIsOverflowItemVisible(tag.value) : false

    if (isVisible) return null

    return (
      <MenuItem key={tag.value} className={styles.menuItem}>
        <Tag className={styles.tag} title={tag.value} appearance='brand' size='small'>
          {tag.value}
        </Tag>
      </MenuItem>
    )
  }

  const OverflowMenu = (props: {
    tags: {
      key: string
      value: string
      primaryText: string
      children: string
    }[]
  }) => {
    const fluentProviderId = useId('fluent-provider')
    const { tags } = props
    const { isOverflowing, overflowCount } = useOverflowMenu<HTMLButtonElement>()

    if (!isOverflowing) {
      return null
    }

    return (
      <FluentProvider id={fluentProviderId} theme={webLightTheme}>
        <Menu closeOnScroll>
          <MenuTrigger disableButtonEnhancement>
            <InteractionTag
              aria-label={format(strings.Aria.MenuOverflowCount, overflowCount)}
              title={format(strings.Aria.MenuOverflowCount, overflowCount)}
              appearance='brand'
            >
              <InteractionTagPrimary primaryText={`+${overflowCount}`} />
            </InteractionTag>
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
      </FluentProvider>
    )
  }

  return (
    <div className={styles.tags} hidden={props.hidden}>
      {!_.isEmpty(tags) && (
        <Overflow minimumVisible={props.minimumVisibleTags} padding={12}>
          <TagGroup className={styles.tagGroup} size='small'>
            {!_.isEmpty(tags) &&
              tags.map((tag) => (
                <OverflowItem key={tag.key} id={tag.key}>
                  <InteractionTag
                    key={tag.value}
                    className={styles.tag}
                    appearance='brand'
                    size='small'
                    title={`${tag.type}: ${tag.value}`}
                    {...tag}
                  >
                    <InteractionTagPrimary primaryText={tag.value} icon={props.icon && <Icon />} />
                  </InteractionTag>
                </OverflowItem>
              ))}
            <OverflowMenu tags={tags} />
          </TagGroup>
        </Overflow>
      )}
    </div>
  )
}

OverflowTagMenu.defaultProps = {
  minimumVisibleTags: 1
}
