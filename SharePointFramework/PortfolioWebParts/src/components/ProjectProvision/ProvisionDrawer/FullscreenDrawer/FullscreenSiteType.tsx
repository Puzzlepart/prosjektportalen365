import React, { FC, useContext, useCallback } from 'react'
import { Dropdown, Option, Tag } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { ProjectProvisionContext } from '../../context'
import { SiteType } from '../SiteType'
import styles from './FullscreenDrawer.module.scss'

export interface IFullscreenSiteTypeProps {
  onTypeSelected?: () => void
}

/**
 * Fullscreen SiteType selection — Level 1 of the fullscreen drawer.
 * Displays centered, large SiteType cards with descriptive text.
 */
export const FullscreenSiteType: FC<IFullscreenSiteTypeProps> = ({ onTypeSelected }) => {
  const context = useContext(ProjectProvisionContext)

  const handleCardClick = useCallback((title: string) => {
    context.setColumn('type', title)
    onTypeSelected?.()
  }, [onTypeSelected])

  return (
    <div className={styles.siteTypeLevel}>
      <div className={styles.siteTypeHeader}>
        <h1 className={styles.siteTypeTitle}>
          {context.props.level0Header || strings.Provision.SiteTypeFieldLabel}
        </h1>
        {context.props.level0Description && (
          <p className={styles.siteTypeDescription}>{context.props.level0Description}</p>
        )}
      </div>
      <div className={styles.siteTypeContainer}>
        {context.props.siteTypeRenderMode !== 'dropdown' ? (
          <div className={styles.siteTypeCards}>
            {context.state.types?.map((type) => (
              <div
                key={type.title}
                className={styles.siteTypeCardWrapper}
                onClick={() => handleCardClick(type.title)}
              >
                <SiteType
                  title={type.title}
                  description={type.description}
                  image={type.image?.Url}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.siteTypeDropdownWrapper}>
            <Dropdown
              value={context.column.get('type') ?? ''}
              selectedOptions={[context.column.get('type')]}
              onOptionSelect={(_, data) => {
                context.setColumn('type', data.optionValue)
                onTypeSelected?.()
              }}
              size='large'
            >
              {context.state.types?.map((type) => (
                <Option key={type.title} text={type.title} title={type.description}>
                  <Tag appearance='outline' size='medium'>
                    <span>{type.title}</span>
                  </Tag>
                </Option>
              ))}
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  )
}
