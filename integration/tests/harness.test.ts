import assert from 'node:assert/strict'
import { createPrivateKey, generateKeyPairSync, sign, verify, X509Certificate } from 'node:crypto'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { describe, it } from 'node:test'
import forge from 'node-forge'
import { readCertificate } from '../src/auth.ts'
import { spfxContext } from '../src/context.ts'
import { env } from '../src/env.ts'
import { portalDataService, projectDataService, termStore } from '../src/library.ts'
import { stringsToCommonJs } from '../src/loader.ts'

/**
 * A self-signed certificate and its key in a PFX, base64, as `CI_CERT_BASE64` holds the CI app's.
 *
 * @param password `''` for an empty password, `null` for none at all
 * @param algorithm How the key is encrypted
 */
function pfx(password: string | null, algorithm: '3des' | 'aes256') {
  const keys = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  })
  const key = forge.pki.privateKeyFromPem(keys.privateKey)
  const certificate = forge.pki.createCertificate()
  certificate.publicKey = forge.pki.publicKeyFromPem(keys.publicKey)
  certificate.serialNumber = '01'
  certificate.validity.notBefore = new Date()
  certificate.validity.notAfter = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const name = [{ name: 'commonName', value: 'pp365-integration' }]
  certificate.setSubject(name)
  certificate.setIssuer(name)
  certificate.sign(key, forge.md.sha256.create())
  const asn1 = forge.pkcs12.toPkcs12Asn1(key, certificate, password, { algorithm })
  return {
    base64: forge.util.encode64(forge.asn1.toDer(asn1).getBytes()),
    certificate: new X509Certificate(forge.pki.certificateToPem(certificate))
  }
}

/**
 * The harness, without a tenant: Node loads the library's CommonJS build, its SPFx string modules
 * in the configured language, and its data services, which on a page find a `window` and SPFx.
 */
describe('the harness', () => {
  const require = createRequire(import.meta.url)

  it("loads the library's string modules in the configured language", () => {
    const strings = require('SharedLibraryStrings') as Record<string, string>
    const resources = require('SharedResources') as Record<string, string>
    assert.equal(strings.CloseText, env.locale === 'en-us' ? 'Close' : 'Lukk')
    assert.equal(typeof resources.Lists_Projects_Title, 'string')
  })

  it('turns a string bundle of another shape into an error that names the file', () => {
    const code = stringsToCommonJs(
      'define([], { CloseText: "Lukk" })',
      '/solution/lib/loc/nb-no.js'
    )
    assert.throws(
      () => runInNewContext(code, { module: { exports: {} } }),
      /Unexpected AMD shape in \/solution\/lib\/loc\/nb-no\.js/
    )
  })

  it('loads the data services without a page', () => {
    assert.equal(typeof portalDataService().PortalDataService, 'function')
    assert.equal(typeof projectDataService().ProjectDataService, 'function')
    assert.equal(typeof termStore().getTermStore, 'function')
  })

  describe('the SPFx context', () => {
    const url = 'https://tenant.sharepoint.com/sites/project'
    const site = {
      Id: 'site-id',
      Url: url,
      ServerRelativeUrl: '/sites/project',
      HubSiteId: 'hub-id'
    }
    const web = {
      Id: 'web-id',
      Title: 'Project',
      Url: url,
      ServerRelativeUrl: '/sites/project',
      Language: 1044
    }
    const user = {
      Title: 'User',
      Email: 'user@tenant.no',
      LoginName: 'i:0#.f|membership|user@tenant.no'
    }

    it('is built from what a site says about itself, as the services read it', () => {
      const { pageContext } = spfxContext(site, web, user, 'nb-no')
      assert.equal(pageContext.site.id.toString(), 'site-id')
      assert.equal(pageContext.web.id.toString(), 'web-id')
      assert.equal(pageContext.web.absoluteUrl, url)
      assert.equal(pageContext.legacyPageContext.hubSiteId, 'hub-id')
      assert.equal(pageContext.user.email, 'user@tenant.no')
      // SharePoint's culture names, as the library's `getUILocale` reads them.
      assert.equal(pageContext.cultureInfo.currentUICultureName, 'nb-NO')
    })

    it("refuses strings in another language than the site's, in which the hub's lists have other titles", () => {
      assert.throws(
        () => spfxContext(site, web, user, 'en-us'),
        /INTEGRATION_LOCALE en-us does not match/
      )
      assert.doesNotThrow(() => spfxContext(site, { ...web, Language: 1033 }, user, 'en-us'))
    })
  })

  // CI signs in with the CI app's certificate, which no developer machine has: these prove the
  // reading of the PFX offline, against Node's own reading of the certificate.
  const PFX_KINDS = [
    ['an empty password', '', '3des'],
    ['no password at all', null, '3des'],
    ['an empty password and an AES-encrypted key', '', 'aes256']
  ] as const

  for (const [kind, password, algorithm] of PFX_KINDS) {
    it(`reads the app's key and thumbprint from a PFX with ${kind}`, () => {
      const { base64, certificate } = pfx(password, algorithm)
      const { privateKey, thumbprintSha256 } = readCertificate(base64)
      // What Entra ID checks: the thumbprint names the certificate, and the key signs as its own.
      assert.equal(thumbprintSha256, certificate.fingerprint256.replaceAll(':', '').toLowerCase())
      const signature = sign('sha256', Buffer.from('assertion'), createPrivateKey(privateKey))
      assert.ok(verify('sha256', Buffer.from('assertion'), certificate.publicKey, signature))
    })
  }

  it('names the variable that holds no PFX, without its value', () => {
    assert.throws(
      () => readCertificate(Buffer.from('not a certificate').toString('base64')),
      (error: Error) =>
        /CI_CERT_BASE64/.test(error.message) && !/not a certificate/.test(error.message)
    )
  })
})
