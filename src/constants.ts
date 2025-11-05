import pkgJson from '../package.json'

export const NAME = pkgJson.name
export const VERSION = pkgJson.version

export const MODE_CHOICES = ['update', 'detect', 'combine'] as const

export const DEFAULT_OPTIONS = {
  ignorePaths: [],
  path: false,
  mtimeDeep: 1,
  mtimeConcurrency: 30,
  tildify: false,
  gitBranch: false,
  source: false,
  overwrite: true,
  json: false,
  yes: false,
}

export const JSON_MARKER = '<!-- code-finder -->'

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

export const INSTALL_DIRECTORIES = [
  'node_modules',
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

export const LOCK_FILES = [
  'npm-shrinkwrap.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'yarn.lock',
  'deno.lock',
  'bun.lock',
  'bun.lockb',
]

export const IGNORE_DIRECTORIES = ['**/node_modules/**']

export const IGNORE_FILES = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.hg/**',
  '.svn/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.next/**',
  '.nuxt/**',
  '*.log',
  'tmp/**',
  'temp/**',
]

export const CODESPACE_DIRECTORIES = [
  ...VERSION_CONTROL_DIRECTORIES,
  ...IDE_DIRECTORIES,
  ...INSTALL_DIRECTORIES,
]

export const CODESPACE_FILES = [
  ...WORKSPACE_FILES,
  ...CONFIG_FILES,
  ...LOCK_FILES,
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
  'Code': 'Visual Studio Code',
  'Code - Insiders': 'Visual Studio Code - Insiders',
  'VSCodium': 'VSCodium',
  'VSCodium - Insiders': 'VSCodium - Insiders',
  'Cursor': 'Cursor',
  'Windsurf': 'Windsurf',
} as const
