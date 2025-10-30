import type { CODE_NAME_CHOICES, EDITOR_NAME_MAP, MODE_CHOICES } from './constants'

export type RangeMode = (typeof MODE_CHOICES)[number]

export type CodeName = (typeof CODE_NAME_CHOICES)[number]

export type EditorName = keyof typeof EDITOR_NAME_MAP

export interface CommandOptions {
  mode?: RangeMode
  path?: string
  ignorePaths?: string | string[]
  ide?: CodeName[]
  source?: boolean
  tilde?: boolean
  gitBranch?: boolean
  overwrite?: boolean
  json?: boolean
}

export interface Options extends Required<Omit<CommandOptions, 'ignorePaths'>> {
  ignorePaths: string[]
}

export interface History {
  entries: HistoryEntry[]
}

export interface HistoryEntry {
  folderUri?: string
  fileUri?: string
  path?: string
  source?: EntrySource[]
  branch?: string
}

export type EntrySource = CodeName | 'Codespace'
