import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

/**
 * Parses a JWT token and extracts specified fields from the token payload.
 * @param token - The JWT token to parse.
 * @param fields - An array of fields to extract from the token payload.
 * @param newFields - An array of new field names to assign to the extracted fields.
 * @returns An object containing the extracted fields as key-value pairs.
 */
export function parseJwtToken(
  token: string,
  fields: Array<string>,
  newFields: Array<string>
): { [key: string]: string } {
  const tokenPayload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString()
  )

  const result: { [key: string]: string } = {}
  fields.forEach((field, index) => {
    if (tokenPayload.hasOwnProperty(field)) {
      result[newFields[index]] = tokenPayload[field]
    }
  })
  return result
}

/**
 * Converts a JavaScript regular expression to a MySQL regular expression.
 *
 * @param jsRegExp - The JavaScript regular expression to convert.
 * @returns The MySQL regular expression.
 */
export function convertToMySQLRegExp(jsRegExp: RegExp): string {
  // Escape special characters
  const escapedPattern = jsRegExp.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Modify flags for MySQL syntax
  const flags = jsRegExp.flags.includes('i') ? 'i' : ''

  return `(?${flags}:${escapedPattern})`
}

/**
 * Converts a time value from one unit to another.
 *
 * @param value - The value to be converted.
 * @param fromUnit - The unit of the value to be converted from.
 * @param toUnit - The unit to convert the value to.
 * @returns The converted value.
 * @throws Error if the provided time units are invalid.
 */
export function convertTime(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const timeUnits: { [key: string]: number } = {
    ms: 1,
    s: 1000,
    min: 60000,
    hr: 3600000,
    d: 86400000,
  }
  if (
    !timeUnits.hasOwnProperty(fromUnit) ||
    !timeUnits.hasOwnProperty(toUnit)
  ) {
    throw new Error('Invalid time unit')
  }

  const conversionFactor = timeUnits[fromUnit] / timeUnits[toUnit]
  const convertedValue = value * conversionFactor

  return convertedValue
}

export function inputDateToDate(inputDate: string): Date {
  const parts = inputDate.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])

  return new Date(year, month, day)
}

export async function processChunks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const chunkIndex = parseInt(req.body?.currentChunk, 10)
  const totalChunks = parseInt(req.body?.totalChunks, 10)
  const filename = req.body?.filename
  if (req.file === undefined) {
    throw new Error('No file uploaded')
  }
  const uploadDir = path.join(process.cwd(), 'uploads', res.locals.selfId)
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  fs.writeFileSync(
    path.join(
      process.cwd(),
      'uploads',
      res.locals.selfId,
      `-chunk${chunkIndex}-${totalChunks}.part`
    ),
    req.file.buffer,
    { flag: 'w' }
  )

  // Check if this is the last chunk and start reassembling the file
  if (chunkIndex === totalChunks) {
    const chunks = []
    try {
      // Read all chunks and concatenate them to form the full image
      for (let i = 1; i <= totalChunks; i++) {
        const chunkPath = path.join(
          process.cwd(),
          'uploads',
          res.locals.selfId,
          `-chunk${i}-${totalChunks}.part`
        )
        chunks.push(fs.promises.readFile(chunkPath))
      }
      const resolvedChunks = await Promise.all(chunks)

      const concatBuffer = Buffer.concat(resolvedChunks)
      next(concatBuffer)
    } catch (err) {
      throw new Error('Error processing chunks')
    } finally {
      // Clean up and delete the chunks
      for (let i = 1; i <= totalChunks; i++) {
        const chunkPath = path.join(
          process.cwd(),
          'uploads',
          res.locals.selfId,
          `-chunk${i}-${totalChunks}.part`
        )

        if (fs.existsSync(chunkPath)) {
          fs.unlink(chunkPath, err => {
            if (err) {
              console.log(err)
            } else {
              console.log(`Deleted chunk ${i}`)
            }
          })
        } else {
          console.log(`Chunk ${i} does not exist`)
        }
      }
      return
    }
  }

  res.json({ message: 'Chunk received' })
}
