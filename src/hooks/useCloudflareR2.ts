import { useState, useCallback, useMemo } from 'react';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
  isConfigured: boolean;
}

export interface R2UploadResult {
  key: string;
  publicUrl: string;
  presignedUrl?: string;
  uploadedAt: string;
}

export interface UseCloudflareR2Return {
  isConfigured: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  config: {
    accountId: string;
    bucketName: string;
    publicDomain: string;
    hasCredentials: boolean;
  };
  getPresignedUploadUrl: (
    filename: string,
    contentType: string,
    expiresInSeconds?: number
  ) => Promise<{ presignedUrl: string; key: string; publicUrl: string }>;
  uploadFile: (file: File | Blob, customFilename?: string) => Promise<R2UploadResult>;
  getPresignedDownloadUrl: (key: string, expiresInSeconds?: number) => Promise<string>;
  resetError: () => void;
}

const getR2Config = (): R2Config => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  const proc = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;

  const accountId =
    metaEnv.VITE_CLOUDFLARE_ACCOUNT_ID ||
    metaEnv.CLOUDFLARE_ACCOUNT_ID ||
    proc.VITE_CLOUDFLARE_ACCOUNT_ID ||
    proc.CLOUDFLARE_ACCOUNT_ID ||
    '';

  const accessKeyId =
    metaEnv.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID ||
    metaEnv.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    proc.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID ||
    proc.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    '';

  const secretAccessKey =
    metaEnv.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    metaEnv.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    proc.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    proc.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    '';

  const bucketName =
    metaEnv.VITE_CLOUDFLARE_R2_BUCKET_NAME ||
    metaEnv.CLOUDFLARE_R2_BUCKET_NAME ||
    proc.VITE_CLOUDFLARE_R2_BUCKET_NAME ||
    proc.CLOUDFLARE_R2_BUCKET_NAME ||
    '';

  const publicDomain =
    metaEnv.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN ||
    metaEnv.CLOUDFLARE_R2_PUBLIC_DOMAIN ||
    proc.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN ||
    proc.CLOUDFLARE_R2_PUBLIC_DOMAIN ||
    '';

  const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey && bucketName);

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain,
    isConfigured,
  };
};

export const useCloudflareR2 = (): UseCloudflareR2Return => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const r2Config = useMemo(() => getR2Config(), []);

  // S3 Client memoized
  const s3Client = useMemo(() => {
    if (!r2Config.isConfigured) return null;

    try {
      return new S3Client({
        region: 'auto',
        endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2Config.accessKeyId,
          secretAccessKey: r2Config.secretAccessKey,
        },
      });
    } catch (err) {
      console.error('Gagal menginisialisasi Cloudflare R2 S3 Client:', err);
      return null;
    }
  }, [r2Config]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Generates S3 pre-signed URL for PUT upload
   */
  const getPresignedUploadUrl = useCallback(
    async (filename: string, contentType: string, expiresInSeconds = 3600) => {
      resetError();

      if (!r2Config.isConfigured || !s3Client) {
        // Fallback for preview mode when credentials are not configured yet
        const timestamp = Date.now();
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `uploads/${timestamp}-${safeName}`;
        const mockDomain = r2Config.publicDomain || 'https://pub-r2.cloudflare.dev';
        const publicUrl = `${mockDomain.replace(/\/$/, '')}/${key}`;

        return {
          presignedUrl: `https://mock-r2-upload.local/${key}?expires=${expiresInSeconds}`,
          key,
          publicUrl,
        };
      }

      try {
        const timestamp = Date.now();
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `uploads/${timestamp}-${safeName}`;

        const command = new PutObjectCommand({
          Bucket: r2Config.bucketName,
          Key: key,
          ContentType: contentType,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

        const baseDomain = r2Config.publicDomain
          ? r2Config.publicDomain.replace(/\/$/, '')
          : `https://${r2Config.bucketName}.${r2Config.accountId}.r2.cloudflarestorage.com`;

        const publicUrl = `${baseDomain}/${key}`;

        return { presignedUrl, key, publicUrl };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal membuat pre-signed upload URL';
        setError(msg);
        throw new Error(msg);
      }
    },
    [r2Config, s3Client, resetError]
  );

  /**
   * Directly uploads a file using pre-signed URL or client PUT request
   */
  const uploadFile = useCallback(
    async (file: File | Blob, customFilename?: string): Promise<R2UploadResult> => {
      setIsUploading(true);
      setProgress(10);
      resetError();

      const filename = customFilename || (file instanceof File ? file.name : `file-${Date.now()}.png`);
      const contentType = file.type || 'application/octet-stream';

      try {
        const { presignedUrl, key, publicUrl } = await getPresignedUploadUrl(filename, contentType);
        setProgress(40);

        if (r2Config.isConfigured && !presignedUrl.includes('mock-r2-upload')) {
          // Upload directly to Cloudflare R2 bucket via pre-signed URL
          const response = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType,
            },
            body: file,
          });

          if (!response.ok) {
            throw new Error(`Upload R2 gagal dengan status HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          // Simulation / Local Object URL mode when R2 credentials aren't set in preview
          console.warn('Cloudflare R2 belum dikonfigurasi di .env. Menggunakan preview Object URL.');
          await new Promise((res) => setTimeout(res, 500));
        }

        setProgress(100);

        // If file is Blob/File and in preview fallback mode, return object URL or data URL if needed
        let finalPublicUrl = publicUrl;
        if (!r2Config.isConfigured && file instanceof Blob) {
          finalPublicUrl = URL.createObjectURL(file);
        }

        return {
          key,
          publicUrl: finalPublicUrl,
          presignedUrl,
          uploadedAt: new Date().toISOString(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload file ke Cloudflare R2 gagal';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [getPresignedUploadUrl, r2Config, resetError]
  );

  /**
   * Generates pre-signed GET URL for downloading/viewing private objects
   */
  const getPresignedDownloadUrl = useCallback(
    async (key: string, expiresInSeconds = 3600): Promise<string> => {
      if (!r2Config.isConfigured || !s3Client) {
        return key.startsWith('http') ? key : `https://pub-r2.cloudflare.dev/${key}`;
      }

      try {
        const command = new GetObjectCommand({
          Bucket: r2Config.bucketName,
          Key: key,
        });

        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      } catch (err) {
        console.error('Gagal membuat pre-signed download URL:', err);
        return key;
      }
    },
    [r2Config, s3Client]
  );

  return {
    isConfigured: r2Config.isConfigured,
    isUploading,
    progress,
    error,
    config: {
      accountId: r2Config.accountId,
      bucketName: r2Config.bucketName,
      publicDomain: r2Config.publicDomain,
      hasCredentials: r2Config.isConfigured,
    },
    getPresignedUploadUrl,
    uploadFile,
    getPresignedDownloadUrl,
    resetError,
  };
};
