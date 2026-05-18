import React, { FC } from 'react'
import { Tooltip } from '@fluentui/react-components'
import { useUnSustainabilityGoals } from './useUnSustainabilityGoals'
import { useProjectInformationContext } from '../context'

export interface UnSustainabilityGoalsProps {
  showLabels?: boolean
  layout?: 'grid' | 'list'
}

export const UnSustainabilityGoals: FC<UnSustainabilityGoalsProps> = ({
  showLabels = false,
  layout = 'grid'
}) => {
  const { UnSustGoals, customProperties } = useUnSustainabilityGoals()
  const context = useProjectInformationContext()
  const getGoalIcon = (label: string) => {
    const iconUrl = customProperties[label]?.IkonUrl;
    const iconContent = iconUrl ? (
      <img
        src={iconUrl}
        alt={`UN Goal: ${label}`}
        style={{
          width: `${context.props.iconSize}px`,
          height: `${context.props.iconSize}px`,
          margin: '4px',
          flexShrink: 0
        }}
      />
    ) : (
      <span style={{ margin: '4px', fontSize: '12px', display: 'inline-flex' }}>{label}</span>
    )

    return (
      <Tooltip
        withArrow
        relationship='description'
        content={
          <div
            style={{
              padding: '16px',
              maxWidth: '300px',
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.16)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              color: 'rgba(0, 0, 0, 0.87)',
              fontSize: '14px'
            }}
          >
            {label}
          </div>
        }
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
          {iconContent}
        </span>
      </Tooltip>
    )
  }

  return (
    <div>
      {UnSustGoals && UnSustGoals.value && UnSustGoals.value.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: layout === 'list' ? 'column' : 'row',
          flexWrap: layout === 'grid' ? 'wrap' : 'nowrap',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '100%'
        }}>
          {UnSustGoals.value.map((entry: any, index: number) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: showLabels ? 'column' : 'row'
            }}>
              {getGoalIcon(entry.Label)}
              {showLabels && (
                <span style={{ fontSize: '10px', textAlign: 'center', marginTop: '2px' }}>
                  {entry.Label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
