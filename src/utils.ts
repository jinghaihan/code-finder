import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import * as p from '@clack/prompts'
import c from 'ansis'
import { isPackageExists } from 'local-pkg'

export const execFileAsync = promisify(execFile)

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function normalizePath(path: string) {
  if (path.startsWith('file://')) {
    try {
      return fileURLToPath(path)
    }
    catch {
      return path
    }
  }
  return path
}

export async function hasSqlite3(): Promise<boolean> {
  try {
    await execFileAsync('sqlite3', ['--version'])
    return true
  }
  catch {
    return false
  }
}

export async function ensureSqlite3() {
  if (!await hasSqlite3()) {
    if (!isPackageExists('better-sqlite3')) {
      const spinner = p.spinner()
      spinner.start('Installing better-sqlite3')

      const { installPackage } = await import('@antfu/install-pkg')
      await installPackage('better-sqlite3', { silent: true })

      spinner.stop(c.green`Installed better-sqlite3`)
    }
  }
}
