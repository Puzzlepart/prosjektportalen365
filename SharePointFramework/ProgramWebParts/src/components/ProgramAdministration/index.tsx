import React, { FunctionComponent, useEffect, useState } from 'react'
import styles from './programAdministration.module.scss'
import { IProgramAdministrationItem, IProgramAdministrationProps, shimmeredColumns } from './types'
import { useStore } from './store'
import { IViewField, SelectionMode } from '@pnp/spfx-controls-react/lib/ListView'
import { ShimmeredDetailsList } from 'office-ui-fabric-react'
import { ProjectTable } from './ProjectTable'
import { Commandbar } from './Commands'
import { AddProjectDialog } from './AddProjectDialog'
import { UserMessage } from 'pp365-projectwebparts/lib/components/UserMessage'
import * as strings from 'ProgramWebPartsStrings'


export const ProgramAdministration: FunctionComponent<IProgramAdministrationProps> = ({ sp, webPartTitle, dataAdapter }) => {
  const displayProjectDialog = useStore(state => state.displayProjectDialog)
  const childProjects = useStore(state => state.childProjects)
  const setSelected = useStore(state => state.setSelectedToDelete)
  const fetchChildProjects = useStore(state => state.fetchChildProjects)
  const error = useStore(state => state.error)
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
          <UserMessage
            messageBarType={error.messageBarType}
            text={error.text}
          />
        </div>
      </>
    )
  }

  if (isLoading) {
    return <ShimmeredDetailsList items={[]} shimmerLines={15} columns={shimmeredColumns} enableShimmer />
  }

  return (
    <>
      <Commandbar _sp={sp} />
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.title}>
            {webPartTitle}
          </div>
        </div>
        <div>
          {childProjects.length > 0 && <ProjectTable fields={fields} projects={childProjects} onSelect={(selectedItem: any) => setSelected(selectedItem)} selectionMode={SelectionMode.multiple} />}
        </div>
        {displayProjectDialog && <AddProjectDialog sp={sp} />}
      </div>
    </>
  )
}


export const fields: IViewField[] = [
  {
    name: 'Title',
    displayName: 'Tittel',
    isResizable: true,
    sorting: true,
    maxWidth: 250.
  },
  {
    name: 'SPWebURL',
    displayName: 'Site URL',
    isResizable: true,
    render: (item: IProgramAdministrationItem) => {
      return <a href={item.SPWebURL} target='_blank' data-interception='off' rel='noreferrer' >{item.SPWebURL}</a>
    },
    sorting: true,
    maxWidth: 250.
  }
]

