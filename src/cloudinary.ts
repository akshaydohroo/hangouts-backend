import { v2 as cloudinary } from 'cloudinary'
import { cloudinaryApiKey, cloudinarySecretKey } from './config'

cloudinary.config({
  secure: true,
  api_key: cloudinaryApiKey,
  api_secret: cloudinarySecretKey,
  cloud_name: 'dwqbnh9jj',
})
export default cloudinary
