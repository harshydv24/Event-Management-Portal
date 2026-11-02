import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireProfile } from '../middlewares/rbac.js';
import { upload } from '../middlewares/upload.js';
import { uploadFile, uploadMultipleFiles } from '../controllers/uploadController.js';

const router = Router();

// POST /api/upload — Upload a single file
router.post('/', verifyToken, requireProfile, upload.single('file'), uploadFile);

// POST /api/upload/multiple — Upload multiple files (max 5)
router.post('/multiple', verifyToken, requireProfile, upload.array('files', 5), uploadMultipleFiles);

export default router;
