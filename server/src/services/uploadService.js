const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify connection
cloudinary.api.ping()
  .then(result => console.log('✅ Cloudinary connected successfully'))
  .catch(err => console.error('❌ Cloudinary connection failed:', err));

// Configure storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mamamboga/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

// Configure storage for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mamamboga/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }]
  }
});

// Configure storage for seller documents
const sellerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mamamboga/sellers',
    allowed_formats: ['jpg', 'png', 'pdf', 'jpeg'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

const uploadProduct = multer({ 
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadProfile = multer({ 
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

const uploadSellerDoc = multer({ 
  storage: sellerStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = { uploadProduct, uploadProfile, uploadSellerDoc, cloudinary };