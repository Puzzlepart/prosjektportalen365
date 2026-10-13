import { BenefitMeasurement } from './BenefitMeasurement'

/**
 * A benefit measurement from search: its date shown in SharePoint's UI language (the Excel export
 * uses the date itself), its value, how far it has come towards the indicator's goal, and the
 * trend against the previous measurement.
 */
function measurement(value: string, date = '2026-03-15T00:00:00') {
  return new BenefitMeasurement({
    SiteTitle: 'Frisbeegolfbane',
    SPWebURL: 'https://contoso.sharepoint.com/sites/frisbee',
    ListItemId: '4',
    Title: 'Flere besøkende',
    SiteId: 'site-1',
    GtMeasurementDateOWSDATE: date,
    GtMeasurementValueOWSNMBR: value,
    GtMeasurementCommentOWSMTXT: 'Etter åpningen',
    GtMeasureIndicatorLookupId: '2'
  } as any)
}

const INDICATOR = { StartValue: 100, DesiredValue: 200 } as any

describe('BenefitMeasurement', () => {
  afterEach(() => {
    delete (window as any)._spPageContextInfo
  })

  it("shows the date in SharePoint's UI language and keeps the date itself", () => {
    // jsdom's browser language is en-US, where the date would read 3/15/2026.
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'nb-NO' }
    const nb = measurement('150')
    expect(nb.DateDisplay).toBe('15.03.2026')
    expect(nb.Date).toEqual(new Date('2026-03-15T00:00:00'))
    ;(window as any)._spPageContextInfo = { currentUICultureName: 'en-US' }
    expect(measurement('150').DateDisplay).toBe('03/15/2026')
  })

  it('reads the value, the comment and the indicator, and leaves a missing value empty', () => {
    const m = measurement('150.456')
    expect(m.Value).toBe(150.456)
    expect(m.ValueDisplay).toBe('150.46')
    expect(m.Comment).toBe('Etter åpningen')
    expect(m.IndicatorId).toBe(2)
    expect(m.Id).toBe(4)
    expect(measurement('').Value).toBeNull()
  })

  it('measures the achievement against the indicator', () => {
    const m = measurement('150').calculcateAchievement(INDICATOR)
    expect(m.Achievement).toBe(50)
    expect(m.AchievementDisplay).toBe('50.00%')
  })

  it('sets the trend: a trophy at the goal, up or down against the previous measurement', () => {
    const previous = measurement('150').calculcateAchievement(INDICATOR)
    expect(
      measurement('200').calculcateAchievement(INDICATOR).setTrendIcon(previous).TrendIcon
    ).toEqual({ iconName: 'Trophy', color: 'gold' })
    expect(
      measurement('180').calculcateAchievement(INDICATOR).setTrendIcon(previous).TrendIcon.iconName
    ).toBe('CaretUp')
    expect(
      measurement('120').calculcateAchievement(INDICATOR).setTrendIcon(previous).TrendIcon.iconName
    ).toBe('CaretDown')
    expect(
      measurement('150').calculcateAchievement(INDICATOR).setTrendIcon(previous).TrendIcon
    ).toBeUndefined()
  })
})
