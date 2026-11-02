import { Request, Response, NextFunction } from 'express';
import { isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary.js';

/**
 * POST /api/upload
 * Upload a single file (image or PDF).
 * Uses Cloudinary if configured; otherwise falls back to local uploads directory.
 */
export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    if (isCloudinaryConfigured()) {
      // Cloudinary cloud upload
      const cloudResult = await uploadToCloudinary(req.file.path);
      res.status(201).json({
        url: cloudResult.secure_url,
        filename: cloudResult.public_id,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: cloudResult.bytes || req.file.size,
        provider: 'cloudinary',
      });
      return;
    }

    // Local disk upload fallback
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.status(201).json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      provider: 'local',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/multiple
 * Upload multiple files and return their URLs.
 */
export const uploadMultipleFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({ error: 'No files uploaded.' });
      return;
    }

    const filesArray = req.files as Express.Multer.File[];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (isCloudinaryConfigured()) {
      const results = await Promise.all(
        filesArray.map(async (file) => {
          const cloudResult = await uploadToCloudinary(file.path);
          return {
            url: cloudResult.secure_url,
            filename: cloudResult.public_id,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: cloudResult.bytes || file.size,
            provider: 'cloudinary',
          };
        })
      );
      res.status(201).json({ files: results });
      return;
    }

    const files = filesArray.map((file) => ({
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      provider: 'local',
    }));

    res.status(201).json({ files });
  } catch (error) {
    next(error);
  }
};
