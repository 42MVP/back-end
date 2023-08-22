import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multerS3 from 'multer-s3';

export const multerOptionsFactory = (configService: ConfigService): MulterOptions => {
  const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      callback(null, true);
    } else {
      callback(new Error('Invalid file type'), false);
    }
  };

  return {
    storage: multerS3({
      s3: new S3Client({
        region: configService.get('AWS_S3_REGION'),
        credentials: {
          accessKeyId: configService.get('AWS_S3_ACCESS_KEY'),
          secretAccessKey: configService.get('AWS_S3_SECRET_KEY'),
        },
      }),
      bucket: configService.get('AWS_S3_BUCKET'),
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata(req, file, callback) {
        callback(null, { fieldName: file.fieldname });
      },
      key(req, file, callback) {
        const filename = `${Date.now().toString()}_${file.originalname}`;
        callback(null, filename);
      },
    }),
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  };
};
