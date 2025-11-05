import type { DetectOptions, HistoryEntry } from './types'
import { existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import pLimit from 'p-limit'
import { basename, join } from 'pathe'
import { CODESPACE_DIRECTORIES, CODESPACE_FILES, DEFAULT_OPTIONS, IGNORE_DIRECTORIES, IGNORE_FILES } from './constants'
import { sortByMtime } from './utils'

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

export async function getCodespaceMtime(cwd: string, mtimeDeep: number = DEFAULT_OPTIONS.mtimeDeep, concurrency: number = DEFAULT_OPTIONS.mtimeConcurrency): Promise<number> {
  const dirStrategy = async () => {
    const stats = await stat(cwd)
    return stats.mtime.getTime()
  }

  const fileStrategy = async (): Promise<number> => {
    const { glob } = await import('tinyglobby')
    const files = await glob('*', {
      cwd,
      dot: true,
      absolute: true,
      onlyFiles: false,
      deep: mtimeDeep,
      ignore: [
        ...IGNORE_FILES,
        ...IGNORE_DIRECTORIES,
      ],
    })
    if (!files.length)
      return await dirStrategy()

    const limit = pLimit(concurrency)
    const results = await Promise.all(files.map(file => limit(() => stat(file))))
    return Math.max(...results.map(result => result.mtime.getTime()))
  }

  if (mtimeDeep === 0 || Number.isNaN(mtimeDeep)) {
    try {
      return await dirStrategy()
    }
    catch {
      return 0
    }
  }

  try {
    return await fileStrategy()
  }
  catch {
    try {
      return await dirStrategy()
    }
    catch {
      return 0
    }
  }
}

export async function detectCodespaces(options: DetectOptions): Promise<HistoryEntry[]> {
  const { cwd, ignorePaths, mtimeDeep, mtimeConcurrency } = options
  const entries: HistoryEntry[] = []

  const res = await isCodespace(cwd, ignorePaths)
  if (typeof res === 'boolean') {
    const fileURL = pathToFileURL(cwd)
    const mtime = await getCodespaceMtime(cwd, mtimeDeep, mtimeConcurrency)
    entries.push({
      folderUri: fileURL.href.replace(/\/$/, ''),
      mtime,
    })
    return entries
  }

  for (const dir of res) {
    const space = await detectCodespaces({ ...options, cwd: dir })
    entries.push(...space)
  }

  return sortByMtime(entries)
}
