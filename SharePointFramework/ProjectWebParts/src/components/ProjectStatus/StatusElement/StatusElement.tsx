import { TooltipHost } from '@fluentui/react'
import { ConditionalWrapper } from 'pp365-shared-library/lib/components'
import { tryParseCurrency, tryParsePercentage } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import React, { FC, ReactNode, useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'
import { StatusElementIcon } from './StatusElementIcon/StatusElementIcon'
import { IStatusElementProps } from './types'
import { useStatusElement } from './useStatusElement'

export const StatusElement: FC<IStatusElementProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  const { commentProps, iconSize, useWrapper } = useStatusElement(props)
  return (
    <ConditionalWrapper
      condition={useWrapper}
      wrapper={(children: ReactNode) => (
        // TODO: Use new Tooltip component here
        <TooltipHost
          content={
            <div className={styles.tooltipContent}>
              <StatusElement />
            </div>
          }
        >
          {children}
        </TooltipHost>
      )}
    >
      {props.iconsOnly ? (
        <StatusElementIcon iconSize={iconSize} />
      ) : (
        <div className={styles.element}>
          <div className={styles.header}>
            <div className={styles.main}>
              <StatusElementIcon iconSize={iconSize} />
              <div className={styles.content}>
                <div className={styles.label}>{headerProps.label}</div>
                <div
                  className={styles.value}
                  title={`${strings.StatusElementText} ${headerProps.label}: ${headerProps.value}`}
                >
                  {headerProps.value}
                </div>
              </div>
            </div>
            {props.summation && props.summation?.result && (
              <div className={styles.summation}>
                <div className={styles.label}>{props.summation.description}</div>
                <div className={styles.value}>
                  {props.summation.renderAs === 'currency'
                    ? tryParseCurrency(props.summation.result?.toString())
                    : props.summation.renderAs === 'percentage'
                    ? (tryParsePercentage(props.summation.result?.toString(), false, 0) as number)
                    : props.summation.result}
                </div>
              </div>
            )}
          </div>
          <div {...commentProps}></div>
        </div>
      )}
    </ConditionalWrapper>
  )
}
