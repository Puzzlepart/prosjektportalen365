import React, { FC } from 'react'
import styles from './ProjectCardContent.module.scss'
import { useProjectCardContent } from './useProjectCardContent'
import _ from 'underscore'
import { InteractionTag, InteractionTagProps, TagGroup } from '@fluentui/react-tags-preview'
import {
  GlobeLocationFilled, TagMultipleFilled
} from '@fluentui/react-icons'
import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  useIsOverflowItemVisible,
  useOverflowMenu
} from '@fluentui/react-components'

export const ProjectCardContent: FC = () => {
  const { serviceArea, type } = useProjectCardContent()

  type OverflowMenuItemProps = {
    tag: InteractionTagProps
  }

  const OverflowMenuItem = (props: OverflowMenuItemProps) => {
    const { tag } = props
    const isVisible = tag && tag.value ? useIsOverflowItemVisible(tag.value) : false

    if (isVisible) {
      return null
    }

    return (
      <MenuItem key={tag.value} className={styles.menuItem}>
        <InteractionTag
          appearance={'brand'}
          size={'small'}
          {...tag}
        />
      </MenuItem>
    )
  }

  const OverflowMenu = (props: {
    tags: {
      key: string;
      value: string;
      primaryText: string;
      children: string;
    }[]
  }) => {
    const { tags } = props
    const { ref, isOverflowing, overflowCount } = useOverflowMenu<HTMLButtonElement>()

    if (!isOverflowing) {
      return null
    }

    return (
      <Menu closeOnScroll>
        <MenuTrigger disableButtonEnhancement>
          <InteractionTag
            ref={ref}
            aria-label={`${overflowCount} more tags`}
            appearance={'brand'}
          >{`+${overflowCount}`}</InteractionTag>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {!_.isEmpty(tags) &&
              tags.slice(-overflowCount).map((tag) =>
                <OverflowMenuItem key={tag.key} tag={tag} />
              )}
          </MenuList>
        </MenuPopover>
      </Menu>
    )
  }

  return (
    <div className={styles.content}>
      {!_.isEmpty(serviceArea) && <Overflow minimumVisible={1} padding={12}>
        <TagGroup className={styles.tagGroup} size={'small'}>
          {!_.isEmpty(serviceArea) &&
            serviceArea.map((area, idx) => (
              <OverflowItem key={area.key} id={area.key}>
                {idx === 0 ? (
                  <InteractionTag
                    key={area.value}
                    appearance={'brand'}
                    icon={idx === 0 && <GlobeLocationFilled />}
                    size={'small'}
                    {...area}
                  />
                ) : (
                  <InteractionTag key={area.value} appearance={'brand'} size={'small'} {...area} />
                )}
              </OverflowItem>
            ))}
          <OverflowMenu tags={serviceArea} />
        </TagGroup>
      </Overflow>}
      {!_.isEmpty(type) && <Overflow minimumVisible={1} padding={12}>
        <TagGroup className={styles.tagGroup} size={'small'}>
          {!_.isEmpty(type) &&
            type.map((type, idx) => (
              <OverflowItem key={type.key} id={type.key}>
                {idx === 0 ? (
                  <InteractionTag
                    key={type.value}
                    appearance={'brand'}
                    icon={idx === 0 && <TagMultipleFilled />}
                    size={'small'}
                    {...type}
                  />
                ) : (
                  <InteractionTag key={type.value} appearance={'brand'} size={'small'} {...type} />
                )}
              </OverflowItem>
            ))}
          <OverflowMenu tags={type} />
        </TagGroup>
      </Overflow>}
    </div>
  )
}
