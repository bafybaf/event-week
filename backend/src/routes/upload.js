const express = require('express');
const fs = require('fs');
const { auth, adminAuth } = require('../middleware/auth');
const { fileUploadService, uploadMiddleware } = require('../services/fileUploadService');

const router = express.Router();

// Multer error handler middleware (route handler'lardan önce tanımlanmalı)
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('[MULTER_ERROR] Error details:', {
      code: err.code,
      message: err.message,
      field: err.field,
      storageErrors: err.storageErrors
    });
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `Dosya boyutu çok büyük. Maksimum ${parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024) || 100}MB olmalıdır.`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Çok fazla dosya. Maksimum 10 dosya yüklenebilir.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Beklenmeyen dosya alanı.'
      });
    }
    console.error('[MULTER_ERROR] Unknown multer error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Dosya yükleme hatası'
    });
  }
  next();
};

// @route   POST /api/upload/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', [
  auth,
  uploadMiddleware.single('image')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Validate file type
    if (!fileUploadService.validateFileType(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only images are allowed.'
      });
    }

    // Upload profile image with multiple sizes
    const result = await fileUploadService.uploadProfileImage(req.file, req);

    if (result.success) {
      res.json({
        success: true,
        data: {
          original: result.results.original.url,
          thumbnail: result.results.thumbnail?.url,
          medium: result.results.medium?.url,
          large: result.results.large?.url,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during image upload'
    });
  }
});

// @route   POST /api/upload/event-image
// @desc    Upload event image
// @access  Private (Admin/Organizer)
router.post('/event-image', [
  adminAuth,
  uploadMiddleware.single('image')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Validate file type
    if (!fileUploadService.validateFileType(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only images are allowed.'
      });
    }

    // Upload event image with multiple sizes
    const result = await fileUploadService.uploadEventImage(req.file, req);

    if (result.success) {
      res.json({
        success: true,
        data: {
          original: result.results.original.url,
          thumbnail: result.results.thumbnail?.url,
          medium: result.results.medium?.url,
          large: result.results.large?.url,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Event image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during image upload'
    });
  }
});

// @route   POST /api/upload/gallery
// @desc    Upload gallery media (image/video)
// @access  Private
router.post('/gallery', [
  auth,
  (req, res, next) => {
    // Request timeout'u artır (büyük dosyalar için)
    req.setTimeout(600000); // 10 dakika
    res.setTimeout(600000); // 10 dakika
    
    // Error handler'ı önce tanımla
    const errorHandler = (err) => {
      console.error('[UPLOAD] Multer error:', err);
      console.error('[UPLOAD] Multer error details:', {
        code: err.code,
        message: err.message,
        field: err.field,
        storageErrors: err.storageErrors
      });
      
      // Response gönderilmediyse gönder
      if (!res.headersSent) {
        return handleMulterError(err, req, res, next);
      }
    };
    
    try {
      uploadMiddleware.single('media')(req, res, (err) => {
        if (err) {
          return errorHandler(err);
        }
        next();
      });
    } catch (error) {
      console.error('[UPLOAD] Multer setup error:', error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: 'Dosya yükleme başlatılamadı'
        });
      }
    }
  }
], async (req, res) => {
  // Response'un gönderildiğini takip et
  let responseSent = false;
  
  const sendResponse = (status, data) => {
    if (!responseSent) {
      responseSent = true;
      return res.status(status).json(data);
    }
  };
  
  try {
    console.log('[UPLOAD] Gallery upload başladı:', {
      filename: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      hasBuffer: !!req.file?.buffer,
      hasPath: !!req.file?.path
    });

    if (!req.file) {
      return sendResponse(400, {
        success: false,
        error: 'No media file provided'
      });
    }

    // Validate file type
    if (!fileUploadService.validateFileType(req.file.mimetype)) {
      return sendResponse(400, {
        success: false,
        error: 'Invalid file type. Allowed formats: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO, HEIC, HEIF, AVIF, MP4, WebM, OGG, QuickTime'
      });
    }

    console.log('[UPLOAD] Dosya doğrulandı, yükleme başlıyor...');
    // Upload gallery media
    const result = await fileUploadService.uploadGalleryMedia(req.file, req);
    console.log('[UPLOAD] Yükleme tamamlandı:', {
      success: result.success,
      url: result.url || result.results?.original?.url
    });

    if (result.success) {
      const category = fileUploadService.getFileCategory(req.file.mimetype);
      
      return sendResponse(200, {
        success: true,
        data: {
          url: result.results?.original?.url || result.url,
          thumbnail: result.results?.thumbnail?.url,
          medium: result.results?.medium?.url,
          size: req.file.size,
          mimetype: req.file.mimetype,
          category
        }
      });
    } else {
      return sendResponse(500, {
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[UPLOAD] Gallery upload error:', error);
    console.error('[UPLOAD] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      name: error.name,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer,
        hasPath: !!req.file.path
      } : 'No file'
    });
    
    // Geçici dosyayı temizle
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('[UPLOAD] Geçici dosya temizlendi:', req.file.path);
      } catch (cleanupError) {
        console.warn('[UPLOAD] Geçici dosya temizlenemedi:', cleanupError.message);
      }
    }
    
    // Eğer response gönderilmediyse gönder
    if (!responseSent && !res.headersSent) {
      return sendResponse(500, {
        success: false,
        error: error.message || 'Server error during media upload'
      });
    }
  }
});

