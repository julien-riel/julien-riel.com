import { Router } from "express";
import { DAOConfig } from "../models/dao-config";
import {
  queryParamsToMongoFindParams,
  addSecurityFilter
} from "../services/controller-helper";
import * as db from "../services/database";

import DaoFactory from "../services/dao";
import { MongoFindParams } from "../models/mongo-find-params";
import { runInNewContext } from "vm";

const routes: Router = Router();

const configSchema = {}; // require('../../json-schemas/config');

let daoConfig: DAOConfig = {
  collectionName: "config",
  useObjectId: false,
  jsonSchema: configSchema,
  sortParams: []
  //   textParams: { };

  // fullTextSearch: { },
  // sort: { },
  // geo: {}
  // audit
  // version
  // security
};
const dao = DaoFactory(daoConfig);

routes.post("/+", async function(req, res, next) {
  let body = req.body;
  try {
    await db.connect();
    let result = await dao.insert(db.get(), body);
    return res.status(201).send(result);
  } catch (err) {
    next(err);
  }
});

routes.get("", async function(req, res, next) {
  try {
    let options = new MongoFindParams();

    queryParamsToMongoFindParams(options, req.query);
    addSecurityFilter(options, {});

    await db.connect();

    dao.find(db.get(), options, function(result) {
      res.status(200).send(result);
    });
  } catch (err) {
    next(err);
  }
});

routes.get("/:id", async function(req, res) {
  let id = req.params.id;

  await db.connect();

  let options = new MongoFindParams();
  addSecurityFilter(options, {});

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
