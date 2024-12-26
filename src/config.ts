import multer from 'multer'

export const multerStorage = multer.memoryStorage()

export const hostDomainName = process.env.HOST_DOMAIN_NAME as string
export const port = process.env.PORT as string
export const googleOAuthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID as string
export const googleOAuthClientSecret = process.env
  .GOOGLE_OAUTH_CLIENT_SECRET as string
export const nodeEnv = process.env.NODE_ENV as string
export const dbHost = process.env.DB_HOST as string
export const dbName = process.env.DB_DATABASE as string
export const dbUser = process.env.DB_USER as string
export const dbPass = process.env.DB_PASS as string
export const dbPort = process.env.DB_PORT as string
export const dbUrl = process.env.DB_URL as string
export const jwtSecretKet = process.env.JWT_SECRET_KEY as string
export const multerUpload = multer({ storage: multerStorage })
export const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY as string
export const cloudinarySecretKey = process.env.CLOUDINARY_SECRET_KEY as string
export const nodemailerUser = process.env.NODEMAILER_USER as string
export const nodemailerPass = process.env.NODEMAILER_PASS as string
export const frontendBaseUrl1 = process.env.FRONTEND_BASE_URL_1 as string
export const frontendBaseUrl2 = process.env.FRONTEND_BASE_URL_2 as string
