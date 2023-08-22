import { FileTypeValidator, ParseFilePipe } from '@nestjs/common';

export const avatarValidatPipe = new ParseFilePipe({
  validators: [new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' })],
});
