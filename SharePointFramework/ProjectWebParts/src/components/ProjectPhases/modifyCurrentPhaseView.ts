import { sp } from '@pnp/sp'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Modify frontpage current phase view.
 *
 * @param phaseTermName Phase term name
 * @param currentPhaseViewName Current phase view name
 */
export const modifyCurrentPhaseView = async (
  phaseTermName: string,
  currentPhaseViewName: string
) => {
  const documentsViews = sp.web.lists.getByTitle(strings.DocumentsListName).views
  const [documentsFrontpageView] = await documentsViews
    .select('Id', 'ViewQuery')
    .filter(`Title eq '${currentPhaseViewName}'`)
    .get<{ Id: string; ViewQuery: string }[]>()
  if (!documentsFrontpageView) return
  const viewQueryDom = new DOMParser().parseFromString(
    `<Query> ${documentsFrontpageView.ViewQuery}</Query> `,
    'text/xml'
  )
  const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0]
  const orderBy = orderByDomElement ? orderByDomElement.outerHTML : ''
  const newViewQuery = [
    orderBy,
    `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`
  ].join('')
  try {
    await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery })
  } catch (err) {}
}
