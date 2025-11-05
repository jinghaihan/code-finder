import type { CAC } from 'cac'
import type { CommandOptions, RangeMode } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { executeCommand } from './command'
import { MODE_CHOICES, NAME, VERSION } from './constants'
import { capitalize } from './utils'

try {
  const cli: CAC = cac(NAME)

  cli
    .command('[mode]', 'CLI to detect codespaces and update IDE opened histories')
    .option('--cwd <cwd>', 'The path to be detected')
    .option('--ignore-paths <paths...>', 'Ignore the directories')
    .option('--ide <ide>', 'The IDE to be updated')
    .option('--path', 'Include the path to the histories')
    .option('--tildify', 'Convert and include the path to a tildify path')
    .option('--git-branch', 'The git branch to be detected')
    .option('--source', 'Include the source of the histories')
    .option('--mtime-deep <deep>', 'The deep to get the codespace mtime')
    .option('--mtime-concurrency <concurrency>', 'The concurrency to get the codespace mtime')
    .option('--overwrite', 'Overwrite the existing opened histories')
    .option('--json', 'Output the result in JSON format')
    .option('--yes', 'Skip the confirmation')
    .action(async (mode: RangeMode, options: CommandOptions) => {
      if (mode) {
        if (!MODE_CHOICES.includes(mode)) {
          console.error(`Invalid mode: ${mode}. Please use one of the following: ${MODE_CHOICES.join(', ')}`)
          process.exit(1)
        }
        options.mode = mode
      }

      p.intro(`${c.yellow`${NAME} `}${c.dim`v${VERSION}`}`)
      const { config } = await executeCommand(options)
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
