import React, { FunctionComponent } from 'react'
import { IRiskElementProps } from './types'
import styles from './RiskElement.module.scss'
import { RiskElementCallout } from './RiskElementCallout'

export const RiskElement: FunctionComponent<IRiskElementProps> = ({ style, model, calloutTemplate }: IRiskElementProps) => {
  const [callout, setCallout] = React.useState(null)

  const getTooltip = () => {
    let tooltip = ''
    if (model.siteTitle) {
      tooltip += `${model.siteTitle}: `
    }
    tooltip += model.title
    return tooltip
  }

  return (
    <>
      <div
        onClick={(event) => setCallout(event.currentTarget)}
        className={styles.riskElement}
        title={getTooltip()}
        style={style}>
        {model.id}
      </div>
      {callout && (
        <RiskElementCallout
          risk={model}
          calloutTemplate={calloutTemplate}
          target={callout}
          onDismiss={() => setCallout(null)}
        />
      )}
    </>
  )
}
