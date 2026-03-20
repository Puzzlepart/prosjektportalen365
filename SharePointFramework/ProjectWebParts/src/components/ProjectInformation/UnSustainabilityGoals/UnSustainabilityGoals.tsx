import React, { FC } from 'react'
import { useUnSustainabilityGoals } from './useUnSustainabilityGoals'
import UnGoal1Icon from "./svgIcons/UnPovertyGoalIcon.svg";
import UnGoal2Icon from "./svgIcons/UnHungerGoalIcon.svg";
import UnGoal3Icon from "./svgIcons/UnHealthGoalIcon.svg";
import UnGoal4Icon from "./svgIcons/UnEducationGoalIcon.svg";
import UnGoal5Icon from "./svgIcons/UnGenderGoalIcon.svg";
import UnGoal6Icon from "./svgIcons/UnSanitaryGoalIcon.svg";
import UnGoal7Icon from "./svgIcons/UnEnergyGoalIcon.svg";
import UnGoal8Icon from "./svgIcons/UnWorkGoalIcon.svg";
import UnGoal9Icon from "./svgIcons/UnIndustryGoalIcon.svg";
import UnGoal10Icon from "./svgIcons/UnEqualityGoalIcon.svg";
import UnGoal11Icon from "./svgIcons/UnSustainableGoalIcon.svg";
import UnGoal12Icon from "./svgIcons/UnConsumptionGoalIcon.svg";
import UnGoal13Icon from "./svgIcons/UnClimateGoalIcon.svg";
import UnGoal14Icon from "./svgIcons/UnLifeSeaIcon.svg";
import UnGoal15Icon from "./svgIcons/UnLifeLandGoalIcon.svg";
import UnGoal16Icon from "./svgIcons/UnJusticeGoalIcon.svg";
import UnGoal17Icon from "./svgIcons/UnCooperationGoalIcon.svg";

export const UnSustainabilityGoals: FC = () => {
  const {
    UnSustGoals
  } = useUnSustainabilityGoals()

  // Mapping of UN Goal labels to their corresponding SVG icons
  const goalIconMapping: { [key: string]: string } = {
    "1. Utrydde fattigdom": UnGoal1Icon,
    "2. Utrydde sult": UnGoal2Icon,
    "3. God helse og livskvalitet": UnGoal3Icon,
    "4. God utdanning": UnGoal4Icon,
    "5. Likestilling mellom kjønnene": UnGoal5Icon,
    "6. Rent vann og gode sanitærforhold": UnGoal6Icon,
    "7. Ren energi til alle": UnGoal7Icon,
    "8. Anstendig arbeid og økonomisk vekst": UnGoal8Icon,
    "9. Industri, innovasjon og infrastruktur": UnGoal9Icon,
    "10. Mindre ulikhet": UnGoal10Icon,
    "11. Bærekraftige byer og lokalsamfunn": UnGoal11Icon,
    "12. Ansvarlig forbruk og produksjon": UnGoal12Icon,
    "13. Stoppe klimaendringene": UnGoal13Icon,
    "14. Livet i havet": UnGoal14Icon,
    "15. Livet på land": UnGoal15Icon,
    "16. Fred, rettferdighet og velfungerende institusjoner": UnGoal16Icon,
    "17. Samarbeid for å nå målene": UnGoal17Icon
  }

  const getGoalIcon = (label: string) => {
    const icon = goalIconMapping[label];
    if (icon) {
      return (
        <img
          src={icon}
          alt={`UN Goal: ${label}`}
          title={label}
          style={{
            width: '32px',
            height: '32px',
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
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '100%'
        }}>
          {UnSustGoals.value.map((entry: any, index: number) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {getGoalIcon(entry.Label)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
