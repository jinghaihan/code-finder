import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import pkgJson from '../package.json'
import { resolveConfig } from './config'
import { CODE_NAME_CHOICES } from './constants'
import { updateVSCodeHistories } from './database/vscode'
import { detectCodespaces } from './detect'
import { ensureSqlite3 } from './utils'

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
      await ensureSqlite3()

      const config = resolveConfig(options)
      const codespaces = await detectCodespaces(config.path, config.ignorePaths)
      if (!codespaces.length) {
        p.outro(c.yellow`No codespaces found`)
        process.exit(0)
      }

      for (const ide of config.ide) {
        if (CODE_NAME_CHOICES.includes(ide))
          await updateVSCodeHistories(ide, codespaces, config.overwrite)
      }

      p.outro(c.green`Update completed`)
    })

  cli.help()
  cli.version(pkgJson.version)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}
