import React, { FC } from 'react'
import { useUnSustainabilityGoals } from './useUnSustainabilityGoals'

export interface UnSustainabilityGoalsProps {
  showLabels?: boolean
  layout?: 'grid' | 'list'
  iconSize?: number
}

// Dynamic imports for UN Goal icons - only imports icons that are actually used
const iconImports: { [key: string]: () => Promise<{ default: string }> } = {
  "1. Utrydde fattigdom": () => import("../../../../../../assets/icons/UnPoverty.svg"),
  "2. Utrydde sult": () => import("../../../../../../assets/icons/UnHunger.svg"),
  "3. God helse og livskvalitet": () => import("../../../../../../assets/icons/UnHealth.svg"),
  "4. God utdanning": () => import("../../../../../../assets/icons/UnEducation.svg"),
  "5. Likestilling mellom kjønnene": () => import("../../../../../../assets/icons/UnGender.svg"),
  "6. Rent vann og gode sanitærforhold": () => import("../../../../../../assets/icons/UnWater.svg"),
  "7. Ren energi til alle": () => import("../../../../../../assets/icons/UnEnergy.svg"),
  "8. Anstendig arbeid og økonomisk vekst": () => import("../../../../../../assets/icons/UnGrowth.svg"),
  "9. Industri, innovasjon og infrastruktur": () => import("../../../../../../assets/icons/UnInnovation.svg"),
  "10. Mindre ulikhet": () => import("../../../../../../assets/icons/UnEquality.svg"),
  "11. Bærekraftige byer og lokalsamfunn": () => import("../../../../../../assets/icons/UnSustainability.svg"),
  "12. Ansvarlig forbruk og produksjon": () => import("../../../../../../assets/icons/UnConsumption.svg"),
  "13. Stoppe klimaendringene": () => import("../../../../../../assets/icons/UnClimate.svg"),
  "14. Livet i havet": () => import("../../../../../../assets/icons/UnSeaLife.svg"),
  "15. Livet på land": () => import("../../../../../../assets/icons/UnLandLife.svg"),
  "16. Fred, rettferdighet og velfungerende institusjoner": () => import("../../../../../../assets/icons/UnJustice.svg"),
  "17. Samarbeid for å nå målene": () => import("../../../../../../assets/icons/UnCooperation.svg")
}

export const UnSustainabilityGoals: FC<UnSustainabilityGoalsProps> = ({
  showLabels = false,
  layout = 'grid',
  iconSize = 32
}) => {
  const { UnSustGoals } = useUnSustainabilityGoals()
  const [iconUrls, setIconUrls] = React.useState<{ [key: string]: string }>({})

  // Load only the icons that are actually needed
  React.useEffect(() => {
    if (UnSustGoals?.value && UnSustGoals.value.length > 0) {
      const loadIcons = async () => {
        const loadedIcons: { [key: string]: string } = {}

        // Only import icons that are present in the data
        const iconsToLoad = UnSustGoals.value.filter(entry => iconImports[entry.Label])

        for (const entry of iconsToLoad) {
          try {
            const iconModule = await iconImports[entry.Label]()
            loadedIcons[entry.Label] = iconModule.default
          } catch (error) {
            console.warn(`Failed to load icon for: ${entry.Label}`, error)
          }
        }

        setIconUrls(loadedIcons)
      }

      loadIcons()
    }
  }, [UnSustGoals])

  const getGoalIcon = (label: string) => {
    const icon = iconUrls[label];
    if (icon) {
      return (
        <img
          src={icon}
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
