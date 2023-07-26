import { MailerOptions } from '@nestjs-modules/mailer';
import { MailerAsyncOptions } from '@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface';

export const mailerConfig: MailerAsyncOptions = {
  useFactory: async (): Promise<MailerOptions> => {
    return {
      transport: {
        host: 'smtp.naver.com',
        port: 587,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
        defaults: {
          from: '"nest-modules" <modules@nestjs.com>',
        },
      },
    };
  },
};
