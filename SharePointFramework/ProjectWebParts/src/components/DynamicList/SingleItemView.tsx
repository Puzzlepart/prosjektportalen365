import { Text } from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext } from 'react'
import { DynamicListContext } from './context'
import { EditRegular, DeleteRegular } from '@fluentui/react-icons'
import styles from './SingleItemView.module.scss'

export const SingleItemView: FC = () => {
  const context = useContext(DynamicListContext)

  const item = context.state.selectedItem || context.state.data?.listItems?.[0]

  if (!item) {
    return (
      <div className={styles.singleItemView}>
        <div className={styles.emptyState}>
          <Text size={400}>No item to display</Text>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit item clicked', item.Id)
  }

  const handleDelete = () => {
    // TODO: Implement delete functionality with confirmation
    console.log('Delete item clicked', item.Id)
  }

  const renderFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <Text style={{ color: 'var(--colorNeutralForeground4)' }}>Not specified</Text>
    }

    // Handle dates
    if (value instanceof Date) {
      return <Text>{value.toLocaleDateString()}</Text>
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return <Text>{value ? 'Yes' : 'No'}</Text>
    }

    // Handle objects (lookup fields, person fields, etc.)
    if (typeof value === 'object' && value.Title) {
      return <Text>{value.Title}</Text>
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return <Text>{value.map((v) => (v.Title ? v.Title : v)).join(', ')}</Text>
    }

    return <Text>{value.toString()}</Text>
  }

  const getColumnDisplayName = (columnKey: string): string => {
    const column = context.state.data?.listColumns?.find((col) => col.key === columnKey)
    return column?.name || columnKey
  }

  // Filter out system fields and attachments
  const visibleFields = Object.keys(item).filter(
    (key) =>
      !key.startsWith('_') &&
      !key.startsWith('@') &&
      key !== 'Attachments' &&
      key !== 'AttachmentFiles' &&
      key !== 'ContentTypeId' &&
      key !== 'GUID' &&
      key !== 'FileSystemObjectType'
  )

  return (
    <div className={styles.singleItemView}>
      <div className={styles.header}>
        <h1 className={styles.title}>{item.Title || 'Untitled'}</h1>
        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={handleEdit} title='Edit item'>
            <EditRegular className={styles.actionIcon} />
            <span>Edit</span>
          </button>
          <button className={styles.actionButton} onClick={handleDelete} title='Delete item'>
            <DeleteRegular className={styles.actionIcon} />
            <span>Delete</span>
          </button>
        </div>
      </div>
      <div className={styles.fields}>
        {visibleFields.map((fieldName) => (
          <div key={fieldName} className={styles.field}>
            <Text weight='semibold' size={200} block>
              {getColumnDisplayName(fieldName)}
            </Text>
            {renderFieldValue(fieldName, item[fieldName])}
          </div>
        ))}
      </div>
    </div>
  )
}
