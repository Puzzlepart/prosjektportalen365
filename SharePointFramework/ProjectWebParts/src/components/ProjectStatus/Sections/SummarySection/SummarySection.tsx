import { conditionalClassName as className } from 'pp365-shared-library/lib/util'
import React, { FC } from 'react'
import { pick } from 'underscore'
import { ProjectInformation } from '../../../ProjectInformation'
import { useProjectStatusContext } from '../../../ProjectStatus/context'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/BaseSection'
import { SectionContext } from '../context'
import { useCreateContextValue } from '../useCreateContextValue'
import styles from './SummarySection.module.scss'
import { ISummarySectionProps } from './types'

export const SummarySection: FC<ISummarySectionProps> = (props) => {
  const context = useProjectStatusContext()
  const createContextValue = useCreateContextValue({})

  /**
   * Render status elements where `ctxValue.headerProps.value` is set,
   * or the `fieldName` is **GtOverallStatus**.
   */
  function renderStatusElements() {
    return context.state.data.sections.map((sec, idx) => {
      const ctxValue = createContextValue(sec)
      const shouldRender =
        sec.showInStatusSection &&
        (ctxValue.headerProps.value || sec.fieldName === 'GtOverallStatus')
      return shouldRender ? (
        <SectionContext.Provider key={idx} value={ctxValue}>
          <div
            key={idx}
            className={className([
              styles.statusElement,
              props.iconsOnly ? styles.iconsOnly : styles.halfWidth
            ])}
          >
            <StatusElement {...pick(props, 'iconSize', 'truncateComment', 'iconsOnly')} />
          </div>
        </SectionContext.Provider>
      ) : null
    })
  }

  return (
    <BaseSection {...props}>
      <div className={styles.summarySection}>
        {props.showProjectInformation && (
          <div className={styles.projectInformation}>
            <ProjectInformation
              {...pick(context.props, 'siteId', 'webAbsoluteUrl', 'spfxContext')}
              page='ProjectStatus'
              hideAllActions
              hideStatusReport
            />
          </div>
        )}
        <div
          className={className([
            styles.statusElements,
            !props.showProjectInformation && styles.fullWidth
          ])}
        >
          <div className={styles.container} dir='ltr'>
            <div className={className([styles.row, props.iconsOnly ? styles.iconsOnly : ''])}>
              {renderStatusElements()}
            </div>
          </div>
        </div>
      </div>
    </BaseSection>
  )
}
