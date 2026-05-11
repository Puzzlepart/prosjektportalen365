import React, { FC } from 'react'
import { useUnSustainabilityGoals } from './useUnSustainabilityGoals'

/* Todo
Første draft for fetche ikon url fra Termstore.
Implementer fetching i andre komponenter.
Sannsynligvis flyttes til shared.
Mye, mye rydding.
*/

export interface UnSustainabilityGoalsProps {
  showLabels?: boolean
  layout?: 'grid' | 'list'
  iconSize?: number
}

export const UnSustainabilityGoals: FC<UnSustainabilityGoalsProps> = ({
  showLabels = false,
  layout = 'grid',
  iconSize = 32
}) => {
  const { UnSustGoals, customProperties } = useUnSustainabilityGoals()

  const getGoalIcon = (label: string) => {
    const iconUrl = customProperties[label]?.IconUrl || customProperties[label]?.Ikon || customProperties[label]?.ikon || customProperties[label]?.icon;
    if (iconUrl) {
      const normalizedIconUrl = (() => {
        const githubBlobMatch = iconUrl.match(/^https:\/\/github\.com\/([^\/]+\/[^\/]+)\/blob\/(.+)$/i)
        if (githubBlobMatch) {
          return `https://raw.githubusercontent.com/${githubBlobMatch[1]}/refs/heads/${githubBlobMatch[2]}`
        }
        return iconUrl.replace(/^https:\/\/github\.com\//i, 'https://raw.githubusercontent.com/')
      })()

      return (
        <img
          src={normalizedIconUrl}
          alt={`UN Goal: ${label}`}
          title={label}
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            margin: '4px',
            flexShrink: 0
          }}
        />
      );
    }
    return <span style={{margin: '4px', fontSize: '12px'}}>{label}</span>;
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
