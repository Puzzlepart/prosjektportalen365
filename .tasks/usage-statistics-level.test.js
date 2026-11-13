/**
 * Tests for the usage statistics functions of Install/Scripts/SharedFunctions.ps1, which Install.ps1
 * and PreInstallUpgrade.ps1 use: the level a hub without the UsageStatisticsLevel row starts at (P7
 * in docs/plans/usage-logging.md), the level the hub's rows give as the browsers' gate reads them
 * (P3), the template catalog's telemetryUrl opt-out, and the summary at the end of a run. The
 * functions are pure, so pwsh runs them over fixtures/usage-statistics-level.json without
 * SharePoint. Run with `npm run test:tasks`; skipped with a notice where pwsh is missing.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const SHARED_FUNCTIONS = path.join(__dirname, '..', 'Install', 'Scripts', 'SharedFunctions.ps1')
const FIXTURE = path.join(__dirname, 'fixtures', 'usage-statistics-level.json')
const scenarios = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))

/** Runs every scenario in one pwsh process, after dot-sourcing SharedFunctions.ps1, and writes JSON. */
const RUNNER = String.raw`
param([string]$SharedFunctions, [string]$Fixture)
$ErrorActionPreference = 'Stop'
. $SharedFunctions
$Scenarios = Get-Content -Raw -Path $Fixture | ConvertFrom-Json

function ConvertTo-Rows($Rows) {
    return , @(@($Rows) | Where-Object { $null -ne $_ } | ForEach-Object {
        [PSCustomObject]@{ Key = $_.key; Value = $_.value; Enabled = [bool]$_.enabled; SettingsId = '' }
    })
}

$Resolve = foreach ($S in @($Scenarios.resolve)) {
    $R = Resolve-InitialUsageStatisticsLevel -ExplicitLevel "$($S.explicitLevel)" -TelemetryUrlDisabled ([bool]$S.telemetryUrlDisabled) -CatalogRows (ConvertTo-Rows $S.catalogRows) -PreviousVersion $S.previousVersion
    [ordered]@{ name = $S.name; value = $R.Value; reason = $R.Reason }
}
$Effective = foreach ($S in @($Scenarios.effective)) {
    $E = Get-EffectiveUsageStatisticsLevel -Rows (ConvertTo-Rows $S.rows)
    [ordered]@{ name = $S.name; level = $E.Level; reason = $E.Reason; catalog = $E.Catalog; assistant = $E.Assistant }
}
$TelemetryUrl = foreach ($S in @($Scenarios.telemetryUrl)) {
    [ordered]@{ name = $S.name; optOut = (Test-TelemetryUrlOptOut -Properties $S.properties) }
}
$Convert = foreach ($S in @($Scenarios.convert)) {
    try { $Out = Convert-UsageStatisticsLevel -Level "$($S.level)" } catch { $Out = 'error' }
    [ordered]@{ name = $S.name; result = $Out }
}
$Summary = foreach ($S in @($Scenarios.summary)) {
    $E = if ($S.unread) { $null } else { Get-EffectiveUsageStatisticsLevel -Rows (ConvertTo-Rows $S.rows) }
    $Lines = Format-UsageStatisticsSummary -Effective $E -ListTitle 'Globale innstillinger' -PingbackSent ([bool]$S.pingbackSent) -ReadError "$($S.readError)"
    [ordered]@{ name = $S.name; lines = @($Lines) }
}
[ordered]@{
    resolve      = @($Resolve)
    effective    = @($Effective)
    telemetryUrl = @($TelemetryUrl)
    convert      = @($Convert)
    summary      = @($Summary)
} | ConvertTo-Json -Depth 8 -Compress
`

/** Whether pwsh can be started here. */
function hasPwsh() {
    const probe = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.Major'], {
        encoding: 'utf8'
    })
    return !probe.error && probe.status === 0
}

const skip = hasPwsh() ? false : 'pwsh is not installed here: the usage statistics functions of SharedFunctions.ps1 are not run'

/** The results of every scenario, by group and name; empty where pwsh is missing. */
const results = skip ? {} : runScenarios()

/** Runs the scenarios in pwsh and reads what it wrote. A failed run fails every test in the file. */
function runScenarios() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp365-usage-level-'))
    const runner = path.join(dir, 'runner.ps1')
    fs.writeFileSync(runner, RUNNER)
    try {
        const run = spawnSync(
            'pwsh',
            ['-NoProfile', '-NonInteractive', '-File', runner, '-SharedFunctions', SHARED_FUNCTIONS, '-Fixture', FIXTURE],
            { encoding: 'utf8' }
        )
        if (run.status !== 0) {
            throw new Error(`pwsh exited ${run.status}: ${run.stderr || run.stdout}`)
        }
        return JSON.parse(run.stdout)
    } finally {
        fs.rmSync(dir, { recursive: true, force: true })
    }
}

/** One scenario's result, found by its name. */
function resultOf(group, name) {
    const result = (results[group] ?? []).find((entry) => entry.name === name)
    assert.ok(result, `pwsh gave no result for ${group} "${name}"`)
    return result
}

for (const scenario of scenarios.resolve) {
    test(`initial level: ${scenario.name}`, { skip }, () => {
        const { value, reason } = resultOf('resolve', scenario.name)
        assert.deepEqual({ value, reason }, scenario.expected)
    })
}

for (const scenario of scenarios.effective) {
    test(`effective level: ${scenario.name}`, { skip }, () => {
        const { level, reason, catalog, assistant } = resultOf('effective', scenario.name)
        assert.deepEqual({ level, reason, catalog, assistant }, scenario.expected)
    })
}

for (const scenario of scenarios.telemetryUrl) {
    test(`catalog telemetryUrl opt-out: ${scenario.name}`, { skip }, () => {
        assert.equal(resultOf('telemetryUrl', scenario.name).optOut, scenario.expected)
    })
}

for (const scenario of scenarios.convert) {
    test(`level name and value: ${scenario.name}`, { skip }, () => {
        assert.equal(resultOf('convert', scenario.name).result, scenario.expected)
    })
}

for (const scenario of scenarios.summary) {
    test(`summary: ${scenario.name}`, { skip }, () => {
        const text = resultOf('summary', scenario.name).lines.join('\n')
        for (const expected of scenario.includes) {
            assert.ok(text.includes(expected), `the summary lacks "${expected}":\n${text}`)
        }
        for (const unexpected of scenario.excludes) {
            assert.ok(!text.includes(unexpected), `the summary has "${unexpected}":\n${text}`)
        }
    })
}
