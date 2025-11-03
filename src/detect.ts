import type { HistoryEntry } from './types'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { basename, join } from 'pathe'
import { CODESPACE_DIRECTORIES, CODESPACE_FILES, IGNORE_DIRECTORIES } from './constants'

async function readDirs(path: string, ignorePaths: string[]) {
  const { glob } = await import('tinyglobby')
  return await glob('*/', {
    cwd: path,
    dot: true,
    onlyDirectories: true,
    absolute: true,
    ignore: [
      ...IGNORE_DIRECTORIES,
      ...ignorePaths,
    ],
  })
}

export async function isCodespace(path: string, ignorePaths: string[]): Promise<boolean | string[]> {
  const dirs = await readDirs(path, ignorePaths)
  const cleanDirs = dirs.map(dir => basename(dir))

  const hasDir = CODESPACE_DIRECTORIES.find(dir => cleanDirs.includes(dir))
  if (hasDir)
    return true

  const hasFile = CODESPACE_FILES.find(file => existsSync(join(path, file)))
  if (hasFile)
    return true

  return dirs
}

export async function detectCodespaces(path: string, ignorePaths: string[] = []): Promise<HistoryEntry[]> {
  const entries: HistoryEntry[] = []

  const res = await isCodespace(path, ignorePaths)
  if (typeof res === 'boolean') {
    const fileURL = pathToFileURL(path)
    entries.push({
      folderUri: fileURL.href.replace(/\/$/, ''),
    })
    return entries
  }

  for (const dir of res) {
    const space = await detectCodespaces(dir, ignorePaths)
    entries.push(...space)
  }

  return entries
}
