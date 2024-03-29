import strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import { SectionMap } from './SectionMap'
import styles from './Sections.module.scss'
import { SectionContext } from './context'
import { useCreateContextValue } from './useCreateContextValue'
import { useSections } from './useSections'
import { Shimmer } from '@fluentui/react'

export const Sections: FC = () => {
  const context = useProjectStatusContext()
  const createContextValue = useCreateContextValue({ iconSize: 50 })
  const sections = useSections()

  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <div className={styles.root} id='pp-statussection'>
        {!context.state.selectedReport ? (
          <UserMessage title={strings.NoReportsFoundTitle} text={strings.NoStatusReportsMessage} />
        ) : (
          sections.map((sec, idx) => (
            <SectionContext.Provider key={idx} value={createContextValue(sec)}>
              {SectionMap[sec.type] ?? null}
            </SectionContext.Provider>
          ))
        )}
      </div>
    </Shimmer>
  )
}
