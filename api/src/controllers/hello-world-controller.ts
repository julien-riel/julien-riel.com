import { Router } from "express";

import { readFilter } from "./hello-world-security";

import { DAOConfig } from "../models/dao-config";
import { MongoFindParams } from "../models/mongo-find-params";
import { VdmRequest } from "../models/vdm-request";

import applicationSchema from "../json-schema/applications";

import { ControllerHelper } from "../services/controller-helper";

import DaoFactory from "../services/dao";
import * as db from "../services/database";

const routes: Router = Router();

let daoConfig: DAOConfig = {
  collectionName: "applications",
  useObjectId: false,
  jsonSchema: applicationSchema,
  sortParams: {
    allFields: true
  },
  fullTextSearch: {
    enable: true
  },
  audit: {
    enable: true
  },
  version: {
    enable: true
  }
  // geo: {}
};
const dao = DaoFactory(daoConfig);
const controllerHelper = new ControllerHelper(daoConfig);

routes.post("/+", async function(req: VdmRequest, res, next) {
  let body = req.body;
  try {
    await db.connect();
    let result = await dao.insert(db.get(), body, req.user.id);
    return res.status(201).send(result);
  } catch (err) {
    res.status(500).send(err);
    Promise.reject(err);
  }
});

routes.get("", async function(req: VdmRequest, res, next) {
  try {
    let options = new MongoFindParams();

    controllerHelper.queryParamsToMongoFindParams(options, req.query);
    readFilter(options, req.user);

    console.log("Voici les filtres", options.filters);

    await db.connect();

    let result = await dao.find(db.get(), options);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

routes.get("/:id", async function(req: VdmRequest, res) {
  let id = req.params.id;

  await db.connect();

  let options = new MongoFindParams();
  readFilter(options, req.user);

  dao.findByIdWithFilter(db.get(), id, options, function(result) {
    res.status(200).send(result);
  });
});

// routes.put('/:id', function (req, res) {
//     let id = req.params.id;
//     let body = req.body;
//     dao.update(req, id, body, function(result) {
//         return res.status(200).send(result);
//     });
// });

export default routes;
