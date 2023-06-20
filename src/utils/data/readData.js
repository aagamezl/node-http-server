import { readFile } from 'node:fs/promises'

/**
 * 
 * @param {string} filename 
 * @param {string} [encoding=utf8]
 * @returns 
 */
export const readData = (filename, encoding = 'utf8') => {
  return readFile(filename, { encoding })
}