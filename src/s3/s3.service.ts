import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3Service {
  private readonly s3: S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      region: this.configService.get('AWS_S3_REGION'),
      accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get('AWS_S3_SECRET_KEY'),
    });
  }

  async avatarUpload(file: Express.MulterS3.File, id: number): Promise<string> {
    const uploadResult = await this.s3
      .upload({
        Bucket: this.configService.get('AWS_S3_BUCKET'),
        Key: `${this.configService.get('AWS_S3_AVATAR_FOLDER')}${id}_avatar`,
        ContentType: file.mimetype,
        Body: file.buffer,
      })
      .promise();

    return uploadResult.Location;
  }
}
