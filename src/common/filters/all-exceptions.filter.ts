import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
    statusCode: number;
    message: string | string[];
    timestamp: string;
    path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const path = request.url;

        let status = 500;
        let message = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || exception.message;
            } else {
                message = exceptionResponse as string;
            }
        } else if (exception instanceof SyntaxError) {
            status = 400;
            message = 'Invalid JSON';
        } else if (exception?.code === 'P2002') {
            // Prisma unique constraint error
            status = 400;
            message = `A record with this ${exception?.meta?.target?.[0] || 'property'} already exists`;
        } else if (exception?.code === 'P2025') {
            // Prisma not found error
            status = 404;
            message = 'Record not found';
        } else {
            message = exception?.message || 'Internal Server Error';
        }

        const errorResponse: ErrorResponse = {
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path,
        };

        response.status(status).json(errorResponse);
    }
}
