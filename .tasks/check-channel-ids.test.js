/**
 * Tests for check-channel-ids.js: the source must carry the main channel's solution and component
 * ids, so a release build never packages another channel's (as a commit made while a test-channel
 * `npm run watch` ran once nearly did). Run with `npm run test:tasks`.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { findChannelIdMismatches } = require('./check-channel-ids')

const MAIN = {
    name: 'main',
    spfx: {
        solutions: {
            ProjectWebParts: {
                id: 'b69cb2f2-762d-425d-8e0b-d59c08918831',
                name: 'Prosjektportalen 365 - Project Web Parts',
                zippedPackage: 'solution/pp-project-web-parts.sppkg',
                components: {
                    ProjectPhasesWebPart: '4449d3dc-fa58-4982-b87c-5a893114e7b7',
                    RiskMatrixWebPart: 'e536ae15-0748-4d96-b160-3abb30f1b71e'
                }
            },
            PortfolioWebParts: {
                id: '00483367-68e2-4977-9cc3-6cf0de623daa',
                name: 'Prosjektportalen 365 - Portfolio Web Parts',
                zippedPackage: 'solution/pp-portfolio-web-parts.sppkg',
                components: { PortfolioOverviewWebPart: 'e58e3d32-057a-4418-97ce-172b92482ba2' }
            }
        }
    }
}

/** A repository root with main.json and the two solutions as main has them, plus `changes`. */
function fixture(changes = () => undefined) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pp365-channel-ids-'))
    const write = (file, json) => {
        fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
        fs.writeFileSync(path.join(root, file), JSON.stringify(json, null, 2))
    }
    write('channels/main.json', MAIN)
    for (const [solution, config] of Object.entries(MAIN.spfx.solutions)) {
        const base = `SharePointFramework/${solution}`
        write(`${base}/config/package-solution.json`, {
            solution: { name: config.name, id: config.id, version: '1.14.0.0' },
            paths: { zippedPackage: config.zippedPackage }
        })
        for (const [alias, id] of Object.entries(config.components)) {
            write(`${base}/src/webparts/${alias}/manifest.json`, { id, alias, componentType: 'WebPart' })
        }
    }
    // A built copy must not count: only the sources under src are the solution's manifests.
    write('SharePointFramework/ProjectWebParts/node_modules/x/src/manifest.json', { id: 'other', alias: 'X' })
    changes(root, write)
    return root
}

test('finds nothing when the solutions carry the main channel ids', () => {
    assert.deepEqual(findChannelIdMismatches(fixture(), ['ProjectWebParts', 'PortfolioWebParts']), [])
})

test("reports another channel's solution id, name and package in package-solution.json", () => {
    const root = fixture((_root, write) =>
        write('SharePointFramework/ProjectWebParts/config/package-solution.json', {
            solution: {
                name: 'Prosjektportalen 365 - Project Web Parts - test',
                id: '99305c90-4fdb-4289-9379-2702957b3777'
            },
            paths: { zippedPackage: 'solution/pp-project-web-parts-test.sppkg' }
        })
    )
    const found = findChannelIdMismatches(root, ['ProjectWebParts'])
    assert.equal(found.length, 3)
    assert.match(found[0], /ProjectWebParts.*solution\.id.*99305c90-4fdb-4289-9379-2702957b3777.*b69cb2f2-762d-425d-8e0b-d59c08918831/)
    assert.match(found[1], /solution\.name.*- test/)
    assert.match(found[2], /zippedPackage.*pp-project-web-parts-test\.sppkg/)
})

test("reports a component manifest with another channel's id, by alias and file", () => {
    const root = fixture((_root, write) =>
        write('SharePointFramework/ProjectWebParts/src/webparts/RiskMatrixWebPart/manifest.json', {
            id: 'b1500cba-4eef-437e-92db-7728dcd9502c',
            alias: 'RiskMatrixWebPart'
        })
    )
    const found = findChannelIdMismatches(root, ['ProjectWebParts'])
    assert.equal(found.length, 1)
    assert.match(found[0], /RiskMatrixWebPart.*src\/webparts\/RiskMatrixWebPart\/manifest\.json.*b1500cba/)
})

test('reports a component the main channel does not know', () => {
    const root = fixture((_root, write) =>
        write('SharePointFramework/ProjectWebParts/src/webparts/NewWebPart/manifest.json', {
            id: '11111111-2222-3333-4444-555555555555',
            alias: 'NewWebPart'
        })
    )
    const found = findChannelIdMismatches(root, ['ProjectWebParts'])
    assert.equal(found.length, 1)
    assert.match(found[0], /NewWebPart.*not in channels\/main\.json/)
})

test('checks only the solutions it is given', () => {
    const root = fixture((_root, write) =>
        write('SharePointFramework/PortfolioWebParts/src/webparts/PortfolioOverviewWebPart/manifest.json', {
            id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            alias: 'PortfolioOverviewWebPart'
        })
    )
    assert.deepEqual(findChannelIdMismatches(root, ['ProjectWebParts']), [])
    assert.equal(findChannelIdMismatches(root, ['PortfolioWebParts']).length, 1)
})
