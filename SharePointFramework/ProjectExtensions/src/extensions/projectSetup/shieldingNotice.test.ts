import strings from 'ProjectExtensionsStrings'
import resource from 'SharedResources'
import { getShieldingNotice } from './shieldingNotice'

const HUB = 'https://contoso.sharepoint.com/sites/portefolje'
const SITE_ID = 'a2f7c7f5-37d5-4d6f-9d6b-0d0f5a6b7c8d'

describe('getShieldingNotice', () => {
  it('names what stays on the hub, each list linked, and the two that name the project filtered on its site ID', () => {
    const { title, text } = getShieldingNotice(`${HUB}/`, SITE_ID)
    expect(title).toBe(strings.ShieldingExistingProjectTitle)
    const ofProject = `/AllItems.aspx?FilterField1=GtSiteId&FilterValue1=${SITE_ID}&FilterType1=Text`
    const linked = (listTitle: string, listUrl: string, view = '') =>
      `**[${listTitle}](${HUB}/${listUrl}${view})**`
    expect(text).toContain(
      linked(resource.Lists_Projects_Title, resource.Lists_Projects_Url, ofProject)
    )
    expect(text).toContain(
      linked(resource.Lists_ProjectStatus_Title, resource.Lists_ProjectStatus_Url, ofProject)
    )
    expect(text).toContain(
      linked(
        resource.Lists_ProjectStatusAttachments_Title,
        resource.Lists_ProjectStatusAttachments_Url
      )
    )
    expect(text).toContain(
      linked(
        resource.Lists_TimelineContent_Title,
        resource.Lists_TimelineContent_Url,
        '/AllItems.aspx'
      )
    )
    expect(text).toContain(
      linked(resource.Lists_ArchiveLog_Title, resource.Lists_ArchiveLog_Url, '/AllItems.aspx')
    )
  })

  it('opens with what shielding covers, lists the four kinds of data, and ends with what removing them takes', () => {
    const [intro, list, outro] = getShieldingNotice(HUB, SITE_ID).text.split('\n\n')
    expect(intro).toBe(strings.ShieldingExistingProjectIntroText)
    const points = list.split('\n')
    expect(points).toHaveLength(4)
    expect(points.every((point) => point.startsWith('- **['))).toBe(true)
    // No placeholder is left unfilled.
    expect(list).not.toMatch(/\{\d\}/)
    expect(outro).toBe(strings.ShieldingExistingProjectOutroText)
  })

  it('names the lists without links when the hub is not known', () => {
    const { text } = getShieldingNotice(undefined, SITE_ID)
    expect(text).toContain(`**${resource.Lists_Projects_Title}**`)
    expect(text).not.toContain('](')
  })
})
