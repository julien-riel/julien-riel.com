import { Request, Response, Router } from "express";
import { User } from "../models/user";

// this is just for ts, will disappear in transpilation
export interface VdmRequest extends Request {
  user: User;
}
