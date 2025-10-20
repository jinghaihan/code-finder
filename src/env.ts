import { execFileAsync } from './utils'

export async function hasSqlite3(): Promise<boolean> {
  try {
    await execFileAsync('sqlite3', ['--version'])
    return true
  }
  catch {
    return false
  }
}
