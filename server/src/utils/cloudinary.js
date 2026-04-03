const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
async function uploadToCloudinary(filePath, folder = 'mama-mboga') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Delete image from Cloudinary
async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

// Upload multiple images
async function uploadMultipleToCloudinary(filePaths, folder = 'mama-mboga') {
  const uploadPromises = filePaths.map(filePath => uploadToCloudinary(filePath, folder));
  return Promise.all(uploadPromises);
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary
};