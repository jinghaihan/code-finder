import type { Database } from 'better-sqlite3'
import type { CodeName, History, HistoryEntry } from '../types'
import { existsSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { join } from 'pathe'
import { EDITOR_NAME_MAP } from '../constants'
import { execFileAsync, hasSqlite3, normalizePath } from '../utils'

const READ_SQL = 'SELECT value FROM ItemTable WHERE key = \'history.recentlyOpenedPathsList\''

const WRITE_SQL = 'INSERT OR REPLACE INTO ItemTable (key, value) VALUES (\'history.recentlyOpenedPathsList\', ?)'

function detectVSCodeDatabasePaths(codeName: string, path: string) {
  switch (platform()) {
    case 'win32':
      return [
        `${process.env.APPDATA}/${codeName}/User/${path}`,
        `${process.env.USERPROFILE}/AppData/Roaming/${codeName}/User/${path}`,
      ]
    case 'darwin':
      return [
        `${process.env.HOME}/Library/Application Support/${codeName}/User/${path}`,
        `${homedir()}/Library/Application Support/${codeName}/User/${path}`,
      ]
    default:
      return [
        `${process.env.HOME}/.config/${codeName}/User/${path}`,
        `${process.env.XDG_CONFIG_HOME || `${homedir()}/.config`}/${codeName}/User/${path}`,
        `${homedir()}/.config/${codeName}/User/${path}`,
      ]
  }
}

async function detectVSCodeDatabase(codeName: string): Promise<string | undefined> {
  const paths = detectVSCodeDatabasePaths(codeName, join('globalStorage', 'state.vscdb'))
  for (const path of paths) {
    try {
      if (existsSync(path)) {
        return path
      }
    }
    catch {
      continue
    }
  }
  return undefined
}

async function readVSCodeDatabase(codeName: CodeName) {
  const dbPath = await detectVSCodeDatabase(codeName)
  if (!dbPath)
    return

  const editor = EDITOR_NAME_MAP[codeName]

  const spinner = p.spinner()
  spinner.start(`Reading ${editor}`)

  let db: Database | null = null
  try {
    if (await hasSqlite3()) {
      const { stdout } = await execFileAsync('sqlite3', [dbPath, READ_SQL])
      const result = stdout.trim()
      if (!result)
        return
      return JSON.parse(result) as History
    }
    else {
      const Sqlite3 = (await import('better-sqlite3')).default
      db = new Sqlite3(dbPath, { readonly: true })
      const result = db.prepare(READ_SQL).get() as { value: string }
      if (!result)
        return
      return JSON.parse(result.value) as History
    }
  }
  catch {
    spinner.stop(c.red`Failed to read ${editor}`)
  }
  finally {
    db?.close()
    spinner.stop(`Read ${editor}`)
  }
}

async function writeVSCodeDatabase(codeName: CodeName, data: History) {
  const dbPath = await detectVSCodeDatabase(codeName)
  if (!dbPath)
    return

  const editor = EDITOR_NAME_MAP[codeName]

  const spinner = p.spinner()
  spinner.start(`Updating ${editor}`)

  let db: Database | null = null
  try {
    if (await hasSqlite3()) {
      const histories = JSON.stringify(data)
      const sql = `${WRITE_SQL.replace('?', `'${histories.replace(/'/g, '\'\'')}'`)}`
      await execFileAsync('sqlite3', [dbPath, sql])
    }
    else {
      const DB = (await import('better-sqlite3')).default
      db = new DB(dbPath)
      const stmt = db.prepare(WRITE_SQL)
      stmt.run(JSON.stringify(data))
    }
  }
  catch {
    spinner.stop(c.red`Failed to update ${editor}`)
  }
  finally {
    db?.close()
    spinner.stop(`Updated ${editor}`)
  }
}

export async function updateVSCodeHistories(codeName: CodeName, entries: HistoryEntry[], overwrite: boolean = true) {
  const data: History = { entries }
  if (overwrite) {
    await writeVSCodeDatabase(codeName, data)
    return
  }
  const mergedEntries = await mergeVSCodeHistories(codeName, entries)
  await writeVSCodeDatabase(codeName, { entries: mergedEntries })
}

export async function mergeVSCodeHistories(codeName: CodeName, entries: HistoryEntry[]): Promise<HistoryEntry[]> {
  const data: History = { entries }
  const histories = await readVSCodeDatabase(codeName)
  if (!histories) {
    await writeVSCodeDatabase(codeName, data)
    return entries
  }
  return uniqVSCodeHistories([histories?.entries ?? [], data.entries ?? []])
}

export function uniqVSCodeHistories(data: HistoryEntry[][]): HistoryEntry[] {
  const uri = new Set<string>()
  return data.flat().filter((entry) => {
    if (entry.folderUri) {
      if (!existsSync(normalizePath(entry.folderUri)))
        return false

      if (!uri.has(entry.folderUri)) {
        uri.add(entry.folderUri)
        return true
      }
      else {
        return false
      }
    }
    if (entry.fileUri) {
      if (!existsSync(normalizePath(entry.fileUri)))
        return false

      if (!uri.has(entry.fileUri)) {
        uri.add(entry.fileUri)
        return true
      }
      else {
        return false
      }
    }
    return true
  })
}

export const vscode = {
  read: readVSCodeDatabase,
  write: writeVSCodeDatabase,
  uniq: uniqVSCodeHistories,
  merge: mergeVSCodeHistories,
  update: updateVSCodeHistories,
} as const
