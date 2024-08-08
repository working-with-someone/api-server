import httpStatusCode from 'http-status-codes';

class wwsError extends Error {
  status: number;
  statusText: string;
  originError: Error;

  constructor(status: number, message: string, err?: any) {
    super(message);
    this.status = status;
    this.statusText = httpStatusCode.getStatusText(status);
    this.message = message;
    this.originError = err;
  }
}

export { wwsError };
