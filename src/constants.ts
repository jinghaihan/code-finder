export const VERSION_CONTROL_DIRECTORIES = [
  '.git',
  '.github',
  '.hg',
  '.svn',
]

export const IDE_DIRECTORIES = [
  '.vscode',
  '.cursor',
  '.idea',
]

export const WORKSPACE_FILES = [
  '.gitignore',
  'README.md',
  'LICENSE',
  'LICENSE.md',
]

export const CONFIG_FILES = [
  'package.json',
  'pom.xml',
  'go.mod',
]

export const IGNORE_DIRECTORIES = ['node_modules']

export const CODESPACE_DIRECTORIES = [
  ...VERSION_CONTROL_DIRECTORIES,
  ...IDE_DIRECTORIES,
]

export const CODESPACE_FILES = [
  ...WORKSPACE_FILES,
  ...CONFIG_FILES,
]

export const CODE_NAME_CHOICES = [
  'Code',
  'Code - Insiders',
  'VSCodium',
  'VSCodium - Insiders',
  'Cursor',
  'Windsurf',
] as const

export const EDITOR_NAME_MAP = {
  'vscode': 'Code',
  'vscode-insiders': 'Code - Insiders',
  'vscodium': 'VSCodium',
  'vscodium-insiders': 'VSCodium - Insiders',
  'cursor': 'Cursor',
  'windsurf': 'Windsurf',
} as const

export const CODE_NAME_MAP = Object.fromEntries(Object.entries(EDITOR_NAME_MAP).map(([key, value]) => [value, key]))
