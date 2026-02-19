import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data) => {
                return {
                    statusCode,
                    message: 'Success',
                    data,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
