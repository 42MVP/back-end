import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const multerOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 50, // 50 MB
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (file == null || (file && allowedTypes.includes(file.mimetype))) {
      callback(null, true);
    } else {
      callback(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  },
};
