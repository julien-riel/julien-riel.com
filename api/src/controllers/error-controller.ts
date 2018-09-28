import { Request, Response } from "express";

// TODO: Handle rejected promise
// TODO: Log et format response

const errorController = (err, req: Request, res: Response, next) => {
  console.error("Erreur handler!!!!!!!!!");
  res.status(500).send(err.message || "Something broke");
};

export default errorController;
