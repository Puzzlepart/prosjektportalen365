import React, { FC, useContext } from 'react'
import styles from './ProjectCardContent.module.scss'
import { useProjectCardContent } from './useProjectCardContent'
import _ from 'underscore'
import { InteractionTag, InteractionTagProps, TagGroup } from '@fluentui/react-tags-preview'
import { GlobeLocationFilled, TagMultipleFilled } from '@fluentui/react-icons'
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
import { ProjectCardContext } from '../context'
import strings from 'PortfolioWebPartsStrings'
import { format } from '@fluentui/react'

export const ProjectCardContent: FC = () => {
  const context = useContext(ProjectCardContext)
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
          className={styles.tag}
          title={tag.value}
          appearance='brand'
          size='small'
          {...tag}
        />
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
            aria-label={format(strings.Aria.MenuOverflowCount, overflowCount)}
            title={format(strings.Aria.MenuOverflowCount, overflowCount)}
            appearance='brand'
          >{`+${overflowCount}`}</InteractionTag>
        </MenuTrigger>
        <MenuPopover>
          <MenuList hasCheckmarks={false}>
            {!_.isEmpty(tags) &&
              tags.slice(-overflowCount).map((tag) => <OverflowMenuItem key={tag.key} tag={tag} />)}
          </MenuList>
        </MenuPopover>
      </Menu>
    )
  }

  return (
    <div className={styles.content}>
      <div className={styles.serviceArea} hidden={!context.shouldDisplay('ProjectServiceArea')}>
        {!_.isEmpty(serviceArea) && (
          <Overflow minimumVisible={1} padding={12}>
            <TagGroup className={styles.tagGroup} size='small'>
              {!_.isEmpty(serviceArea) &&
                serviceArea.map((area) => (
                  <OverflowItem key={area.key} id={area.key}>
                    <InteractionTag
                      key={area.value}
                      className={styles.tag}
                      appearance='brand'
                      icon={<GlobeLocationFilled />}
                      size='small'
                      title={`${area.type}: ${area.value}`}
                      {...area}
                    />
                  </OverflowItem>
                ))}
              <OverflowMenu tags={serviceArea} />
            </TagGroup>
          </Overflow>
        )}
      </div>
      <div className={styles.type} hidden={!context.shouldDisplay('ProjectType')}>
        {!_.isEmpty(type) && (
          <Overflow minimumVisible={1} padding={12}>
            <TagGroup className={styles.tagGroup} size='small'>
              {!_.isEmpty(type) &&
                type.map((type) => (
                  <OverflowItem key={type.key} id={type.key}>
                    <InteractionTag
                      key={type.value}
                      className={styles.tag}
                      appearance='brand'
                      icon={<TagMultipleFilled />}
                      size='small'
                      title={`${type.type}: ${type.value}`}
                      {...type}
                    />
                  </OverflowItem>
                ))}
              <OverflowMenu tags={type} />
            </TagGroup>
          </Overflow>
        )}
      </div>
    </div>
  )
}
