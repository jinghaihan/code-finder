import type { HistoryEntry } from './types'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join } from 'pathe'
import { glob } from 'tinyglobby'
import { CODESPACE_DIRECTORIES, CODESPACE_FILES } from './constants'

export async function readDirectories(path: string) {
  return await glob('*/', { cwd: path, onlyDirectories: true, absolute: true })
}

export async function isCodeDir(path: string): Promise<boolean | string[]> {
  const dirs = await readDirectories(path)

  const hasDir = CODESPACE_DIRECTORIES.find(dir => dirs.includes(dir))
  if (hasDir)
    return true

  const hasFile = CODESPACE_FILES.find(file => existsSync(join(path, file)))
  if (hasFile)
    return true

  return dirs
}

export async function detectCodespace(path: string): Promise<HistoryEntry[]> {
  const entries: HistoryEntry[] = []

  const res = await isCodeDir(path)
  if (typeof res === 'boolean') {
    const fileURL = pathToFileURL(path)
    entries.push({
      folderUri: fileURL.href.replace(/\/$/, ''),
    })
    return entries
  }

  for (const dir of res) {
    const space = await detectCodespace(dir)
    entries.push(...space)
  }

  return entries
}
