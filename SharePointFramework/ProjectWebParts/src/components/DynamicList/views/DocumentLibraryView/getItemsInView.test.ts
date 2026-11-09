// The function logs in debug builds; SPFx's build replaces DEBUG, under Jest it is a plain global.
;(globalThis as any).DEBUG = false

import { DocumentLibraryViewMode } from '../../types'
import { getItemsInView } from './getItemsInView'

/**
 * Which of a library's items the document library view shows: by folder, or every file flat, in
 * name order with numbers in their order.
 */
const ROOT = '/sites/alfa/Delte dokumenter'
const file = (name: string, folder = ROOT) => ({
  FileLeafRef: name,
  FileDirRef: folder,
  FSObjType: 0
})
const folder = (name: string, parent = ROOT) => ({
  FileLeafRef: name,
  FileDirRef: parent,
  FSObjType: 1
})

const ITEMS = [
  file('Plan 10.docx'),
  folder('Møter'),
  file('Plan 2.docx'),
  file('Referat.docx', `${ROOT}/Møter`),
  folder('Alfa'),
  file('Budsjett.xlsx', `${ROOT}/Alfa`),
  { FileLeafRef: 'Uten mappe.docx', FSObjType: 0 }
]

const names = (items: Record<string, any>[]) => items.map((item) => item.FileLeafRef)

describe('getItemsInView', () => {
  it("shows the library's root in the folder view, folders and files in name order", () => {
    const items = getItemsInView(ITEMS, { viewMode: DocumentLibraryViewMode.Folders })
    expect(names(items)).toEqual(['Alfa', 'Møter', 'Plan 2.docx', 'Plan 10.docx'])
  })

  it('shows the open folder', () => {
    const items = getItemsInView(ITEMS, {
      viewMode: DocumentLibraryViewMode.Folders,
      currentFolderPath: 'Møter'
    })
    expect(names(items)).toEqual(['Referat.docx'])
  })

  it("shows the project's folder at the root when the web part keeps to it", () => {
    const items = getItemsInView(ITEMS, {
      viewMode: DocumentLibraryViewMode.Folders,
      projectFolderName: 'Alfa'
    })
    expect(names(items)).toEqual(['Budsjett.xlsx'])
  })

  it('shows the files of every folder in the flat view, and no folder', () => {
    const items = getItemsInView(ITEMS, { viewMode: DocumentLibraryViewMode.Flat })
    expect(names(items)).toEqual([
      'Budsjett.xlsx',
      'Plan 2.docx',
      'Plan 10.docx',
      'Referat.docx',
      'Uten mappe.docx'
    ])
  })

  it('leaves the items it is given as they were', () => {
    const source = [file('B.docx'), file('A.docx')]
    getItemsInView(source, { viewMode: DocumentLibraryViewMode.Flat })
    expect(names(source)).toEqual(['B.docx', 'A.docx'])
  })
})
