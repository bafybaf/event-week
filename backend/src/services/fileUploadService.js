const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

// Check if AWS credentials are available
const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

// Configure AWS S3 (only if credentials are provided)
let s3 = null;
if (useS3) {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
} else {
  console.log('AWS credentials not found. Using local file storage.');
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const galleryDir = path.join(uploadsDir, 'gallery');
  const documentsDir = path.join(uploadsDir, 'documents');
  if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });
  if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure multer for disk storage (büyük dosyalar için daha güvenilir)
// Disk storage kullanıyoruz çünkü memory storage büyük dosyalar için memory limit aşabilir
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Geçici dosyalar için temp klasörü kullan
    const tempPath = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Gallery upload için tüm görsel ve video formatlarına izin ver
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    // Görsel formatları
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'image/heic',
    'image/heif',
    'image/avif',
    // Video formatları
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    // Doküman formatları
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed formats: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF, MP4, WebM, OGG, QuickTime, PDF, Excel`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default (video dosyaları için)
  }
});

class FileUploadService {
  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'event-week-uploads';
  }

  // Upload file to S3 or local storage
  async uploadToS3(file, folder = 'uploads', options = {}, req = null) {
    try {
      console.log('[UPLOAD_TO_S3] Başladı:', {
        folder,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        hasBuffer: !!file.buffer,
        hasPath: !!file.path
      });

      const fileExtension = path.extname(file.originalname);
      const fileName = `${folder}/${uuidv4()}${fileExtension}`;
      
      if (useS3 && s3) {
        console.log('[UPLOAD_TO_S3] S3 kullanılıyor');
        // Use S3 if credentials are available
        const uploadParams = {
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
          ...options
        };

        const result = await s3.upload(uploadParams).promise();
        
        return {
          success: true,
          url: result.Location,
          key: fileName,
          size: file.size,
          mimetype: file.mimetype
        };
      } else {
        // Use local storage
        console.log('[UPLOAD_TO_S3] Local storage kullanılıyor');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const folderPath = path.join(uploadsDir, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        
        const fileNameOnly = path.basename(fileName);
        const filePath = path.join(folderPath, fileNameOnly);
        
        console.log('[UPLOAD_TO_S3] Dosya yazılıyor:', filePath);
        // Write file to disk
        if (file.buffer) {
          console.log('[UPLOAD_TO_S3] Buffer yazılıyor, boyut:', file.buffer.length);
          // Büyük dosyalar için stream kullanarak yazma (video dosyaları için daha güvenilir)
          const bufferStream = Readable.from(file.buffer);
          const writeStream = fs.createWriteStream(filePath);
          
          await pipeline(bufferStream, writeStream);
          console.log('[UPLOAD_TO_S3] Buffer yazıldı');
        } else if (file.path) {
          // Eğer dosya zaten disk'teyse, direkt kopyala
          console.log('[UPLOAD_TO_S3] Dosya kopyalanıyor:', file.path, '->', filePath);
          fs.copyFileSync(file.path, filePath);
          console.log('[UPLOAD_TO_S3] Dosya kopyalandı');
        } else {
          throw new Error('Dosya buffer veya path bulunamadı');
        }
        
        // Return local URL (will be served by Express static middleware)
        // Request'ten host bilgisini al, yoksa environment variable veya localhost kullan
        let baseUrl = process.env.BASE_URL;
        
        if (!baseUrl && req) {
          // Request header'ından host bilgisini al
          const protocol = req.protocol || (req.secure ? 'https' : 'http') || 'http';
          const host = req.get('host') || req.headers.host;
          
          // localhost veya 127.0.0.1 ise, environment variable veya origin header'ı kontrol et
          if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
            // Origin header'ını kontrol et (admin panelden gelen isteklerde)
            const origin = req.get('origin') || req.headers.origin;
            if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
              // Origin'den base URL'i çıkar
              try {
                const originUrl = new URL(origin);
                baseUrl = `${originUrl.protocol}//${originUrl.host}`;
                console.log('[UPLOAD_TO_S3] Base URL origin\'den alındı:', baseUrl);
              } catch (e) {
                console.warn('[UPLOAD_TO_S3] Origin parse hatası:', e);
              }
            }
            
            // Hala baseUrl yoksa, request host'unu kullan ama localhost yerine IP kullanmayı dene
            if (!baseUrl && host) {
              // X-Forwarded-Host veya X-Real-IP header'larını kontrol et
              const forwardedHost = req.get('x-forwarded-host') || req.headers['x-forwarded-host'];
              const realIp = req.get('x-real-ip') || req.headers['x-real-ip'];
              
              if (forwardedHost) {
                baseUrl = `${protocol}://${forwardedHost}`;
                console.log('[UPLOAD_TO_S3] Base URL forwarded-host\'tan alındı:', baseUrl);
              } else {
                // Son çare: localhost kullan ama log'la
                baseUrl = `${protocol}://${host}`;
                console.warn('[UPLOAD_TO_S3] Base URL localhost kullanıldı (mobil cihazlar için sorun olabilir):', baseUrl);
                console.warn('[UPLOAD_TO_S3] Çözüm: BASE_URL environment variable\'ını ayarlayın veya production URL kullanın');
              }
            }
          } else if (host) {
            baseUrl = `${protocol}://${host}`;
            console.log('[UPLOAD_TO_S3] Base URL request\'ten alındı:', baseUrl);
          }
        }
        
        // Fallback: localhost (sadece development için)
        if (!baseUrl) {
          baseUrl = 'http://localhost:3000';
          console.warn('[UPLOAD_TO_S3] Base URL fallback kullanıldı (mobil cihazlar için sorun olabilir):', baseUrl);
        }
        
        // Admin panel (3001) origin/host asla dosya URL'sine yazılmamalı.
        // Göreli yol kaydet: istemci API adresine göre tamamlar.
        const url = `/uploads/${folder}/${fileNameOnly}`;
        
        const fileSize = file.size || fs.statSync(filePath).size;
        console.log('[UPLOAD_TO_S3] Yükleme tamamlandı:', {
          url,
          size: fileSize
        });
        
        return {
          success: true,
          url: url,
          key: fileName,
          size: fileSize,
          mimetype: file.mimetype
        };
      }
    } catch (error) {
      console.error('[UPLOAD_TO_S3] Hata:', error);
      console.error('[UPLOAD_TO_S3] Hata detayları:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      return {
        success: false,
        error: error.message || 'Dosya yükleme hatası'
      };
    }
  }

  // Upload and resize image
  async uploadImage(file, folder = 'images', sizes = {}, req = null) {
    try {
      const results = {};
      const fileExtension = path.extname(file.originalname);
      const baseFileName = uuidv4();

      // Get file buffer (for memory storage) or read from disk (for disk storage)
      let fileBuffer;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        fileBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('File buffer or path not available');
      }

      // Create file object for upload
      const fileForUpload = {
        ...file,
        buffer: fileBuffer,
        originalname: file.originalname
      };

      // Original image
      const originalResult = await this.uploadToS3(fileForUpload, folder, {}, req);
      if (!originalResult.success) {
        return originalResult;
      }
      results.original = originalResult;

      // Generate different sizes if specified
      for (const [sizeName, dimensions] of Object.entries(sizes)) {
        try {
          const resizedBuffer = await sharp(fileBuffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          const resizedFile = {
            buffer: resizedBuffer,
            originalname: `${baseFileName}_${sizeName}.jpg`,
            mimetype: 'image/jpeg',
            size: resizedBuffer.length
          };

          const resizedResult = await this.uploadToS3(resizedFile, folder, {}, req);
          if (resizedResult.success) {
            results[sizeName] = resizedResult;
          }
        } catch (resizeError) {
          console.error(`Error resizing image for ${sizeName}:`, resizeError);
        }
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload profile image with multiple sizes
  async uploadProfileImage(file, req = null) {
    const sizes = {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    return await this.uploadImage(file, 'profiles', sizes, req);
  }

  // Upload event image with multiple sizes
  async uploadEventImage(file, req = null) {
    const sizes = {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 400, height: 300 },
      large: { width: 800, height: 600 }
    };

    return await this.uploadImage(file, 'events', sizes, req);
  }

  // Upload gallery image/video
  async uploadGalleryMedia(file, req = null) {
    try {
      console.log('[FILE_UPLOAD] uploadGalleryMedia başladı:', {
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer,
        hasPath: !!file.path
      });

      // Video dosyaları için direkt uploadToS3 kullan (resize gerekmez)
      if (file.mimetype.startsWith('video/')) {
        console.log('[FILE_UPLOAD] Video dosyası tespit edildi');
        
        // Disk storage kullanıldığı için file.path mevcut olmalı
        // Eğer buffer varsa (memory storage), onu kullan, yoksa path'ten oku
        let fileForUpload = file;
        
        if (file.path && !file.buffer) {
          console.log('[FILE_UPLOAD] Disk\'ten okunuyor:', file.path);
          // Path'ten buffer oluştur (stream kullanarak)
          const fileBuffer = fs.readFileSync(file.path);
          fileForUpload = {
            ...file,
            buffer: fileBuffer,
            originalname: file.originalname || path.basename(file.path)
          };
          console.log('[FILE_UPLOAD] Buffer oluşturuldu, boyut:', fileBuffer.length);
        } else if (!file.buffer) {
          throw new Error('Video dosyası için buffer veya path bulunamadı');
        }
        
        console.log('[FILE_UPLOAD] Video yükleniyor...');
        const result = await this.uploadToS3(fileForUpload, 'gallery', {}, req);
        console.log('[FILE_UPLOAD] Video yükleme sonucu:', {
          success: result.success,
          url: result.url
        });
        
        // Geçici dosyayı sil
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log('[FILE_UPLOAD] Geçici dosya silindi:', file.path);
          } catch (err) {
            console.warn('[FILE_UPLOAD] Geçici dosya silinemedi:', err.message);
          }
        }
        
        return result;
      }
      
      // Görsel dosyalar için resize ile upload
      // Disk storage kullanıldığı için file.path mevcut olmalı
      let fileBuffer;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        fileBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('Görsel dosyası için buffer veya path bulunamadı');
      }

      const fileForUpload = {
        ...file,
        buffer: fileBuffer
      };
      
      // Geçici dosyayı sil
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log('[FILE_UPLOAD] Geçici dosya silindi:', file.path);
        } catch (err) {
          console.warn('[FILE_UPLOAD] Geçici dosya silinemedi:', err.message);
        }
      }

      // Image için resize ile upload
      const sizes = {
        thumbnail: { width: 200, height: 200 },
        medium: { width: 600, height: 400 }
      };
      return await this.uploadImage(fileForUpload, 'gallery', sizes, req);
    } catch (error) {
      console.error('Gallery media upload error:', error);
      return {
        success: false,
        error: error.message || 'Dosya yükleme hatası'
      };
    }
  }

  async uploadSupportFile(file, req = null) {
    try {
      let fileBuffer;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        fileBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('Dosya için buffer veya path bulunamadı');
      }
      const fileForUpload = { ...file, buffer: fileBuffer };
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (err) {
          console.warn('[FILE_UPLOAD] Geçici destek dosyası silinemedi:', err.message);
        }
      }
      if (file.mimetype && file.mimetype.startsWith('image/')) {
        return await this.uploadImage(fileForUpload, 'support', {
          thumbnail: { width: 200, height: 200 },
          medium: { width: 800, height: 800 }
        }, req);
      }
      return await this.uploadToS3(fileForUpload, 'support', {}, req);
    } catch (error) {
      console.error('Support file upload error:', error);
      return { success: false, error: error.message || 'Dosya yükleme hatası' };
    }
  }

  async uploadFeedMedia(file, req = null) {
    try {
      if (file.mimetype.startsWith('video/')) {
        let fileForUpload = file;
        if (file.path && !file.buffer) {
          fileForUpload = {
            ...file,
            buffer: fs.readFileSync(file.path),
            originalname: file.originalname || path.basename(file.path)
          };
        } else if (!file.buffer) {
          throw new Error('Video dosyası için buffer veya path bulunamadı');
        }

        const result = await this.uploadToS3(fileForUpload, 'feed', {}, req);
        if (file.path && fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (err) {
            console.warn('[FILE_UPLOAD] Geçici feed videosu silinemedi:', err.message);
          }
        }
        return result;
      }

      let fileBuffer;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        fileBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('Görsel dosyası için buffer veya path bulunamadı');
      }

      const fileForUpload = { ...file, buffer: fileBuffer };
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (err) {
          console.warn('[FILE_UPLOAD] Geçici feed görseli silinemedi:', err.message);
        }
      }

      return await this.uploadImage(fileForUpload, 'feed', {
        thumbnail: { width: 200, height: 200 },
        medium: { width: 800, height: 800 }
      }, req);
    } catch (error) {
      console.error('Feed media upload error:', error);
      return {
        success: false,
        error: error.message || 'Dosya yükleme hatası'
      };
    }
  }

  // Upload document
  async uploadDocument(file, req = null) {
    try {
      // Get file buffer
      let fileBuffer;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        fileBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('File buffer or path not available');
      }

      const fileForUpload = {
        ...file,
        buffer: fileBuffer
      };

      return await this.uploadToS3(fileForUpload, 'documents', {}, req);
    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete file from S3 or local storage
  async deleteFromS3(key) {
    try {
      if (useS3 && s3) {
        const deleteParams = {
          Bucket: this.bucketName,
          Key: key
        };

        await s3.deleteObject(deleteParams).promise();
        
        return {
          success: true,
          message: 'File deleted successfully'
        };
      } else {
        // Delete from local storage
        const uploadsDir = path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadsDir, key);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return {
            success: true,
            message: 'File deleted successfully'
          };
        } else {
          return {
            success: false,
            error: 'File not found'
          };
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete multiple files from S3
  async deleteMultipleFromS3(keys) {
    try {
      if (keys.length === 0) {
        return { success: true, message: 'No files to delete' };
      }

      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map(key => ({ Key: key }))
        }
      };

      const result = await s3.deleteObjects(deleteParams).promise();
      
      return {
        success: true,
        deleted: result.Deleted,
        errors: result.Errors
      };
    } catch (error) {
      console.error('S3 bulk delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get file info from S3
  async getFileInfo(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await s3.headObject(params).promise();
      
      return {
        success: true,
        info: {
          size: result.ContentLength,
          lastModified: result.LastModified,
          contentType: result.ContentType,
          etag: result.ETag
        }
      };
    } catch (error) {
      console.error('S3 get file info error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate signed URL for private file access
  async generateSignedUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      
      return {
        success: true,
        url
      };
    } catch (error) {
      console.error('S3 signed URL error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List files in a folder
  async listFiles(folder = '', maxKeys = 1000) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: folder,
        MaxKeys: maxKeys
      };

      const result = await s3.listObjectsV2(params).promise();
      
      return {
        success: true,
        files: result.Contents.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          etag: file.ETag
        }))
      };
    } catch (error) {
      console.error('S3 list files error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get file size in human readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file type
  validateFileType(mimetype) {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      // Görsel formatları
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/x-icon',
      'image/heic',
      'image/heif',
      'image/avif',
      // Video formatları
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      // Doküman formatları
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    return allowedTypes.includes(mimetype);
  }

  // Get file category based on mimetype
  getFileCategory(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'document';
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'spreadsheet';
    return 'other';
  }
}

// Export multer middleware
const uploadMiddleware = upload;

// Export service instance
const fileUploadService = new FileUploadService();

module.exports = {
  fileUploadService,
  uploadMiddleware,
  upload
};
