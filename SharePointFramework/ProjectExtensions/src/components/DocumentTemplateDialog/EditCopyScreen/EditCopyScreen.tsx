import { UserMessage } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { DocumentTemplateItem } from './DocumentTemplateItem'
import styles from './EditCopyScreen.module.scss'
import { useEditCopyScreen } from './useEditCopyScreen'

/**
 * The screen where the user names the copies before they are made. Its buttons are the dialog's
 * footer.
 */
export const EditCopyScreen: FC = () => {
  const { templates, onInputChanged } = useEditCopyScreen()
  return (
    <div className={styles.root}>
      <UserMessage
        title={strings.DocumentTemplateDialogScreenEditCopyInfoTitle}
        text={strings.DocumentTemplateDialogScreenEditCopyInfoMessage}
      />
      {templates.map((item) => (
        <DocumentTemplateItem key={item.id} item={item} onInputChanged={onInputChanged} />
      ))}
    </div>
  )
}

EditCopyScreen.displayName = 'EditCopyScreen'
