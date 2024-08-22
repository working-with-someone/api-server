import busboy from 'busboy';
import { FieldAppender, FileAppender } from './lib/appender';
import { Request, Response } from 'express';
import contentType from 'content-type';
import { wwsError } from '../../error/wwsError';
import { NextFunction } from 'express-serve-static-core';
import asyncCatch from '../../utils/asyncCatch';
import { PassThrough } from 'stream';
import { IncomingHttpHeaders } from 'http';

const formTypes = ['multipart/form-data'];

const getContentType = (req: Request) => contentType.parse(req).type;

export interface File {
  fieldName: string;
  originalName: string;
  encoding: string;
  mimetype: string;
  stream: PassThrough;
}

export interface Field {
  fieldName: string;
  value: string;
}

/**
 * Config.limits.filex가 required되는 것을 제외하고 busboy.BusboyConfig 과 동일하다.
 */
interface Config {
  headers?: IncomingHttpHeaders | undefined;
  highWaterMark?: number | undefined;
  fileHwm?: number | undefined;
  defCharset?: string | undefined;
  defParamCharset?: string | undefined;
  preservePath?: boolean | undefined;
  limits: Limits;
}

interface Limits {
  fieldNameSize?: number | undefined;
  fieldSize?: number | undefined;
  fields?: number | undefined;
  fileSize?: number | undefined;
  files: number;
  parts?: number | undefined;
  headerPairs?: number | undefined;
}

function minion(options: Config) {
  return asyncCatch(async function formBodyParser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // get contentType of request
    const contentType = getContentType(req);

    // if request content type is unsupported, will be injected
    if (!formTypes.includes(contentType)) {
      throw new wwsError(400, 'Invalid content type');
    }

    req.body = Object.create(null);

    // create busboy object
    const bb = busboy({
      headers: req.headers,
      ...options,
    });

    // create FileAppender
    const fieldAppender = new FieldAppender(req);

    bb.on('field', (name, value, info) => {
      // append field to request object
      fieldAppender.append({ fieldName: name, value });
    });

    // create FileAppender
    // options.limits.files는 required 이며
    // 1 이하라면 file은 req.file에 attach되고
    // 2 이상이라면 file은 req.files에 attack된다.
    const fileAppender = new FileAppender(req, options.limits.files);

    bb.on('file', (name, stream, fileInfo) => {
      // busboy는 stream을 모두 consume해야 'finish' event가 emit되기 때문에
      // stream을 그대로 req.file | req.files 에 attach할 수 없기 때문에 passThrough로 옮겨 attach한다.
      const _stream = new PassThrough();
      stream.pipe(_stream);

      const file: File = {
        fieldName: name,
        originalName: fileInfo.filename,
        encoding: fileInfo.encoding,
        mimetype: fileInfo.mimeType,
        stream: _stream,
      };

      // append file to request object
      fileAppender.append(file);

      //file stream of busboy must be resumed for emit 'finish' event
      stream.resume();
    });

    // 아무 문제없이 parsing, attach가 종료되면 call되며, next를 call한다.
    bb.on('close', () => {
      done();
    });

    // parsing, attach중 문제가 발생했다면 err를 담아 next를 call해 errorHandler middleware로 보낸다.
    bb.on('error', (err) => {
      done(err);
    });

    // parsing, attach 과정이 문제없이 종료되거나, 에러가 발생했을 때 call하는 function으로,
    // req 아 bb 를 unpipe하고 next middleware를 call한다.
    function done(err?: any) {
      req.unpipe(bb);

      if (err) {
        throw new wwsError(500, 'failed parsing formdata', err);
      }

      return next();
    }

    req.pipe(bb);
  });
}

export default minion;
