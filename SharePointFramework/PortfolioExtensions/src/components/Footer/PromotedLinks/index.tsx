import { ActionButton, Link, TooltipHost } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import styles from './PromotedLinks.module.scss'

export const PromotedLinks: FC = () => {
  const context = useContext(FooterContext)
  return (
    <TooltipHost
      hostClassName={styles.tooltipHost}
      content={
        <div className={styles.tooltipContent}>
          {context.props.links.map((link, idx) => (
            <div key={idx}>
              <Link href={link.Url}>{link.Description}</Link>
            </div>
          ))}
        </div>
      }
    >
      <ActionButton
        text={strings.LinksListText}
        iconProps={{ iconName: 'Link' }}
        styles={{ root: { fontSize: 12, height: 25 }, icon: { fontSize: 12 } }}
      />
    </TooltipHost>
  )
}
