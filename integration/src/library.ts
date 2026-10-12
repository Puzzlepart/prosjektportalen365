import './loader.ts'
import './globals.ts'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * A module of the shared library's CommonJS build, the build its Jest tests run, with the type its
 * declaration in `lib` gives it. The loader and the globals are in place before the first one loads.
 *
 * @param path The module's path under `lib-commonjs`, such as `services/PortalDataService/index.js`
 */
export function library<T>(path: string): T {
  return require(`pp365-shared-library/lib-commonjs/${path}`) as T
}

/** The data services, and the seam that connects them (`setSpfiFactory`). */
export const portalDataService = () =>
  library<typeof import('pp365-shared-library/lib/services/PortalDataService/index.js')>(
    'services/PortalDataService/index.js'
  )

export const projectDataService = () =>
  library<typeof import('pp365-shared-library/lib/services/ProjectDataService/index.js')>(
    'services/ProjectDataService/index.js'
  )

export const createSpfiInstance = () =>
  library<typeof import('pp365-shared-library/lib/data/createSpfiInstance.js')>(
    'data/createSpfiInstance.js'
  )

export const termStore = () =>
  library<typeof import('pp365-shared-library/lib/taxonomy/index.js')>('taxonomy/index.js')
