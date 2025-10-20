import { IGNORE_DIRECTORIES } from './constants'

export function filterDirectories(dirs: string[]) {
  return dirs.filter(dir => !IGNORE_DIRECTORIES.includes(dir))
}
