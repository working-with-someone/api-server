import { Request } from 'express';
import type { File, Field } from '..';

abstract class Appender {
  protected req: Request;
  constructor(req: Request) {
    this.req = req;
  }
  public abstract append(obj: File | Field): void;
}

const STRATEGY = {
  none: 'none',
  single: 'single',
  multiple: 'multiple',
};

export class FileAppender extends Appender {
  protected strategy: string;
  constructor(req: Request, fileLimit: number) {
    super(req);

    switch (fileLimit) {
      case 0:
        this.strategy = STRATEGY.none;
        break;
      case 1:
        this.strategy = STRATEGY.single;
        break;
      default:
        this.strategy = STRATEGY.multiple;
    }
  }

  public append(file: File) {
    switch (this.strategy) {
      case STRATEGY.none:
        break;
      case STRATEGY.single:
        this.req.file = file;
        break;
      case STRATEGY.multiple:
        this.req.files?.push(file);
        break;
    }
  }
}

export class FieldAppender extends Appender {
  constructor(req: Request) {
    super(req);
    this.req.body = Object.create(null);
  }

  public append(field: Field) {
    this.req.body[field.fieldName] = field.value;
  }
}
