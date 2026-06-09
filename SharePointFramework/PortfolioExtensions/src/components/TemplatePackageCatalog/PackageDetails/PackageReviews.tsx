import {
  Avatar,
  Caption1,
  makeStyles,
  RatingDisplay,
  Text,
  tokens
} from '@fluentui/react-components'
import { formatDate } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { getPackageReviews } from '../packageStats'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalS
  },
  headingRow: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: tokens.spacingHorizontalS
  },
  heading: {
    color: tokens.colorNeutralForeground2
  },
  demoNote: {
    color: tokens.colorNeutralForeground4
  },
  review: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalS
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
    flexGrow: 1
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  author: {
    color: tokens.colorNeutralForeground1
  },
  sub: {
    color: tokens.colorNeutralForeground3
  },
  text: {
    color: tokens.colorNeutralForeground2
  }
})

/**
 * Reviews section for the package details pane. Renders the package's
 * fabricated example reviews (see {@link getPackageReviews}) with a subtle
 * "example data" note so they are not mistaken for real telemetry.
 */
export const PackageReviews: FC<{ packageId: string }> = ({ packageId }) => {
  const styles = useStyles()
  const reviews = getPackageReviews(packageId)
  if (reviews.length === 0) return null

  return (
    <div className={styles.root}>
      <div className={styles.headingRow}>
        <Text size={300} weight='semibold' className={styles.heading}>
          {strings.CatalogReviewsHeading}
        </Text>
        <Caption1 className={styles.demoNote}>{strings.CatalogReviewsDemoNote}</Caption1>
      </div>
      {reviews.map((review, i) => (
        <div key={`${review.author}-${i}`} className={styles.review}>
          <Avatar name={review.author} size={32} color='colorful' aria-hidden />
          <div className={styles.body}>
            <div className={styles.metaRow}>
              <Text size={200} weight='semibold' className={styles.author}>
                {review.author}
              </Text>
              <Caption1 className={styles.sub}>{review.role}</Caption1>
              <RatingDisplay value={review.rating} color='marigold' size='small' />
              <Caption1 className={styles.sub}>{formatDate(review.date)}</Caption1>
            </div>
            <Text size={200} className={styles.text}>
              {review.text}
            </Text>
          </div>
        </div>
      ))}
    </div>
  )
}
