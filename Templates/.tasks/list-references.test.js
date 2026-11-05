/**
 * Tests for list-references.js, the list checks of validate-project-template.js: a `{listid:}`
 * token must name a list the site has, or the lookup field points at no list, and a navigation
 * node's `Lists/` URL must name a list the template creates, or SharePoint refuses the node and
 * sp-js-provisioning stops the template. Run with `npm test` in `Templates`.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { getListUrl, findListReferenceProblems } = require('./list-references')

/** A template with the given lists, a lookup field with each `{listid:}` and the Quick Launch `nodes`. */
function template(lists, listIds, nodes) {
    return {
        Lists: lists.map((Title, i) => ({
            Title,
            Template: 100,
            Fields: i === 0 ? listIds.map(title => `<Field Type="Lookup" List="{listid:${title}}" ShowField="Title" />`) : []
        })),
        Navigation: { QuickLaunch: nodes }
    }
}

test('derives the list URL from the title without letters outside ASCII and without hyphens', () => {
    assert.equal(getListUrl('Prosjektlogg'), 'Lists/Prosjektlogg')
    assert.equal(getListUrl('Project log'), 'Lists/Project log')
    assert.equal(getListUrl('Måleindikatorer'), 'Lists/Mleindikatorer')
    assert.equal(getListUrl('Nytteoppfølging'), 'Lists/Nytteoppflging')
    assert.equal(getListUrl('Benefits follow-up'), 'Lists/Benefits followup')
})

test('finds nothing when every reference names a list of the template or of the site', () => {
    const problems = findListReferenceProblems(
        template(['Prosjektlogg', 'Måleindikatorer', 'Dokumenter'], ['Måleindikatorer', 'Dokumenter'], [
            { Title: 'Hjem', Url: 'SitePages/ProjectHome.aspx' },
            { Title: 'Prosjektlogg', Url: 'Lists/Prosjektlogg/AllItems.aspx' },
            { Title: 'Dokumenter', Url: 'Delte dokumenter/Forms/AllItems.aspx' },
            { Title: 'Notatblokk', Url: '#' },
            {
                Title: 'Nytteoversikt',
                Url: 'SitePages/Nytteoversikt.aspx',
                Children: [{ Title: 'Måleindikatorer', Url: 'lists/mleindikatorer/AllItems.aspx' }]
            },
            { Title: 'Områdeinnhold', Url: '_layouts/15/viewlsts.aspx' }
        ]),
        'no-NB'
    )
    assert.deepEqual(problems, { listIds: [], navigation: [] })
})

test("takes the site's document library for a {listid:} token without the template listing it", () => {
    assert.deepEqual(findListReferenceProblems(template(['Prosjektlogg'], ['Dokumenter'], []), 'no-NB').listIds, [])
    assert.deepEqual(findListReferenceProblems(template(['Project log'], ['Documents'], []), 'en-US').listIds, [])
    assert.deepEqual(findListReferenceProblems(template(['Project log'], ['Dokumenter'], []), 'en-US').listIds, ['{listid:Dokumenter}'])
})

test('reports a {listid:} token that names a list the template does not have, once', () => {
    // The program template's project log looked up the project template's deliveries list
    const problems = findListReferenceProblems(
        template(['Prosjektlogg', 'Programleveranser'], ['Prosjektleveranser', 'Programleveranser', 'Prosjektleveranser'], []),
        'no-NB'
    )
    assert.deepEqual(problems.listIds, ['{listid:Prosjektleveranser}'])
})

test('reports a node whose Lists/ URL names no list the template creates, with the titles above it', () => {
    // The en-US benefit analysis list was renamed in 1.14.0, its Quick Launch URL was not
    const problems = findListReferenceProblems(
        template(['Benefit analysis and benefit management plan', 'Benefits follow-up'], [], [
            {
                Title: 'Benefits Overview',
                Url: 'SitePages/BenefitOverview.aspx',
                Children: [
                    { Title: 'Benefit Analysis and Benefit Management Plan', Url: 'Lists/Benefits analysis and realization plan/AllItems.aspx' },
                    { Title: 'Benefits Follow-up', Url: 'Lists/Benefits%20followup/AllItems.aspx' }
                ]
            }
        ]),
        'en-US'
    )
    assert.deepEqual(problems.navigation, [
        'QuickLaunch > Benefits Overview > Benefit Analysis and Benefit Management Plan: Lists/Benefits analysis and realization plan/AllItems.aspx'
    ])
})

test("reports a Lists/ URL to the site's document library, which is not under Lists/", () => {
    const problems = findListReferenceProblems(
        template(['Dokumenter'], [], [{ Title: 'Dokumenter', Url: 'Lists/Dokumenter/AllItems.aspx' }]),
        'no-NB'
    )
    assert.deepEqual(problems.navigation, ['QuickLaunch > Dokumenter: Lists/Dokumenter/AllItems.aspx'])
})

test('checks the top navigation bar too', () => {
    const problems = findListReferenceProblems(
        { Lists: [], Navigation: { TopNavigationBar: [{ Title: 'Logg', Url: 'Lists/Prosjektlogg/AllItems.aspx' }] } },
        'no-NB'
    )
    assert.deepEqual(problems.navigation, ['TopNavigationBar > Logg: Lists/Prosjektlogg/AllItems.aspx'])
})

const CONTENT_DIR = path.resolve(__dirname, '../Content')
const GENERATED_TEMPLATES = [
    ['no-NB', 'Standardmal'],
    ['no-NB', 'Programmal'],
    ['no-NB', 'Overordnet'],
    ['en-US', 'DefaultTemplate'],
    ['en-US', 'ProgramTemplate'],
    ['en-US', 'ParentTemplate']
].map(([lng, name]) => ({ lng, name, file: path.join(CONTENT_DIR, `Portfolio_content.${lng}`, 'ProjectTemplates', `${name}.txt`) }))
const generated = GENERATED_TEMPLATES.every(({ file }) => fs.existsSync(file))

test(
    'the generated project templates refer only to lists they have',
    { skip: !generated && 'the project templates are not generated: run `npm run build` first' },
    () => {
        for (const { lng, name, file } of GENERATED_TEMPLATES) {
            const problems = findListReferenceProblems(JSON.parse(fs.readFileSync(file, 'utf8')), lng)
            assert.deepEqual(problems, { listIds: [], navigation: [] }, `${lng} ${name}`)
        }
    }
)
