import 'reflect-metadata';
import unionBy = require('lodash/unionBy');
import { CookieSettings } from '../interfaces';

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyReply, HTTPInjectResponse } from 'fastify';
console.log('testing')
@Injectable()
export class SetCookiesInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<FastifyReply<HTTPInjectResponse>>();
    const request = ctx.getRequest();
    const handler = context.getHandler();
    const options = Reflect.getMetadata('cookieOptions', handler);
    const cookies = Reflect.getMetadata('cookieSettings', handler);
    request._cookies = [];
    return next
      .handle()
      .toPromise()
      .then(res => {
        const allCookies = unionBy(
          request._cookies,
          cookies,
          item => item.name,
        ) as CookieSettings[];
        for (const cookie of allCookies) {
          const cookieOptions = cookie.options
            ? cookie.options
            : options
            ? options
            : {};
          if (cookie.value) {
            response.cookie(cookie.name, cookie.value, cookieOptions);
          } else {
            response.clearCookie(cookie.name);
          }
        }
        return res || undefined;
      });
  }
}
