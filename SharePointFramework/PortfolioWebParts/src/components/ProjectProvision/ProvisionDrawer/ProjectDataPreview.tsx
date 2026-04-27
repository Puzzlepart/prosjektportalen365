import React, { FC } from 'react'
import { Input, makeStyles, tokens, Caption1 } from '@fluentui/react-components'
import { FieldContainer } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import { useProjectProvisionContext } from '../context'
import { FieldRenderer } from './FieldRenderer'
import {
  parseMetadataPreview,
  IProjectPropertyEntry
} from '../applyProjectPropertiesFromMetadata'

const useStyles = makeStyles({
  root: {
    marginTop: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  caption: {
    color: tokens.colorNeutralForeground3
  }
})

/**
 * Drops the `|<termGuid>` suffix from each entry of a taxonomy-style
 * `Label|guid` (or `Label1|guid1;Label2|guid2`) string. Plain strings
 * without `|` are returned unchanged.
 */
const stripTaxonomyGuids = (s: string): string =>
  s.includes('|')
    ? s
        .split(';')
        .map((part) => part.split('|')[0].trim())
        .filter(Boolean)
        .join(', ')
    : s

const formatValue = (value: any): string => {
  if (value == null) return ''
  if (Array.isArray(value)) {
    return value.map(formatValue).filter(Boolean).join(', ')
  }
  if (typeof value === 'object') {
    return value.label ?? value.Label ?? JSON.stringify(value)
  }
  return stripTaxonomyGuids(String(value))
}

const renderEntry = (entry: IProjectPropertyEntry) => {
  const label = entry.displayName?.trim() || entry.internalName
  const text = formatValue(entry.value)
  return (
    <FieldRenderer
      key={entry.internalName}
      field={{
        order: 0,
        fieldName: entry.internalName,
        displayName: label,
        dataType: 'text',
        iconName: 'TextBulletList',
        hidden: false,
        disabled: true,
        level: 2
      }}
      config={{
        disabled: true,
        onRender: (field) => (
          <FieldContainer iconName={field.iconName} label={field.displayName} hidden={false}>
            <Input disabled readOnly value={text} />
          </FieldContainer>
        )
      }}
    />
  )
}

/**
 * Level-2 read-only preview of the projectProperties that will be written
 * to the hub's ProjectData list when the provision request is submitted.
 * Renders nothing when the selected Provisioning Type has no
 * `DefaultMetadata.projectProperties`.
 */
export const ProjectDataPreview: FC = () => {
  const styles = useStyles()
  const context = useProjectProvisionContext()
  const entries = parseMetadataPreview(context.column.get('metadata') ?? '')
  if (entries.length === 0) return null

  return (
    <div className={styles.root}>
      <Caption1 className={styles.caption}>{strings.Provision.ProjectDataPreviewText}</Caption1>
      {entries.map(renderEntry)}
    </div>
  )
}

ProjectDataPreview.displayName = 'ProjectDataPreview'
