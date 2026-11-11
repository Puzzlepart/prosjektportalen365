// list-references.js

// List id token regex for project templates: sp-js-provisioning resolves `{listid:<title>}` from
// the site's lists by title, and leaves it as it is when no list has that title
const LISTID_TOKEN_REGEX = /{listid:([^}]+)}/g

// Lists every project site has before the template runs, per content template language: the
// group's document library. A `{listid:}` token may name them although the template does not
// create them. Their URL does not follow their title, so no `Lists/` URL points at them.
// Add a list here only when SharePoint creates it on every project site.
const SITE_LISTS = {
    'no-NB': ['Dokumenter'],
    'en-US': ['Documents']
}

/**
 * Get the URL SharePoint gives a list it creates from the list's title: `Lists/` and the title
 * without the characters SharePoint leaves out. The lists of the project templates show which:
 * letters outside ASCII (`Måleindikatorer` is `Lists/Mleindikatorer`) and `-` (`Benefits follow-up`
 * is `Lists/Benefits followup`). Other punctuation is not covered.
 *
 * @param {string} title List title
 *
 * @returns {string} List URL relative to the site
 */
function getListUrl(title) {
    return `Lists/${title.replace(/[^\x00-\x7F]|-/g, '')}`
}

/**
 * Get the `Lists/<url>` part of a navigation node URL, decoded, or `null` when the URL does not
 * point at a list (a page, a library, `#` or `_layouts`).
 *
 * @param {string} url Navigation node URL
 */
function getNodeListUrl(url) {
    let decodedUrl = url || ''
    try {
        decodedUrl = decodeURIComponent(decodedUrl)
    } catch {
        // A malformed escape: compare the URL as it is
    }
    const match = /^Lists\/([^/?#]+)/i.exec(decodedUrl)
    return match ? `Lists/${match[1]}` : null
}

/**
 * Find the references in a generated project template to lists the template does not have:
 * - `{listid:<title>}` tokens naming neither a list in `Lists` nor a list in `SITE_LISTS`. The
 *   token stays unresolved, so a lookup field points at no list.
 * - Navigation nodes whose URL starts with `Lists/` and names no list the template creates.
 *   SharePoint refuses such a node, and the Navigation handler stops the template.
 *
 * @param {object} template Generated template (parsed JSON)
 * @param {string} lng Content template language (`no-NB`, `en-US`)
 *
 * @returns {{ listIds: string[], navigation: string[] }} The tokens and the nodes, sorted
 */
function findListReferenceProblems(template, lng) {
    const siteLists = SITE_LISTS[lng] || []
    const listTitles = (template.Lists || []).map(list => list.Title)

    const listIds = Array.from(JSON.stringify(template).matchAll(LISTID_TOKEN_REGEX), match => match[1])
    const listIdProblems = Array.from(new Set(listIds))
        .filter(title => !listTitles.includes(title) && !siteLists.includes(title))
        .sort()
        .map(title => `{listid:${title}}`)

    // SharePoint compares URLs without regard to case. The site lists are not created by the
    // template, so their URL is not derived from their title.
    const listUrls = listTitles
        .filter(title => !siteLists.includes(title))
        .map(title => getListUrl(title).toLowerCase())
    const navigationProblems = []
    const checkNodes = (nodes, parentTitles) => {
        for (const node of Array.isArray(nodes) ? nodes : []) {
            const titles = [...parentTitles, node.Title]
            const nodeListUrl = getNodeListUrl(node.Url)
            if (nodeListUrl && !listUrls.includes(nodeListUrl.toLowerCase())) {
                navigationProblems.push(`${titles.join(' > ')}: ${node.Url}`)
            }
            checkNodes(node.Children, titles)
        }
    }
    for (const collection of Object.keys(template.Navigation || {}).sort()) {
        checkNodes(template.Navigation[collection], [collection])
    }

    return { listIds: listIdProblems, navigation: navigationProblems.sort() }
}

module.exports = {
    SITE_LISTS,
    getListUrl,
    findListReferenceProblems
}
