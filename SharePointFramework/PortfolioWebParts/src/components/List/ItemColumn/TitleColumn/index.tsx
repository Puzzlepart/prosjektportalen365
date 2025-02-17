import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { SiteContext } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ListContext } from '../../context'
import { ITitleColumnProps } from './types'
import { Text, Button, Link, Tooltip } from '@fluentui/react-components'
import {
  bundleIcon,
  EyeOffFilled,
  EyeOffRegular,
  PanelRightContractFilled,
  PanelRightContractRegular
} from '@fluentui/react-icons'

/**
 * Object containing icons used in the component.
 */
const Icons = {
  EyeOff: bundleIcon(EyeOffFilled, EyeOffRegular),
  PanelRight: bundleIcon(PanelRightContractFilled, PanelRightContractRegular)
}

export const TitleColumn: FC<ITitleColumnProps> = (props) => {
  const context = useContext(ListContext)
  const url = props.item?.Path || props.item?.SPWebUrl

  if (!url) {
    return (
      <span>
        <Text size={200}>{props.item.Title}</Text>
        <Tooltip content={strings.NoProjectData} relationship='label' withArrow>
          <Button
            style={{ cursor: 'default' }}
            appearance='transparent'
            size='small'
            icon={<Icons.EyeOff />}
          />
        </Tooltip>
      </span>
    )
  }
  if (!context.props.renderTitleProjectInformationPanel) {
    return (
      <Link href={url} target='_blank' rel='noopener noreferrer'>
        {props.item.Title}
      </Link>
    )
  } else {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ProjectInformationPanel
          {...SiteContext.create(context.props.webPartContext, props.item.SiteId, url)}
          title={props.item.Title}
          page='Portfolio'
          hideAllActions={true}
          onRenderToggleElement={(onToggle) => (
            <Tooltip
              content={<>{strings.ProjectInformationPanelButton}</>}
              relationship='description'
              withArrow
            >
              <Button
                appearance='transparent'
                size='small'
                icon={<Icons.PanelRight />}
                onClick={onToggle}
              />
            </Tooltip>
          )}
        >
          <Link href={url} rel='noopener noreferrer' target='_blank'>
            {props.item.Title}
          </Link>
        </ProjectInformationPanel>
      </div>
    )
  }
}
