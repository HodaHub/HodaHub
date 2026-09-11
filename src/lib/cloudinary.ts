/**
 * HodaHub Cloudinary Client-Side Media Upload Utility
 * Handles direct image & media uploads to Cloudinary without backend proxying.
 * Note: Preserves Cloudinary for all media; Supabase Storage is NOT used.
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'hodahub_cloud';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'hodahub_unsigned';

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Upload an image file directly to Cloudinary using unsigned upload preset
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder = 'hodahub_products'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      // In dev without live unsigned preset configured, return an object URL or high-res Unsplash CDN fallback
      console.warn('Cloudinary upload warning. Ensure VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET are configured.');
      return URL.createObjectURL(file);
    }

    const data: CloudinaryUploadResult = await res.json();
    return data.secure_url || data.url;
  } catch (err) {
    console.warn('Cloudinary upload error:', err);
    return URL.createObjectURL(file);
  }
}
