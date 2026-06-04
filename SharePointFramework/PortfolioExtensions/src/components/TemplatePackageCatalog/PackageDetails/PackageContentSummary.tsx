import { format } from '@fluentui/react/lib/Utilities'
import {
  Badge,
  Link,
  Spinner,
  Text,
  Tooltip,
  Tree,
  TreeItem,
  TreeItemLayout
} from '@fluentui/react-components'
import {
  ClipboardTaskListLtr20Regular,
  Column20Regular,
  Document20Regular,
  DocumentBulletList20Regular,
  PuzzlePiece20Regular,
  Tag20Regular,
  TextBulletListSquare20Regular
} from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useState } from 'react'
import { ContentIconName, ICatalogPackage, IHierarchyNode, IPackageContents } from 'models'
import { CatalogService } from 'services'
import styles from './PackageDetails.module.scss'

const ICONS: Record<ContentIconName, JSX.Element> = {
  content: <ClipboardTaskListLtr20Regular />,
  lists: <TextBulletListSquare20Regular />,
  contentTypes: <DocumentBulletList20Regular />,
  siteFields: <Column20Regular />,
  taxonomy: <Tag20Regular />,
  termSet: <Tag20Regular />,
  term: <Tag20Regular />,
  extensions: <PuzzlePiece20Regular />,
  files: <Document20Regular />
}

export interface IPackageContentSummaryProps {
  package: ICatalogPackage
}

export const PackageContentSummary: FC<IPackageContentSummaryProps> = ({ package: pkg }) => {
  const [contents, setContents] = useState<IPackageContents | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setContents(undefined)
    setShowDetails(false)
    void CatalogService.getPackageContents(pkg).then((result) => {
      if (cancelled) return
      setContents(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [pkg.id])

  const renderNode = (node: IHierarchyNode): JSX.Element => {
    const label = (
      <span className={styles.treeLabel}>
        {node.icon && <span className={styles.treeIcon}>{ICONS[node.icon]}</span>}
        <span>{node.label}</span>
        {typeof node.count === 'number' && (
          <Tooltip content={format(strings.CatalogContentCountTooltip, node.count)} relationship='label'>
            <Badge appearance='tint' size='small' className={styles.treeCount}>
              {node.count}
            </Badge>
          </Tooltip>
        )}
      </span>
    )
    if (node.children && node.children.length > 0) {
      return (
        <TreeItem key={node.key} itemType='branch' value={node.key}>
          <TreeItemLayout>{label}</TreeItemLayout>
          <Tree>{node.children.map(renderNode)}</Tree>
        </TreeItem>
      )
    }
    return (
      <TreeItem key={node.key} itemType='leaf' value={node.key}>
        <TreeItemLayout>{label}</TreeItemLayout>
      </TreeItem>
    )
  }

  return (
    <div className={styles.section}>
      <Text weight='semibold' className={styles.sectionTitle}>
        {strings.CatalogContentSummaryTitle}
      </Text>

      {loading && <Spinner size='tiny' />}

      {!loading && contents && contents.summary.length > 0 && (
        <>
          <div className={styles.summaryList}>
            {contents.summary.map((entry) => (
              <div key={entry.key} className={styles.summaryRow}>
                <span className={styles.summaryIcon}>{ICONS[entry.icon]}</span>
                <Text className={styles.summaryLabel}>{entry.label}</Text>
                {typeof entry.count === 'number' && (
                  <Tooltip
                    content={format(strings.CatalogContentCountTooltip, entry.count)}
                    relationship='label'
                  >
                    <Badge appearance='tint' color='informative' className={styles.summaryCount}>
                      {entry.count}
                    </Badge>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>

          {contents.hierarchy.length > 0 && (
            <>
              <Link className={styles.detailsToggle} onClick={() => setShowDetails((value) => !value)}>
                {showDetails ? strings.CatalogHideDetails : strings.CatalogShowDetails}
              </Link>
              {showDetails && (
                <Tree
                  aria-label={strings.CatalogContentSummaryTitle}
                  defaultOpenItems={contents.hierarchy.map((node) => node.key)}
                  className={styles.tree}
                >
                  {contents.hierarchy.map(renderNode)}
                </Tree>
              )}
            </>
          )}
        </>
      )}

      {!loading && (!contents || contents.summary.length === 0) && (
        <Text size={200} className={styles.muted}>
          {strings.CatalogContentSummaryUnavailable}
        </Text>
      )}
    </div>
  )
}
