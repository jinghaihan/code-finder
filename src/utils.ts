import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import * as p from '@clack/prompts'
import c from 'ansis'
import { isPackageExists } from 'local-pkg'

export const execFileAsync = promisify(execFile)

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
