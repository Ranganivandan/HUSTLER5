import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

export const cloudinaryClient = cloudinary;

export async function cloudinaryPing() {
  // Simple no-op call to validate credentials; uses admin.ping if available via API usage
  // Here we try fetching account usage which requires valid credentials
  try {
    const res = await cloudinary.api.usage();
    return res;
  } catch (e) {
    // If not configured or not permitted, throw to let health check surface degraded status
    throw e;
  }
}
