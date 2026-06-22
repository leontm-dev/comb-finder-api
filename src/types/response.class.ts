export class ApiResponse {
  ok: boolean;
  at: Date;
  constructor(
    public statusCode: number,
    public text: string,
    public data: unknown,
  ) {
    this.ok = statusCode < 400 && statusCode >= 200;
    this.at = new Date();
  }

  toJSON() {
    return {
      status: this.statusCode,
      message: this.text,
      ok: this.ok,
      at: this.at,
      data: this.data,
    };
  }
}