router.post('/intro-video', [
  auth,
  (req, res, next) => {
    req.setTimeout(600000);
    res.setTimeout(600000);
    uploadMiddleware.single('video')(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  }
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video dosyası seçilmedi'
      });
    }

    if (!String(req.file.mimetype || '').startsWith('video/')) {
      return res.status(400).json({
        success: false,
        error: 'Sadece video yükleyebilirsiniz (MP4, WebM, MOV)'
      });
    }

    let fileForUpload = req.file;
    if (req.file.path && !req.file.buffer) {
      fileForUpload = {
        ...req.file,
        buffer: fs.readFileSync(req.file.path)
      };
    }

    const result = await fileUploadService.uploadToS3(fileForUpload, 'videos', {}, req);
    if (req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (cleanupError) {
        console.warn('Intro video temp cleanup:', cleanupError.message);
      }
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Video yüklenemedi'
      });
    }

    const uploadedUrl = String(result.url || '');
    const relativeUrl = uploadedUrl.includes('/uploads/')
      ? uploadedUrl.slice(uploadedUrl.indexOf('/uploads/'))
      : uploadedUrl;

    return res.json({
      success: true,
      data: {
        url: relativeUrl,
        fileName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Intro video upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Video yüklenirken hata oluştu'
    });
  }
});

router.post('/event-logo', [
  auth,
  uploadMiddleware.single('image')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Logo dosyası seçilmedi'
      });
    }

    if (!String(req.file.mimetype || '').startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Sadece görsel yükleyebilirsiniz (PNG, JPG, SVG, WEBP)'
      });
    }

    if (!fileUploadService.validateFileType(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Desteklenmeyen dosya türü'
      });
    }

    let fileForUpload = req.file;
    if (req.file.path && !req.file.buffer) {
      fileForUpload = {
        ...req.file,
        buffer: fs.readFileSync(req.file.path)
      };
    }

    const result = await fileUploadService.uploadToS3(fileForUpload, 'logos', {}, req);
    if (req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (cleanupError) {
        console.warn('Event logo temp cleanup:', cleanupError.message);
      }
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Logo yüklenemedi'
      });
    }

    const uploadedUrl = String(result.url || '');
    const relativeUrl = uploadedUrl.includes('/uploads/')
      ? uploadedUrl.slice(uploadedUrl.indexOf('/uploads/'))
      : uploadedUrl;

    return res.json({
      success: true,
      data: {
        url: relativeUrl,
        fileName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Event logo upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Logo yüklenirken hata oluştu'
    });
  }
});

router.post('/feed', [
  auth,
  (req, res, next) => {
    req.setTimeout(600000);
    res.setTimeout(600000);
    uploadMiddleware.single('media')(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  }
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No media file provided'
      });
    }

    if (!fileUploadService.validateFileType(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Allowed formats: JPEG, PNG, GIF, WebP, MP4, WebM'
      });
    }

    const result = await fileUploadService.uploadFeedMedia(req.file, req);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const category = fileUploadService.getFileCategory(req.file.mimetype);
    const rawUrl = result.results?.original?.url || result.url || '';
    const uploadsIndex = String(rawUrl).indexOf('/uploads/');
    const url = uploadsIndex !== -1 ? String(rawUrl).slice(uploadsIndex) : rawUrl;
    const thumbnailRaw = result.results?.thumbnail?.url || '';
    const thumbnailIndex = String(thumbnailRaw).indexOf('/uploads/');

    return res.json({
      success: true,
      data: {
        url,
        thumbnail: thumbnailIndex !== -1 ? String(thumbnailRaw).slice(thumbnailIndex) : thumbnailRaw,
        size: req.file.size,
        mimetype: req.file.mimetype,
        fileName: req.file.originalname,
        category
      }
    });
  } catch (error) {
    console.error('[UPLOAD] Feed upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during media upload'
    });
  }
});

