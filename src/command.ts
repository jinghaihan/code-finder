import type { CommandOptions, EntrySource, HistoryEntry, Options } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import tildify from 'tildify'
import { resolveConfig } from './config'
import { CODE_NAME_CHOICES } from './constants'
import { vscode } from './database/vscode'
import { detectCodespaces } from './detect'
import { outputHistories } from './format'
import { getGitBranch } from './git'
import { ensureSqlite3, normalizePath } from './utils'

export async function executeCommand(options: Partial<CommandOptions>): Promise<{ config: Options, data: HistoryEntry[] }> {
  await ensureSqlite3()

  const config = await resolveConfig(options)
  const entriesRecords = new Map<string, EntrySource[]>()

  const traverse = async (data: HistoryEntry[]) => {
    if (!config.path && !config.tildify && !config.gitBranch && !config.source)
      return

    const spinner = p.spinner()
    spinner.start('Traversing data')

    for (const entry of data) {
      const uri = (entry.folderUri || entry.fileUri)!
      if (config.path || config.tildify)
        entry.path = config.tildify ? tildify(normalizePath(uri)) : normalizePath(uri)

      if (config.gitBranch && entry.folderUri) {
        const branch = await getGitBranch(entry.folderUri)
        if (branch)
          entry.branch = branch
      }

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

  const codespaces = config.cwd ? await detectCodespaces(config.cwd, config.ignorePaths) : []
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
      return { config, data: codespaces }
    }
    case 'detect': {
      codespacesInterceptor()
      await traverse(codespaces)
      outputHistories(codespaces, config.json)
      return { config, data: codespaces }
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
      return { config, data }
    }
  }
}
