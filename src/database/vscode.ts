import type { Database } from 'better-sqlite3'
import type { CodeName, History, HistoryEntry } from '../types'
import { existsSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { join } from 'pathe'
import { CODE_NAME_MAP } from '../constants'
import { hasSqlite3 } from '../env'
import { execFileAsync } from '../utils'

const READ_SQL = 'SELECT value FROM ItemTable WHERE key = \'history.recentlyOpenedPathsList\''

const WRITE_SQL = 'INSERT OR REPLACE INTO ItemTable (key, value) VALUES (\'history.recentlyOpenedPathsList\', ?)'

function detectDatabasePaths(codeName: string, path: string) {
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

async function detectDatabase(codeName: string): Promise<string | undefined> {
  const paths = detectDatabasePaths(codeName, join('globalStorage', 'state.vscdb'))
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

async function readDatabase(codeName: CodeName) {
  const dbPath = await detectDatabase(codeName)
  if (!dbPath)
    return

  const ideName = CODE_NAME_MAP[codeName]

  const spinner = p.spinner()
  spinner.start(`Reading ${ideName} history`)

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
    spinner.stop(c.red`Failed to read ${ideName} history`)
  }
  finally {
    db?.close()
    spinner.stop(c.green`Read ${ideName} history`)
  }
}

async function writeDatabase(codeName: CodeName, data: History) {
  const dbPath = await detectDatabase(codeName)
  if (!dbPath)
    return

  const ideName = CODE_NAME_MAP[codeName]

  const spinner = p.spinner()
  spinner.start(`Updating ${ideName} history`)

  let db: Database | null = null
  try {
    if (await hasSqlite3()) {
      const history = JSON.stringify(data)
      const sql = `${WRITE_SQL.replace('?', `'${history.replace(/'/g, '\'\'')}'`)}`
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
    spinner.stop(c.red`Failed to update ${ideName} history`)
  }
  finally {
    db?.close()
    spinner.stop(c.green`Updated ${ideName} history`)
  }
}

export async function updateVSCodeHistories(codeName: CodeName, entries: HistoryEntry[], overwrite: boolean = true) {
  const data: History = { entries }
  if (overwrite) {
    await writeDatabase(codeName, data)
    return
  }

  const histories = await readDatabase(codeName)
  if (!histories) {
    await writeDatabase(codeName, data)
    return
  }

  const uri = new Set<string>()
  await writeDatabase(codeName, {
    entries: [...(histories?.entries ?? []), ...(data.entries ?? [])].filter((entry) => {
      if (entry.folderUri) {
        if (!existsSync(entry.folderUri))
          return false

        if (!uri.has(entry.folderUri))
          uri.add(entry.folderUri)
        else
          return false
      }
      if (entry.fileUri) {
        if (!existsSync(entry.fileUri))
          return false
        else
          return true
      }
      return true
    }),
  })
}
