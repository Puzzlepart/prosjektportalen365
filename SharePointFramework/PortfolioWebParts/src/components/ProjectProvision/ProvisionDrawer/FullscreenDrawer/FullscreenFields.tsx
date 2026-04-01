import React, { FC, useContext } from 'react'
import { Button, DrawerHeaderTitle } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { getFluentIcon, UserMessage } from 'pp365-shared-library'
import { ProjectProvisionContext } from '../../context'
import { IProvisionField } from '../../types'
import { FieldRendererList } from '../FieldRenderer'
import { IFieldConfig } from '../FieldRenderer/types'
import { DebugModel } from '../DebugModel'
import { stringIsNullOrEmpty } from '@pnp/core'
import styles from './FullscreenDrawer.module.scss'

declare const DEBUG: boolean

export interface IFullscreenFieldsProps {
  fields: IProvisionField[]
  fieldConfigs: Record<string, IFieldConfig>
  isSaveDisabled: boolean
  missingFieldsInfo: { missingFields: { displayName: string }[] }
  onBack: () => void
}

/**
 * Multi-column field layout for the fullscreen drawer.
 * Left sidebar shows the selected SiteType info.
 * Main area shows fields in columns grouped by level.
 */
export const FullscreenFields: FC<IFullscreenFieldsProps> = ({
  fields,
  fieldConfigs,
  isSaveDisabled,
  missingFieldsInfo,
  onBack
}) => {
  const context = useContext(ProjectProvisionContext)

  const selectedType = context.column.get('type')
  const selectedTypeData = context.state.types?.find((t) => t.title === selectedType)

  // Get unique levels from fields (excluding level 0 which has 'type' — rendered in sidebar)
  const fieldLevels = Array.from(new Set(fields.map((f) => f.level))).sort((a, b) => a - b)

  // Filter out the 'type' field since it's shown in the sidebar
  const fieldsWithoutType = fields.filter((f) => f.fieldName !== 'type')

  const levelHeaders = [
    { title: context.props.level0Header, description: context.props.level0Description },
    { title: context.props.level1Header, description: context.props.level1Description },
    { title: context.props.level2Header, description: context.props.level2Description }
  ]

  return (
    <div className={styles.fieldsLevel}>
      <div className={styles.fieldsLayout}>
        <div className={styles.fieldsSidebar}>
          {selectedTypeData?.image?.Url && (
            <img
              src={selectedTypeData.image.Url}
              alt={selectedType}
              className={styles.sidebarImage}
            />
          )}
          <h2 className={styles.sidebarTitle}>{selectedType}</h2>
          {selectedTypeData?.description && (
            <p className={styles.sidebarDescription}>{selectedTypeData.description}</p>
          )}
          <Button
            appearance='primary'
            icon={getFluentIcon('ArrowLeft')}
            onClick={onBack}
            size='medium'
          >
            {strings.Provision.ChangeTypeButtonLabel ?? strings.Provision.PreviousButtonLabel}
          </Button>
          {(context.props.debugMode ||
            (typeof sessionStorage !== 'undefined' && sessionStorage.DEBUG) ||
            (typeof DEBUG !== 'undefined' && DEBUG)) && <DebugModel />}
        </div>
        <div className={styles.fieldsMain}>
          <div className={styles.fieldsColumns}>
            {fieldLevels.map((level) => {
              const levelFieldCount = fieldsWithoutType.filter((f) => f.level === level).length
              if (levelFieldCount === 0) return null

              return (
                <div key={level} className={styles.fieldsColumn}>
                  {levelHeaders[level] && !stringIsNullOrEmpty(levelHeaders[level].title) && (
                    <DrawerHeaderTitle className={styles.columnTitle}>
                      {levelHeaders[level].title}
                    </DrawerHeaderTitle>
                  )}
                  {levelHeaders[level] &&
                    !stringIsNullOrEmpty(levelHeaders[level].description) && (
                      <p className={styles.columnDescription}>
                        {levelHeaders[level].description}
                      </p>
                    )}
                  <FieldRendererList
                    fields={fieldsWithoutType}
                    level={level}
                    configs={fieldConfigs}
                  />
                </div>
              )
            })}
          </div>
          {!stringIsNullOrEmpty(context.props.footerDescription) && (
            <p className={styles.footerDescription}>{context.props.footerDescription}</p>
          )}
          {isSaveDisabled && missingFieldsInfo.missingFields.length > 0 && (
            <UserMessage
              intent='error'
              title={strings.Provision.MissingFieldsTitle}
              text={`<ul>
                ${missingFieldsInfo.missingFields
                  .map((field) => `<li>${field.displayName}</li>`)
                  .join('')}
              </ul>`}
              containerStyle={{ marginTop: '16px' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
