import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId?: string;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  (req as RequestWithId).requestId = requestId;

  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(logData));
  });

  next();
};
