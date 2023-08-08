import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardFooter.module.scss'
import { Avatar, Button, CardFooter, Tooltip } from '@fluentui/react-components'
import { useProjectCardFooter } from './useProjectCardFooter'
import strings from 'PortfolioWebPartsStrings'
import { BoxFilled, BoxMultipleFilled, BoxToolboxFilled, BuildingFactoryFilled, BuildingFilled, CubeFilled, PanelRightContractFilled } from '@fluentui/react-icons'

export const ProjectCardFooter: FC = () => {
  const context = useContext(ProjectCardContext)
  const { owner, manager } = useProjectCardFooter()

  let templateIcon = BoxFilled
  let templateText = context.project.template

  switch (context.project.template) {
    case 'Byggprosjekt':
      templateIcon = BuildingFilled
      templateText = 'Bygg'
      break
    case 'Anleggsprosjekt':
      templateIcon = BuildingFactoryFilled
      templateText = 'Anlegg'
      break
    case 'Programmal':
      templateIcon = BoxMultipleFilled
      templateText = 'Program'
      break
    case 'Standardmal':
      if (context.project.isParent) {
        templateIcon = BoxMultipleFilled
        templateText = 'Overordnet prosjekt'
      }
      else {
        templateIcon = CubeFilled
        templateText = 'Prosjekt'
      }
      break
    default:
      templateIcon = BoxToolboxFilled
      templateText = 'Egendefinert'
      break
  }

  const Icon = templateIcon

  const Persona = () => {
    return (
      <div className={styles.persona} >
        <div hidden={!context.showProjectOwner}>
          <Tooltip
            content={
              <>
                <strong>{owner.role}</strong>: {owner.name || strings.NotSet}
              </>
            }
            relationship={'description'}
            withArrow
          >
            <Avatar {...owner} />
          </Tooltip>
        </div>
        <div hidden={!context.showProjectManager}>
          <Tooltip
            content={
              <>
                <strong>{manager.role}</strong>: {manager.name || strings.NotSet}
              </>
            }
            relationship={'description'}
            withArrow
          >
            <Avatar {...manager} />
          </Tooltip>
        </div>
      </div >
    )
  }

  return (
    <CardFooter
      className={styles.footer}
      action={context.actions.map((action) => {
        return <Button key={action.id} icon={<PanelRightContractFilled />} {...action} />
      })}
    >
      <Persona />
      <Tooltip
        content={
          <>
            <strong>{templateText}</strong> ({context.project.template})
          </>
        }
        relationship={'description'}
        withArrow
      >
        <Button className={styles.templateTag} icon={<Icon />} title={context.project.template} />
      </Tooltip>
    </CardFooter>
  )

}
