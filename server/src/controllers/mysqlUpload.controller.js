import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import File from "../models/file.model.js";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../config/mysql.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Generate unique filename
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${name}_${Date.now()}_${uuidv4()}${ext}`;
};

// Check if MySQL connection is available
const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Upload resource to MySQL
export const uploadResourceMySQL = async (req, res) => {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return res.status(503).json({ 
        message: "Database service unavailable",
        error: "MySQL connection is not available. Please check your database configuration." 
      });
    }

    const { userId } = getAuth(req);
    const { title, description, type = "document" } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);

    // Save file to MySQL
    const savedFile = await File.create({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
      fileType: 'resource',
      title: title || req.file.originalname,
      description: description || "",
      uploadedBy: user._id.toString(),
      isPublic: true, // Make resources public by default so they can be shared
    });

    const fileData = {
      id: savedFile.id,
      url: `/api/mysql-upload/file/${savedFile.id}`,
      fileName: savedFile.fileName,
      originalName: savedFile.originalName,
      title: savedFile.title,
      description: savedFile.description,
      type: type,
      size: savedFile.size,
      mimeType: savedFile.mimeType,
      uploadedBy: user._id,
      uploadedAt: savedFile.createdAt,
    };

    return res.status(200).json({
      message: "Resource uploaded successfully",
      file: fileData,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`,
      previewUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`
    });
  } catch (error) {
    console.error("MySQL upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload resource",
      error: error.message 
    });
  }
};

// Upload certificate to MySQL
export const uploadCertificateMySQL = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);

    // Save file to MySQL
    const savedFile = await File.create({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
      fileType: 'certificate',
      title: req.file.originalname,
      uploadedBy: user._id.toString(),
      isPublic: false, // Certificates are private
    });

    const fileUrl = `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`;

    // Add to user's certificates array
    user.certificates.push(fileUrl);
    await user.save();

    const fileData = {
      id: savedFile.id,
      url: `/api/mysql-upload/file/${savedFile.id}`,
      fileName: savedFile.fileName,
      originalName: savedFile.originalName,
      size: savedFile.size,
      mimeType: savedFile.mimeType,
      uploadedAt: savedFile.createdAt,
    };

    return res.status(200).json({
      message: "Certificate uploaded successfully",
      file: fileData,
      downloadUrl: fileUrl,
      previewUrl: fileUrl
    });
  } catch (error) {
    console.error("Certificate upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload certificate",
      error: error.message 
    });
  }
};

// Upload avatar to MySQL
export const uploadAvatarMySQL = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.includes('/api/mysql-upload/file/')) {
      try {
        const oldFileId = user.avatar.split('/').pop();
        await File.destroy({ where: { id: oldFileId } });
      } catch (deleteError) {
        console.warn("Failed to delete old avatar:", deleteError);
      }
    }

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);

    // Save file to MySQL
    const savedFile = await File.create({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
      fileType: 'avatar',
      title: 'Profile Avatar',
      uploadedBy: user._id.toString(),
      isPublic: false, // Avatars are private to the user
    });

    const avatarUrl = `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`;

    // Update user avatar
    user.avatar = avatarUrl;
    await user.save();

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: avatarUrl,
      file: {
        id: savedFile.id,
        url: `/api/mysql-upload/file/${savedFile.id}`,
        fileName: savedFile.fileName,
        originalName: savedFile.originalName,
      }
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload avatar",
      error: error.message 
    });
  }
};

// Get file by ID
export const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has permission to access this file
    let userId = null;
    try {
      // Try to get user ID if authenticated, but don't fail if not
      const auth = getAuth(req);
      userId = auth?.userId;
    } catch (error) {
      // User is not authenticated, which is fine for public files
      userId = null;
    }
    
    console.log('📁 File access attempt:', {
      fileId,
      fileName: file.originalName,
      fileType: file.fileType,
      isPublic: file.isPublic,
      uploadedBy: file.uploadedBy,
      requestingUserId: userId
    });
    
    // Allow access if:
    // 1. File is public, OR
    // 2. User is the owner of the file, OR
    // 3. User is authenticated and file type is 'resource' (allow all authenticated users to access resources)
    const canAccess = file.isPublic || 
                     (userId && file.uploadedBy === userId) ||
                     (userId && file.fileType === 'resource');
    
    console.log('🔐 Access check:', { canAccess, isPublic: file.isPublic, isOwner: userId === file.uploadedBy, isResource: file.fileType === 'resource' });
    
    if (!canAccess) {
      console.log('❌ Access denied for file:', fileId);
      return res.status(403).json({ 
        message: "Access denied. File is private and you don't have permission to view it.",
        fileId: fileId,
        isPublic: file.isPublic,
        fileType: file.fileType
      });
    }
    
    console.log('✅ Access granted for file:', fileId);

    // Increment download count
    await file.increment('downloadCount');

    // Set appropriate headers
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    });

    // Send file data
    res.send(file.fileData);
  } catch (error) {
    console.error("Get file error:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve file",
      error: error.message 
    });
  }
};

// Download file (force download)
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has permission to access this file
    let userId = null;
    try {
      // Try to get user ID if authenticated, but don't fail if not
      const auth = getAuth(req);
      userId = auth?.userId;
    } catch (error) {
      // User is not authenticated, which is fine for public files
      userId = null;
    }
    
    // Allow access if:
    // 1. File is public, OR
    // 2. User is the owner of the file, OR
    // 3. User is authenticated and file type is 'resource' (allow all authenticated users to access resources)
    const canAccess = file.isPublic || 
                     (userId && file.uploadedBy === userId) ||
                     (userId && file.fileType === 'resource');
    
    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Increment download count
    await file.increment('downloadCount');

    // Set headers for download
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': file.size,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
    });

    // Send file data
    res.send(file.fileData);
  } catch (error) {
    console.error("Download file error:", error);
    return res.status(500).json({ 
      message: "Failed to download file",
      error: error.message 
    });
  }
};

// Get all resources from all users (for "My Resources" section)
export const getUserFiles = async (req, res) => {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return res.status(503).json({ 
        message: "Database service unavailable",
        error: "MySQL connection is not available. Please check your database configuration." 
      });
    }

    const { userId } = getAuth(req);
    const { type = 'resource', page = 1, limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const offset = (page - 1) * limit;

    // Get ALL resources from ALL users (not just the current user)
    const whereClause = { 
      fileType: type // Default to 'resource' type
    };

    const files = await File.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'originalName', 'fileName', 'mimeType', 'size', 'fileType', 'title', 'description', 'downloadCount', 'isPublic', 'uploadedBy', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const filesWithUrls = files.rows.map(file => ({
      ...file.toJSON(),
      url: `/api/mysql-upload/file/${file.id}`,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      previewUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      uploadedAt: file.createdAt,
      format: file.mimeType.split('/')[1] || 'unknown',
      isPublic: file.isPublic,
      isOwner: file.uploadedBy === userId // Indicate if current user owns this file
    }));

    return res.status(200).json({
      files: filesWithUrls,
      count: files.count,
      page: parseInt(page),
      totalPages: Math.ceil(files.count / limit),
      hasMore: offset + files.rows.length < files.count
    });
  } catch (error) {
    console.error("Get all resources error:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve resources",
      error: error.message 
    });
  }
};

// Get user's own files only (for profile/management)
export const getMyFiles = async (req, res) => {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return res.status(503).json({ 
        message: "Database service unavailable",
        error: "MySQL connection is not available. Please check your database configuration." 
      });
    }

    const { userId } = getAuth(req);
    const { type } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const whereClause = { uploadedBy: user._id.toString() };
    if (type) {
      whereClause.fileType = type;
    }

    const files = await File.findAll({
      where: whereClause,
      attributes: ['id', 'originalName', 'fileName', 'mimeType', 'size', 'fileType', 'title', 'description', 'downloadCount', 'isPublic', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const filesWithUrls = files.map(file => ({
      ...file.toJSON(),
      url: `/api/mysql-upload/file/${file.id}`,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      previewUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      uploadedAt: file.createdAt,
      format: file.mimeType.split('/')[1] || 'unknown',
      isPublic: file.isPublic,
      isOwner: true // All files returned are owned by the user
    }));

    return res.status(200).json({
      files: filesWithUrls,
      count: filesWithUrls.length
    });
  } catch (error) {
    console.error("Get my files error:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve my files",
      error: error.message 
    });
  }
};

// Update file visibility
export const updateFileVisibility = async (req, res) => {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return res.status(503).json({ 
        message: "Database service unavailable",
        error: "MySQL connection is not available. Please check your database configuration." 
      });
    }

    const { userId } = getAuth(req);
    const { fileId } = req.params;
    const { isPublic } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ message: "isPublic must be a boolean value" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const file = await File.findOne({
      where: {
        id: fileId,
        uploadedBy: user._id.toString()
      }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found or unauthorized" });
    }

    // Update visibility
    file.isPublic = isPublic;
    await file.save();

    return res.status(200).json({
      message: `File ${isPublic ? 'made public' : 'made private'} successfully`,
      file: {
        id: file.id,
        title: file.title,
        isPublic: file.isPublic
      }
    });
  } catch (error) {
    console.error("Update file visibility error:", error);
    return res.status(500).json({ 
      message: "Failed to update file visibility",
      error: error.message 
    });
  }
};

// Get public resources (for browsing/sharing)
export const getPublicResources = async (req, res) => {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return res.status(503).json({ 
        message: "Database service unavailable",
        error: "MySQL connection is not available. Please check your database configuration." 
      });
    }

    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { 
      isPublic: true,
      fileType: type || 'resource' // Only show resources by default
    };

    const files = await File.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'originalName', 'fileName', 'mimeType', 'size', 'fileType', 'title', 'description', 'downloadCount', 'createdAt', 'uploadedBy'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const filesWithUrls = files.rows.map(file => ({
      ...file.toJSON(),
      url: `/api/mysql-upload/file/${file.id}`,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      previewUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      uploadedAt: file.createdAt,
      format: file.mimeType.split('/')[1] || 'unknown'
    }));

    return res.status(200).json({
      files: filesWithUrls,
      count: files.count,
      page: parseInt(page),
      totalPages: Math.ceil(files.count / limit),
      hasMore: offset + files.rows.length < files.count
    });
  } catch (error) {
    console.error("Get public resources error:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve public resources",
      error: error.message 
    });
  }
};

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { fileId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const file = await File.findOne({
      where: {
        id: fileId,
        uploadedBy: user._id.toString()
      }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found or unauthorized" });
    }

    await file.destroy();

    return res.status(200).json({
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return res.status(500).json({ 
      message: "Failed to delete file",
      error: error.message 
    });
  }
};
