import { getStatusCode, ReasonPhrases } from "http-status-codes";

export default class ApiError extends Error {
  status: number;
  constructor(status: keyof typeof ReasonPhrases, message: any) {
    super();
    this.status = getStatusCode(ReasonPhrases[status]);
    this.message = message;
  }
  
}
