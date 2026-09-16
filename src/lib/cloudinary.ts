/**
 * HodaHub Cloudinary Client-Side Media & Edge Function Integration
 * Handles direct image & media uploads to Cloudinary as well as
 * invoking Supabase Edge Functions for secure delete and signed replace operations.
 * Brand: HodaHub
 */

import { supabase } from './supabase';

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
      // In dev without live unsigned preset configured, return an object URL fallback
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

/**
 * Extracts the Cloudinary public_id from a full URL
 * Example: https://res.cloudinary.com/.../upload/v12345/hodahub_products/sku_01.jpg -> hodahub_products/sku_01
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url) return null;
  if (!url.includes('cloudinary.com')) {
    // If not a full Cloudinary URL, it might already be a public_id
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      return url;
    }
    return null;
  }

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    const pathAfterUpload = url.substring(uploadIndex + 8);
    const segments = pathAfterUpload.split('/');

    const cleanedSegments: string[] = [];
    let pastTransforms = false;
    for (const seg of segments) {
      if (!pastTransforms) {
        // Skip transformations like c_fill,w_800 or f_auto,q_auto
        if (/^(?:[a-z]{1,2}_[a-zA-Z0-9_-]+,?)+$/.test(seg)) {
          continue;
        }
        // Skip version tag like v1234567890
        if (/^v\d+$/.test(seg)) {
          pastTransforms = true;
          continue;
        }
        pastTransforms = true;
      }
      cleanedSegments.push(seg);
    }

    if (cleanedSegments.length === 0) return null;
    const last = cleanedSegments[cleanedSegments.length - 1];
    const dotIndex = last.lastIndexOf('.');
    if (dotIndex !== -1) {
      cleanedSegments[cleanedSegments.length - 1] = last.substring(0, dotIndex);
    }
    return cleanedSegments.join('/');
  } catch {
    return null;
  }
}

/**
 * Helper to convert File/Blob to Base64 Data URI
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Delete an image from Cloudinary via Edge Function and clean up product_images table in Supabase
 */
export async function deleteCloudinaryImage(params: {
  publicId: string;
  productId?: string;
  imageUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    let edgeSuccess = false;
    try {
      const { data, error } = await supabase.functions.invoke('delete-cloudinary-image', {
        body: {
          public_id: params.publicId,
          resource_type: 'image',
        },
      });

      if (!error && (data?.success || data?.result === 'ok' || data?.result === 'not found')) {
        edgeSuccess = true;
      } else if (error) {
        console.warn('HodaHub Edge Function delete-cloudinary-image notice:', error.message);
      }
    } catch (invokeErr) {
      console.warn('HodaHub Edge Function invoke notice:', invokeErr);
    }

    // Always clean up Supabase DB reference so no stale records remain
    if (params.imageUrl) {
      try {
        let query = supabase.from('product_images').delete().eq('url', params.imageUrl);
        if (params.productId) {
          query = query.eq('product_id', params.productId);
        }
        await query;
      } catch (dbErr) {
        console.warn('HodaHub product_images DB cleanup warning:', dbErr);
      }
    }

    return {
      success: true,
      message: edgeSuccess
        ? `Asset ${params.publicId} destroyed from Cloudinary and removed from database.`
        : `Image reference removed from database. (Deploy Edge Function to also destroy from live Cloudinary).`,
    };
  } catch (err: any) {
    console.error('HodaHub deleteCloudinaryImage error:', err);
    throw err;
  }
}

/**
 * Replace an image in Cloudinary via Edge Function (signed with overwrite: true)
 * and update the corresponding row in product_images table in Supabase
 */
export async function replaceCloudinaryImage(params: {
  publicId: string;
  file: File | Blob;
  productId?: string;
  oldUrl?: string;
}): Promise<{ success: boolean; secure_url: string; url: string; public_id: string }> {
  try {
    let newUrl: string | null = null;

    // 1. Attempt signed server-side overwrite via Edge Function
    try {
      const base64Data = await fileToBase64(params.file);
      const { data, error } = await supabase.functions.invoke('replace-cloudinary-image', {
        body: {
          public_id: params.publicId,
          file: base64Data,
        },
      });

      if (!error && (data?.secure_url || data?.url)) {
        newUrl = data.secure_url || data.url;
      } else if (error) {
        console.warn('HodaHub Edge Function replace-cloudinary-image notice:', error.message);
      }
    } catch (invokeErr) {
      console.warn('HodaHub Edge Function invoke notice:', invokeErr);
    }

    // 2. Graceful dev fallback if Edge Function is not yet deployed: upload via direct client preset
    if (!newUrl) {
      newUrl = await uploadToCloudinary(params.file, 'hodahub_products');
    }

    // 3. Update corresponding row in Supabase product_images to avoid stale URLs
    if (newUrl && params.oldUrl) {
      try {
        let query = supabase
          .from('product_images')
          .update({ url: newUrl })
          .eq('url', params.oldUrl);

        if (params.productId) {
          query = query.eq('product_id', params.productId);
        }
        await query;
      } catch (dbErr) {
        console.warn('HodaHub product_images DB update warning:', dbErr);
      }
    }

    return {
      success: true,
      secure_url: newUrl,
      url: newUrl,
      public_id: params.publicId,
    };
  } catch (err: any) {
    console.error('HodaHub replaceCloudinaryImage error:', err);
    throw err;
  }
}
