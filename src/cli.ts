import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { isPackageExists } from 'local-pkg'
import pkgJson from '../package.json'
import { resolveConfig } from './config'
import { CODE_NAME_CHOICES } from './constants'
import { updateVSCodeHistory } from './database/vscode'
import { hasSqlite3 } from './env'
import { detectCodespace } from './io'

try {
  const cli: CAC = cac(pkgJson.name)

  cli
    .command('', 'CLI to detect codespaces and update IDE opened histories')
    .option('--path <path>', 'The path to be detected')
    .option('--ide <ide>', 'The IDE to be updated')
    .option('--overwrite', 'Overwrite the existing opened histories')
    .option('--ignore-paths <paths...>', 'Ignore the directories')
    .action(async (options: CommandOptions) => {
      p.intro(`${c.yellow`${pkgJson.name} `}${c.dim`v${pkgJson.version}`}`)

      if (!await hasSqlite3()) {
        if (!isPackageExists('better-sqlite3')) {
          const spinner = p.spinner()
          spinner.start('Installing better-sqlite3')

          const { installPackage } = await import('@antfu/install-pkg')
          await installPackage('better-sqlite3', { silent: true })

          spinner.stop(c.green`Installed better-sqlite3`)
        }
      }

      const config = resolveConfig(options)
      const codespace = await detectCodespace(config.path, config.ignorePaths)
      for (const ide of config.ide) {
        if (CODE_NAME_CHOICES.includes(ide)) {
          await updateVSCodeHistory(ide, codespace, config.overwrite)
        }
      }
    })

  cli.help()
  cli.version(pkgJson.version)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}