router.post('/support', [
  auth,
  (req, res, next) => {
    uploadMiddleware.single('file')(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  }
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Dosya seçilmedi' });
    }
    if (!fileUploadService.validateFileType(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz dosya türü. Görsel veya PDF yükleyin.'
      });
    }

    const result = await fileUploadService.uploadSupportFile(req.file, req);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    const rawUrl = result.results?.original?.url || result.url || '';
    const uploadsIndex = String(rawUrl).indexOf('/uploads/');
    const url = uploadsIndex !== -1 ? String(rawUrl).slice(uploadsIndex) : rawUrl;
    const category = fileUploadService.getFileCategory(req.file.mimetype);

    return res.json({
      success: true,
      data: {
        url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        category
      }
    });
  } catch (error) {
    console.error('[UPLOAD] Support upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Dosya yüklenemedi'
    });
  }
});

// @route   POST /api/upload/document
// @desc    Upload document
// @access  Private (Admin/Organizer)
router.post('/document', [
  adminAuth,
  uploadMiddleware.single('document')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file provided'
      });
    }

    // Validate file type
    if (!fileUploadService.validateFileType(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only PDF and Excel files are allowed.'
      });
    }

    // Upload document
    const result = await fileUploadService.uploadDocument(req.file, req);

    if (result.success) {
      const category = fileUploadService.getFileCategory(req.file.mimetype);
      
      res.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          size: result.size,
          mimetype: result.mimetype,
          category,
          sizeFormatted: fileUploadService.formatFileSize(result.size)
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during document upload'
    });
  }
});

router.post('/multiple', [
  adminAuth,
  (req, res, next) => {
    uploadMiddleware.array('files', 10)(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  }
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Validate file type
        if (!fileUploadService.validateFileType(file.mimetype)) {
          errors.push({
            filename: file.originalname,
            error: 'Invalid file type'
          });
          continue;
        }

        // Upload file based on type
        let result;
        const category = fileUploadService.getFileCategory(file.mimetype);

        if (category === 'image') {
          result = await fileUploadService.uploadImage(file, 'uploads', {}, req);
        } else {
          result = await fileUploadService.uploadToS3(file, 'uploads', {}, req);
        }

        if (result.success) {
          results.push({
            filename: file.originalname,
            url: result.results?.original?.url || result.url,
            size: file.size,
            mimetype: file.mimetype,
            category
          });
        } else {
          errors.push({
            filename: file.originalname,
            error: result.error
          });
        }
      } catch (fileError) {
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        uploaded: results,
        errors: errors,
        summary: {
          total: req.files.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during files upload'
    });
  }
});

// @route   DELETE /api/upload/delete
// @desc    Delete file from S3
// @access  Private (Admin/Organizer)
router.delete('/delete', [
  adminAuth,
  express.json()
], async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required'
      });
    }

    const result = await fileUploadService.deleteFromS3(key);

    if (result.success) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during file deletion'
    });
  }
});

// @route   DELETE /api/upload/delete-multiple
// @desc    Delete multiple files from S3
// @access  Private (Admin/Organizer)
router.delete('/delete-multiple', [
  adminAuth,
  express.json()
], async (req, res) => {
  try {
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'File keys array is required'
      });
    }

    const result = await fileUploadService.deleteMultipleFromS3(keys);

    if (result.success) {
      res.json({
        success: true,
        data: {
          deleted: result.deleted?.length || 0,
          errors: result.errors?.length || 0,
          details: {
            deleted: result.deleted,
            errors: result.errors
          }
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Multiple files delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during files deletion'
    });
  }
});

// @route   GET /api/upload/list
// @desc    List files in a folder
// @access  Private (Admin/Organizer)
router.get('/list', adminAuth, async (req, res) => {
  try {
    const { folder = '', maxKeys = 1000 } = req.query;

    const result = await fileUploadService.listFiles(folder, parseInt(maxKeys));

    if (result.success) {
      res.json({
        success: true,
        data: {
          files: result.files,
          count: result.files.length
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during files listing'
    });
  }
});

// @route   GET /api/upload/signed-url
// @desc    Generate signed URL for private file access
// @access  Private
router.get('/signed-url', auth, async (req, res) => {
  try {
    const { key, expiresIn = 3600 } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required'
      });
    }

    const result = await fileUploadService.generateSignedUrl(key, parseInt(expiresIn));

    if (result.success) {
      res.json({
        success: true,
        data: {
          url: result.url,
          expiresIn: parseInt(expiresIn)
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Signed URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during signed URL generation'
    });
  }
});

module.exports = router;
