import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  mergeClasses,
  Tag,
  Text,
  tokens
} from '@fluentui/react-components'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { ConflictResolution } from 'models'
import { useCatalogContext } from '../context'

const useStyles = makeStyles({
  surface: {
    maxWidth: '640px'
  },
  intro: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalM
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '50vh',
    overflowY: 'auto'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  tag: {
    flexShrink: 0
  },
  detail: {
    flex: '1 1 auto'
  },
  overwriteTag: {
    backgroundColor: tokens.colorStatusWarningBackground2,
    color: tokens.colorStatusWarningForeground2,
    borderTopColor: tokens.colorStatusWarningBorder1,
    borderRightColor: tokens.colorStatusWarningBorder1,
    borderBottomColor: tokens.colorStatusWarningBorder1,
    borderLeftColor: tokens.colorStatusWarningBorder1
  },
  skipTag: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    borderTopColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1
  },
  blockedTag: {
    backgroundColor: tokens.colorStatusDangerBackground2,
    color: tokens.colorStatusDangerForeground1,
    borderTopColor: tokens.colorStatusDangerBorder1,
    borderRightColor: tokens.colorStatusDangerBorder1,
    borderBottomColor: tokens.colorStatusDangerBorder1,
    borderLeftColor: tokens.colorStatusDangerBorder1
  }
})

// Most severe first.
const ORDER: Record<ConflictResolution, number> = { blocked: 0, skip: 1, overwrite: 2 }

/**
 * Confirmation dialog for the pre-import compatibility check. Lists the
 * conflicts found against the hub (grouped by severity) and lets the admin
 * cancel and fix things manually, or continue knowing items will be
 * overwritten or skipped. Driven by `state.compatibilityReport`.
 */
export const CompatibilityDialog: FC = () => {
  const styles = useStyles()
  const { state, resolveCompatibility } = useCatalogContext()
  const report = state.compatibilityReport

  const resolutionLabel = (resolution: ConflictResolution): string =>
    resolution === 'overwrite'
      ? strings.CatalogResolutionOverwrite
      : resolution === 'skip'
      ? strings.CatalogResolutionSkip
      : strings.CatalogResolutionBlocked

  const resolutionClass = (resolution: ConflictResolution): string =>
    resolution === 'overwrite'
      ? styles.overwriteTag
      : resolution === 'skip'
      ? styles.skipTag
      : styles.blockedTag

  const conflicts = [...(report?.conflicts ?? [])].sort(
    (a, b) => ORDER[a.resolution] - ORDER[b.resolution]
  )

  return (
    <Dialog
      open={Boolean(report)}
      onOpenChange={(_, data) => {
        if (!data.open) resolveCompatibility(false)
      }}
    >
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>{strings.CatalogCompatibilityTitle}</DialogTitle>
          <DialogContent>
            <Text block className={styles.intro}>
              {strings.CatalogCompatibilityIntro}
            </Text>
            <div className={styles.list}>
              {conflicts.map((conflict, index) => (
                <div key={index} className={styles.row}>
                  <Tag
                    size='small'
                    appearance='filled'
                    className={mergeClasses(styles.tag, resolutionClass(conflict.resolution))}
                  >
                    {resolutionLabel(conflict.resolution)}
                  </Tag>
                  <Text size={200} className={styles.detail}>
                    {conflict.detail}
                  </Text>
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance='secondary' onClick={() => resolveCompatibility(false)}>
              {strings.CancelLabel}
            </Button>
            <Button appearance='primary' onClick={() => resolveCompatibility(true)}>
              {strings.CatalogCompatibilityContinue}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
