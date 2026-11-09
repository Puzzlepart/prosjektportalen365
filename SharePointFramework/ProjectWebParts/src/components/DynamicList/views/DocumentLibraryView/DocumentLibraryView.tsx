import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  BreadcrumbButton
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { ListView } from '../ListView'
import { FileUploadZone } from '../../components/FileUpload'
import styles from './DocumentLibraryView.module.scss'
import * as strings from 'ProjectWebPartsStrings'
import { useDocumentLibraryView } from './useDocumentLibraryView'

/**
 * DocumentLibraryView displays SharePoint document library items.
 * Supports folder navigation and Office Online integration.
 */
export const DocumentLibraryView: FC = () => {
  const {
    items,
    total,
    breadcrumbItems,
    showBreadcrumb,
    columns,
    handleFileClick,
    uploadFiles,
    emptyMessage
  } = useDocumentLibraryView()

  return (
    <FileUploadZone onFilesSelected={uploadFiles} fullScreen>
      {showBreadcrumb && (
        <div className={styles.breadcrumb}>
          <Breadcrumb aria-label={strings.DynamicList.FolderNavigation}>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.key}>
                <BreadcrumbItem>
                  {item.onClick ? (
                    <BreadcrumbButton onClick={item.onClick}>{item.text}</BreadcrumbButton>
                  ) : (
                    <BreadcrumbButton current>{item.text}</BreadcrumbButton>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbDivider />}
              </React.Fragment>
            ))}
          </Breadcrumb>
        </div>
      )}
      <ListView
        columns={columns as any}
        items={items}
        total={total}
        isDocumentLibrary
        onFirstColumnClick={handleFileClick}
        emptyMessage={emptyMessage}
        noColumnsMessage={strings.DynamicList.NoColumnsToShow}
        className={styles.documentLibraryView}
      />
    </FileUploadZone>
  )
}
