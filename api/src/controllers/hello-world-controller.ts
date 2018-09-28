import { Router } from "express";

import { readFilter } from "./hello-world-security";

import { DAOConfig } from "../models/dao-config";
import { MongoFindParams } from "../models/mongo-find-params";
import { VdmRequest } from "../models/vdm-request";
import applicationSchema from "../json-schema/applications";

import { ControlleurHelper } from "../services/controller-helper";

import DaoFactory from "../services/dao";
import * as db from "../services/database";

const routes: Router = Router();
const controllerHelper = new ControlleurHelper(applicationSchema);

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
  // security
};
const dao = DaoFactory(daoConfig);

routes.post("/+", async function(req: VdmRequest, res, next) {
  let body = req.body;
  try {
    console.log("Nous tentons dobtenir une connexion");

    await db.connect();
    console.log("Nous avons une connexion");
    let result = await dao.insert(db.get(), body, req.user.id);
    console.log("Nous avons eu un résultat");
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

    console.log("Voici les options", options);

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
