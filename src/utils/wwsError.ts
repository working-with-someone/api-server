import httpStatusCode from 'http-status-codes';

class wwsError extends Error {
  status: number;
  statusText: string;
  originError: Error;

  constructor(status: number, message?: string, err?: any) {
    super(message);
    this.status = status;
    this.statusText = httpStatusCode.getStatusText(status);

    if (message) {
      this.message = message;
    }

    this.message = httpStatusCode.getStatusText(status);
    this.originError = err;
  }
}

export { wwsError };
