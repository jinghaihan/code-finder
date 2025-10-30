import type { CAC } from 'cac'
import type { CommandOptions, HistoryEntry, RangeMode } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { resolveConfig } from './config'
import { CODE_NAME_CHOICES, MODE_CHOICES, NAME, VERSION } from './constants'
import { vscode } from './database/vscode'
import { detectCodespaces } from './detect'
import { outputHistories } from './format'
import { capitalize, ensureSqlite3 } from './utils'

try {
  const cli: CAC = cac(NAME)

  cli
    .command('[mode]', 'CLI to detect codespaces and update IDE opened histories')
    .option('--path <path>', 'The path to be detected')
    .option('--ide <ide>', 'The IDE to be updated')
    .option('--ignore-paths <paths...>', 'Ignore the directories')
    .option('--git-branch', 'The git branch to be detected')
    .option('--overwrite', 'Overwrite the existing opened histories')
    .option('--json', 'Output the result in JSON format')
    .action(async (mode: RangeMode, options: CommandOptions) => {
      if (mode) {
        if (!MODE_CHOICES.includes(mode)) {
          console.error(`Invalid mode: ${mode}. Please use one of the following: ${MODE_CHOICES.join(', ')}`)
          process.exit(1)
        }
        options.mode = mode
      }

      p.intro(`${c.yellow`${NAME} `}${c.dim`v${VERSION}`}`)
      await ensureSqlite3()
      const config = resolveConfig(options)

      const codespaces = config.path ? await detectCodespaces(config.path, config.ignorePaths) : []
      const interceptor = () => {
        if (!codespaces.length) {
          p.outro(c.yellow`No codespaces found`)
          process.exit(0)
        }
      }

      switch (config.mode) {
        case 'update':{
          interceptor()
          for (const ide of config.ide) {
            if (CODE_NAME_CHOICES.includes(ide))
              await vscode.update(ide, codespaces, config.overwrite)
          }
          break
        }
        case 'detect': {
          interceptor()
          outputHistories(codespaces, config.json)
          break
        }
        case 'combine': {
          const entries: HistoryEntry[][] = [codespaces]
          for (const ide of config.ide) {
            if (CODE_NAME_CHOICES.includes(ide)) {
              const data = await vscode.read(ide)
              if (data)
                entries.push(data.entries)
            }
          }
          outputHistories(vscode.uniq(entries), config.json)
          break
        }
      }

      p.outro(c.green`${capitalize(config.mode)} command completed`)
    })

  cli.help()
  cli.version(VERSION)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}
