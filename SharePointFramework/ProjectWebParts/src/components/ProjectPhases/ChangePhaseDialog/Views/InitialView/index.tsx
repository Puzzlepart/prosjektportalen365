import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './InitialView.module.scss'
import { useInitialView } from './useInitialView'
import { Field, Label, Tab, TabList, Textarea } from '@fluentui/react-components'
import { StatusActions } from './StatusActions'
import { format } from '@fluentui/react'

export const InitialView: FC = () => {
  const { checklistItem, checklistItems, setComment, comment, actions } = useInitialView()
  if (!checklistItem) return null

  return (
    <div className={styles.root}>
      <TabList className={styles.tabList} selectedValue={checklistItem.id}>
        {checklistItems.map((item) => (
          <Tab className={styles.tabItem} key={item.id} title={format(strings.PhaseCheckListItem, item.id)} value={item.id}>
            {item.id}
          </Tab>
        ))}
      </TabList>
      <Label weight='semibold'>{checklistItem.title}</Label>
      <Field hint={strings.ChecklistCommentDescription}>
        <Textarea
          rows={4}
          value={comment}
          placeholder={strings.ChecklistCommentPlaceholder}
          onChange={(_, data) => setComment(data.value)}
        />
      </Field>
      <StatusActions actions={actions} />
    </div>
  )
}
