import { Callout } from '@fluentui/react/lib/Callout'
import React, { FC } from 'react'
import { replaceTokens } from 'pp365-shared/lib/util/replaceTokens'
import { IRiskElementCalloutProps } from './types'

export const RiskElementCallout: FC<IRiskElementCalloutProps> = ({
  risk,
  calloutTemplate,
  target,
  onDismiss
}: IRiskElementCalloutProps) => {
  const content = replaceTokens(calloutTemplate, risk.item)
  return (
    <Callout
      styles={{ root: { minWidth: 250, padding: 10 } }}
      target={target}
      onDismiss={onDismiss}>
      <span dangerouslySetInnerHTML={{ __html: content }}></span>
    </Callout>
  )
}
