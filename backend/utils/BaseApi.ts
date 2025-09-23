import { Response } from "express";
import { getStatusCode, ReasonPhrases } from "http-status-codes";


type ResponseType = {
  status: string | number;
  message: string;
  result: Object | string | null;
};

export default abstract class BaseApi {
  public send(
    res: Response,
    result: string | object,
    code?: keyof typeof ReasonPhrases
  ) {

    const statusCode = getStatusCode(ReasonPhrases[code || "OK"]);


    let response: ResponseType = {
      status: statusCode,
      message: "success",
      result,
    };

    return res.status(statusCode).json(response);
  }
}
