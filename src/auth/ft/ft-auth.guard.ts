import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FtAuthGuard extends AuthGuard('ft-auth') {}
