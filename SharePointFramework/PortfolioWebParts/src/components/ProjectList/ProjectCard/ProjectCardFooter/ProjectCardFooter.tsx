import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardFooter.module.scss'
import { Avatar, Button, CardFooter, Tooltip } from '@fluentui/react-components'
import { useProjectCardFooter } from './useProjectCardFooter'
import strings from 'PortfolioWebPartsStrings'
import {
  BoxFilled,
  BoxMultipleFilled,
  BoxMultipleRegular,
  BoxRegular,
  BoxToolboxFilled,
  BoxToolboxRegular,
  BuildingFactoryFilled,
  BuildingFactoryRegular,
  BuildingFilled,
  BuildingRegular,
  CubeFilled,
  CubeRegular,
  PanelRightContractFilled,
  PanelRightContractRegular,
  bundleIcon
} from '@fluentui/react-icons'
import { ProjectMenu } from 'components/ProjectList/ProjectMenu/ProjectMenu'

export const ProjectCardFooter: FC = () => {
  const context = useContext(ProjectCardContext)
  const { primaryUser, secondaryUser } = useProjectCardFooter()
  const PanelRight = bundleIcon(PanelRightContractFilled, PanelRightContractRegular)
  let templateIcon = bundleIcon(BoxFilled, BoxRegular)
  let templateText = context.project.template

  switch (context.project.template) {
    case 'Byggprosjekt':
      templateIcon = bundleIcon(BuildingFilled, BuildingRegular)
      templateText = 'Bygg'
      break
    case 'Anleggsprosjekt':
      templateIcon = bundleIcon(BuildingFactoryFilled, BuildingFactoryRegular)
      templateText = 'Anlegg'
      break
    case 'Programmal':
      templateIcon = bundleIcon(BoxMultipleFilled, BoxMultipleRegular)
      templateText = 'Program'
      break
    case 'Standardmal':
      if (context.project.isParent) {
        templateIcon = bundleIcon(BoxMultipleFilled, BoxMultipleRegular)
        templateText = 'Overordnet prosjekt'
      } else {
        templateIcon = bundleIcon(CubeFilled, CubeRegular)
        templateText = 'Prosjekt'
      }
      break
    default:
      templateIcon = bundleIcon(BoxToolboxFilled, BoxToolboxRegular)
      templateText = 'Egendefinert'
      break
  }

  const Icon = templateIcon

  const Persona = () => {
    return (
      <div className={styles.persona}>
        <div hidden={!context.shouldDisplay('PrimaryUserField')}>
          <Tooltip
            content={
              <>
                <strong>{primaryUser.role}</strong>: {primaryUser.name || strings.NotSet}
              </>
            }
            relationship='description'
            withArrow
          >
            <Avatar className={styles.avatar} {...primaryUser} />
          </Tooltip>
        </div>
        <div hidden={!context.shouldDisplay('SecondaryUserField')}>
          <Tooltip
            content={
              <>
                <strong>{secondaryUser.role}</strong>: {secondaryUser.name || strings.NotSet}
              </>
            }
            relationship='description'
            withArrow
          >
            <Avatar className={styles.avatar} {...secondaryUser} />
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <CardFooter
      className={styles.footer}
      action={context.actions.map((action) => (
        <Tooltip
          key={action.id}
          content={<>{strings.ProjectInformationPanelButton}</>}
          relationship='description'
          withArrow
        >
          <Button className={styles.action} appearance='subtle' icon={<PanelRight />} {...action} />
        </Tooltip>
      ))}
    >
      <Persona />
      <div className={styles.buttons}>
        <Tooltip
          content={
            <>
              <strong>{templateText}</strong>
              {context.project.template ? ` (${context.project.template})` : ''}
            </>
          }
          relationship='description'
          withArrow
        >
          <Button
            className={styles.templateTag}
            appearance='subtle'
            icon={<Icon />}
            title={context.project.template}
          />
        </Tooltip>
        <ProjectMenu project={context.project} context={context} appearance='subtle' />
      </div>
    </CardFooter>
  )
}
