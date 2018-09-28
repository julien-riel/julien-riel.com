import { Request, Response, NextFunction } from "express";
import { VdmRequest } from "../models/vdm-request";

/**
 * Ce middleware rajoute le user sur la requête.
 * Normalement, ceci devrait être fait à partir du JWT
 */
export default (req: VdmRequest, res:  Response, next: NextFunction) => {
    req.user = {
        userType:  "employee",
        id: "urielju",
        roles: ["admin"]
    };
    next();
}