import type { CAC } from 'cac'
import type { CommandOptions, EntrySource, HistoryEntry, RangeMode } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import tildify from 'tildify'
import { resolveConfig } from './config'
import { CODE_NAME_CHOICES, MODE_CHOICES, NAME, VERSION } from './constants'
import { vscode } from './database/vscode'
import { detectCodespaces } from './detect'
import { outputHistories } from './format'
import { getGitBranch } from './git'
import { capitalize, ensureSqlite3, normalizePath } from './utils'

try {
  const cli: CAC = cac(NAME)

  cli
    .command('[mode]', 'CLI to detect codespaces and update IDE opened histories')
    .option('--path <path>', 'The path to be detected')
    .option('--ignore-paths <paths...>', 'Ignore the directories')
    .option('--ide <ide>', 'The IDE to be updated')
    .option('--source', 'Include the source of the histories')
    .option('--tilde', 'Convert and include the path to a tilde path')
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
      const entriesRecords = new Map<string, EntrySource[]>()

      const traverse = async (data: HistoryEntry[]) => {
        if (!config.tilde && !config.gitBranch && !config.source)
          return

        const spinner = p.spinner()
        spinner.start('Traversing data')

        for (const entry of data) {
          if (entry.folderUri) {
            const branch = await getGitBranch(entry.folderUri)
            if (branch)
              entry.branch = branch
          }

          const uri = (entry.folderUri || entry.fileUri)!
          if (config.path)
            entry.path = tildify(normalizePath(uri))
          if (config.source)
            entry.source = entriesRecords.get(uri) || []
        }

        spinner.stop('Traversing data completed')
      }

      const recordEntries = (entries: HistoryEntry[], source: EntrySource) => {
        entries.forEach((entry) => {
          const uri = (entry.folderUri || entry.fileUri)!
          if (entriesRecords.has(uri))
            entriesRecords.get(uri)?.push(source)
          else
            entriesRecords.set(uri, [source])
        })
      }

      const codespaces = config.path ? await detectCodespaces(config.path, config.ignorePaths) : []
      recordEntries(codespaces, 'Codespace')

      const codespacesInterceptor = () => {
        if (!codespaces.length) {
          p.outro(c.yellow`No codespaces found`)
          process.exit(0)
        }
      }

      switch (config.mode) {
        case 'update':{
          codespacesInterceptor()
          for (const ide of config.ide) {
            if (CODE_NAME_CHOICES.includes(ide))
              await vscode.update(ide, codespaces, config.overwrite)
          }
          break
        }
        case 'detect': {
          codespacesInterceptor()
          await traverse(codespaces)
          outputHistories(codespaces, config.json)
          break
        }
        case 'combine': {
          const entries: HistoryEntry[][] = [codespaces]

          for (const ide of config.ide) {
            if (CODE_NAME_CHOICES.includes(ide)) {
              const data = await vscode.read(ide)
              if (data) {
                entries.push(data.entries)
                recordEntries(data.entries, ide)
              }
            }
          }

          const data = vscode.uniq(entries)
          await traverse(data)
          outputHistories(data, config.json)
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
