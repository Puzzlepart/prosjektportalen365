import { IViewField, SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'
import { ShimmeredDetailsList } from 'office-ui-fabric-react'
import { UserMessage } from 'pp365-projectwebparts/lib/components/UserMessage'
import * as strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { AddProjectDialog } from './AddProjectDialog'
import { Commands } from './Commands'
import styles from './programAdministration.module.scss'
import { ProjectTable } from './ProjectTable'
import { useStore } from './store'
import { IProgramAdministrationItem, IProgramAdministrationProps, shimmeredColumns } from './types'

export const ProgramAdministration: FunctionComponent<IProgramAdministrationProps> = ({
  sp,
  webPartTitle,
  dataAdapter,
  context
}) => {
  const displayProjectDialog = useStore((state) => state.displayProjectDialog)
  const childProjects = useStore((state) => state.childProjects)
  const setSelected = useStore((state) => state.setSelectedToDelete)
  const fetchChildProjects = useStore((state) => state.fetchChildProjects)
  const error = useStore((state) => state.error)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      await fetchChildProjects(sp, dataAdapter)
      setIsLoading(false)
    }
    setIsLoading(true)
    fetch()
  }, [])

  if (error) {
    return (
      <>
        <div className={styles.root}>
          <h2>{strings.ProgramAdministrationHeader}</h2>
          <UserMessage messageBarType={error.messageBarType} text={error.text} />
        </div>
      </>
    )
  }

  if (isLoading) {
    return (
      <ShimmeredDetailsList items={[]} shimmerLines={15} columns={shimmeredColumns} enableShimmer />
    )
  }

  return (
    <>
      <Commands _sp={sp} isSiteAdmin={context.pageContext.legacyPageContext.isSiteAdmin} />
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>{webPartTitle}</div>
        </div>
        <div>
          {childProjects.length > 0 ? (
            <ProjectTable
              fields={fields}
              projects={childProjects}
              onSelect={(selectedItem: any) => setSelected(selectedItem)}
              selectionMode={SelectionMode.multiple}
            />
          ) : (
            <UserMessage text={strings.ProgramAdministration_EmptyMessage} />
          )}
        </div>
        {displayProjectDialog && <AddProjectDialog sp={sp} context={context} />}
      </div>
    </>
  )
}

export const fields: IViewField[] = [
  {
    name: 'Title',
    displayName: 'Tittel',
    isResizable: true,
    render: (item: IProgramAdministrationItem) => {
      return (
        <a href={item.SPWebURL} target='_blank' data-interception='off' rel='noreferrer'>
          {item.Title}
        </a>
      )
    },
    sorting: true,
    maxWidth: 250
  }
]
