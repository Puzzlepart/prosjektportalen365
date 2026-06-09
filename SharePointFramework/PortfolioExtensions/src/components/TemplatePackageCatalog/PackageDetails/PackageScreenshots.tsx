import { format } from '@fluentui/react/lib/Utilities'
import {
  Button,
  Dialog,
  DialogBody,
  DialogSurface,
  makeStyles,
  mergeClasses,
  Text,
  tokens,
  Tooltip
} from '@fluentui/react-components'
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Dismiss24Regular,
  ZoomIn24Regular
} from '@fluentui/react-icons'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useState } from 'react'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM
  },
  heading: {
    color: tokens.colorNeutralForeground2
  },
  frame: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    minHeight: '180px'
  },
  image: {
    width: '100%',
    maxHeight: '320px',
    objectFit: 'contain',
    display: 'block',
    cursor: 'zoom-in'
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1 }
  },
  navPrev: { left: tokens.spacingHorizontalS },
  navNext: { right: tokens.spacingHorizontalS },
  zoomButton: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1 }
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: tokens.spacingHorizontalXS
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS
  },
  dot: {
    width: '8px',
    height: '8px',
    padding: 0,
    minWidth: 'unset',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralStroke1,
    cursor: 'pointer',
    border: 'none'
  },
  dotActive: {
    backgroundColor: tokens.colorBrandBackground
  },
  counter: {
    color: tokens.colorNeutralForeground3
  },
  errorBox: {
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3
  },
  lightboxSurface: {
    maxWidth: '92vw',
    width: 'fit-content'
  },
  lightboxBody: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS
  },
  lightboxBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS
  },
  lightboxImage: {
    maxWidth: '86vw',
    maxHeight: '78vh',
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto'
  }
})

/**
 * Screenshot carousel for the package details pane. Shows the package's hosted
 * screenshots (absolute URLs from `catalog.json`) one at a time with prev/next
 * navigation and dot indicators when there is more than one, and opens the
 * current image in a full-size lightbox dialog on click. Renders nothing when
 * the package has no screenshots.
 */
export const PackageScreenshots: FC<{ screenshots?: string[] }> = ({ screenshots }) => {
  const styles = useStyles()
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [errored, setErrored] = useState<Record<number, boolean>>({})

  const count = screenshots?.length ?? 0

  // Reset to the first image (and clear errors) when the package changes.
  useEffect(() => {
    setIndex(0)
    setErrored({})
    setLightboxOpen(false)
  }, [screenshots])

  if (count === 0) return null

  const safeIndex = Math.min(index, count - 1)
  const go = (delta: number) => setIndex((current) => (current + delta + count) % count)
  const markErrored = (i: number) => setErrored((current) => ({ ...current, [i]: true }))

  const renderImage = (className: string, onClick?: () => void) =>
    errored[safeIndex] ? (
      <div className={styles.errorBox}>
        <Text size={200}>{strings.CatalogScreenshotError}</Text>
      </div>
    ) : (
      <img
        className={className}
        src={screenshots[safeIndex]}
        alt={format(strings.CatalogScreenshotAlt, safeIndex + 1, count)}
        onClick={onClick}
        onError={() => markErrored(safeIndex)}
      />
    )

  return (
    <div className={styles.root}>
      <Text size={200} weight='semibold' className={styles.heading}>
        {strings.CatalogScreenshotsHeading}
      </Text>

      <div className={styles.frame}>
        {renderImage(styles.image, () => !errored[safeIndex] && setLightboxOpen(true))}

        {!errored[safeIndex] && (
          <Tooltip content={strings.CatalogScreenshotZoom} relationship='label'>
            <Button
              className={styles.zoomButton}
              appearance='subtle'
              size='small'
              icon={<ZoomIn24Regular />}
              aria-label={strings.CatalogScreenshotZoom}
              onClick={() => setLightboxOpen(true)}
            />
          </Tooltip>
        )}

        {count > 1 && (
          <>
            <Button
              className={mergeClasses(styles.navButton, styles.navPrev)}
              appearance='subtle'
              shape='circular'
              icon={<ChevronLeft24Regular />}
              aria-label={strings.CatalogScreenshotPrevious}
              onClick={() => go(-1)}
            />
            <Button
              className={mergeClasses(styles.navButton, styles.navNext)}
              appearance='subtle'
              shape='circular'
              icon={<ChevronRight24Regular />}
              aria-label={strings.CatalogScreenshotNext}
              onClick={() => go(1)}
            />
          </>
        )}
      </div>

      {count > 1 && (
        <div className={styles.controls}>
          <div className={styles.dots}>
            {screenshots.map((shot, i) => (
              <button
                key={shot}
                type='button'
                className={mergeClasses(styles.dot, i === safeIndex && styles.dotActive)}
                aria-label={format(strings.CatalogScreenshotAlt, i + 1, count)}
                aria-current={i === safeIndex}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <Text size={100} className={styles.counter}>
            {format(strings.CatalogScreenshotCounter, safeIndex + 1, count)}
          </Text>
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={(_, data) => setLightboxOpen(data.open)}>
        <DialogSurface
          className={styles.lightboxSurface}
          onKeyDown={(e) => {
            // Arrow-key navigation in the lightbox (Escape closes it via Dialog).
            if (count < 2) return
            if (e.key === 'ArrowLeft') go(-1)
            else if (e.key === 'ArrowRight') go(1)
          }}
        >
          <DialogBody className={styles.lightboxBody}>
            <div className={styles.lightboxBar}>
              <Text size={200} className={styles.counter}>
                {count > 1 ? format(strings.CatalogScreenshotCounter, safeIndex + 1, count) : ''}
              </Text>
              <Button
                appearance='subtle'
                icon={<Dismiss24Regular />}
                aria-label={strings.CatalogScreenshotClose}
                onClick={() => setLightboxOpen(false)}
              />
            </div>
            {renderImage(styles.lightboxImage)}
            {count > 1 && (
              <div className={styles.controls}>
                <Button
                  appearance='subtle'
                  icon={<ChevronLeft24Regular />}
                  aria-label={strings.CatalogScreenshotPrevious}
                  onClick={() => go(-1)}
                >
                  {strings.CatalogScreenshotPrevious}
                </Button>
                <Button
                  appearance='subtle'
                  icon={<ChevronRight24Regular />}
                  iconPosition='after'
                  aria-label={strings.CatalogScreenshotNext}
                  onClick={() => go(1)}
                >
                  {strings.CatalogScreenshotNext}
                </Button>
              </div>
            )}
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
