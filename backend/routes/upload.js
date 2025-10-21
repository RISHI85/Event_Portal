const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth, adminAuth } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 seconds timeout
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Helper function to retry upload with exponential backoff
const uploadWithRetry = async (buffer, options, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              console.error(`Attempt ${attempt} failed:`, error.message);
              reject(error);
            } else {
              console.log(`Attempt ${attempt} succeeded:`, result.secure_url);
              resolve(result);
            }
          }
        );
        
        uploadStream.end(buffer);
      });
      
      return result; // Success, return result
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Last attempt failed, throw error
      }
      
      // Wait before retrying (exponential backoff: 2s, 4s, 8s)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// @route POST /api/upload/image
// @desc Upload image to Cloudinary
// @access Private (Admin only)
router.post('/image', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('Uploading image to Cloudinary...', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Upload to Cloudinary with retry logic
    const result = await uploadWithRetry(
      req.file.buffer,
      {
        resource_type: 'image',
        folder: 'event-management',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ],
        timeout: 60000
      },
      3 // Max 3 retries
    );

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Image upload error after all retries:', error);
    
    // Check if it's a network timeout error
    if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
      return res.status(503).json({ 
        message: 'Network timeout. Please check your internet connection and try again.',
        error: 'NETWORK_TIMEOUT'
      });
    }
    
    const errorMessage = error.message || 'Error uploading image';
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: error.message });
  } else if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

// @route DELETE /api/upload/image/:publicId
// @desc Delete image from Cloudinary
// @access Private (Admin only)
router.delete('/image/:publicId', adminAuth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;
