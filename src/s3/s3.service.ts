import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3Service {
  constructor(private readonly configService: ConfigService) {}

  async avatarUpload(file: Express.MulterS3.File): Promise<string> {
    const s3 = new S3({
      region: this.configService.get('AWS_S3_REGION'),
      accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get('AWS_S3_SECRET_KEY'),
    });

    const uploadResult = await s3
      .upload({
        Bucket: this.configService.get('AWS_S3_BUCKET'),
        Key: `${this.configService.get('AWS_S3_AVATAR_FOLDER')}${Date.now()}_${file.originalname}`,
        ContentType: file.mimetype,
        Body: file.buffer,
      })
      .promise();

    return uploadResult.Location;
  }
}
