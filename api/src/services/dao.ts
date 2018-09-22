import { ObjectID, MongoClient, Db } from "mongodb";
import * as Ajv from "ajv";
import { MongoFindParams } from "../models/mongo-find-params";
import { DAOConfig } from "../models/dao-config";

const ajv = new Ajv({ allErrors: true });

// Présente id et pas _id
function cleanId(insertedObject) {
  if (!insertedObject.id) {
    insertedObject.id = insertedObject._id;
  }
  delete insertedObject._id;
}

function insert(moduleConfig: DAOConfig, db: Db, payload, callback) {
  // // Valider le schéma
  // if (moduleConfig.jsonSchema) {
  //   var validate = ajv.compile(moduleConfig.jsonSchema);
  //   var valid = validate(payload);
  //   if (!valid) {
  //     return req.res.status(400).send(validate.errors);
  //   }
  // }

  // Changement au payload (id et version)
  if (payload.id) {
    payload._id = payload.id;
  }

  // Initialisation de la version pour l'optimistic locking
  if (payload.version) {
    throw new Error("400");
    // return req.res.status(400).send("Ne pas spécifier la version");
  }
  payload.version = 1;

  // Insertion dans la base de données.
  db.collection(moduleConfig.collectionName).insertOne(payload, function(
    err,
    result
  ) {
    if (err) {
      return callback(err);
    }
    console.log(
      `${result.insertedId} ${
        result.insertedCount
      } insérés dans la collection ${moduleConfig.collectionName}`
    );
    let insertedObject = result.ops[0];

    cleanId(insertedObject);

    callback(null, insertedObject);
  });
}

function find(moduleConfig: DAOConfig, db, options: MongoFindParams, callback) {
  try {
    db.collection(moduleConfig.collectionName).countDocuments(
      options.getFilters(),
      (err, count) => {
        if (err) {
          console.log("ERRR", err);
          throw err;
        }

        let cursor = null;
        if (options.projection) {
          cursor = db
            .collection(moduleConfig.collectionName)
            .find(options.getFilters(), options.projection);
        } else {
          cursor = db
            .collection(moduleConfig.collectionName)
            .find(options.getFilters());
        }

        if (options.skip) {
          cursor = cursor.skip(options.skip);
        }
        if (options.limit) {
          cursor = cursor.limit(options.limit);
        }
        if (options.sort) {
          cursor = cursor.sort(options.sort);
        }

        cursor.toArray(function(err, results) {
          if (err) {
            console.log("ERRR", err);
            throw err;
          }
          callback({
            paging: {
              offset: options.skip,
              limit: options.limit,
              totalCount: count
            },
            items: results
          });
        });
      }
    );
  } catch (err) {
    console.log("Une erreur ici", err);
    throw err;
  }
}

function findById(
  moduleConfig: DAOConfig,
  req,
  id,
  options: MongoFindParams,
  callback
) {
  const query = moduleConfig.useObjectId
    ? { _id: new ObjectID(id) }
    : { _id: id };

  // Todo ajouter les filtres.
  req.db
    .collection(moduleConfig.collectionName)
    .find(query)
    .toArray(function(err, result) {
      if (err) {
        console.log("erreur", err);
        return req.next(err);
      }

      let rr = result[0];
      cleanId(rr);

      callback(rr);
    });
}

function updateById(moduleConfig: DAOConfig, req, id, payload, callback) {
  // Valider le schema avant la mise à jour
  if (moduleConfig.jsonSchema) {
    var validate = ajv.compile(moduleConfig.jsonSchema);
    var valid = validate(payload);
    if (!valid) {
      return req.res.status(400).send(validate.errors);
    }
  }

  // Chercher l'ancien enregistrements
  findById(moduleConfig, req, id, new MongoFindParams(), function(findResult) {
    // Vérification de l'optimistic locking
    let dbVersion = findResult.version;
    if (dbVersion != payload.version) {
      console.log("Erreur 409");
      req.next(new Error("409"));
    }

    let payloadClone = JSON.parse(JSON.stringify(payload));
    payloadClone.version = payloadClone.version + 1;

    const query = moduleConfig.useObjectId
      ? { _id: new ObjectID(id) }
      : { _id: id };
    req.db
      .collection(moduleConfig.collectionName)
      .updateOne(query, payloadClone, function(err, result) {
        if (err) {
          console.log("Erreur de update" + err);
          req.next(err);
        }
        console.log(result.result);
        console.log("UPDATE OPS", result.ops);
        callback(result.result);
      });
  });
}

function createFunctions(moduleConfig: DAOConfig) {
  if (!moduleConfig) {
    throw new Error("Missing configuration in dao");
  }

  return {
    insert: async function wrappedInsert(req, payload): Promise<any> {
      return new Promise((resolve, reject) => {
        insert(moduleConfig, req, payload, function(err, result) {
          if (err) return reject(err);
          resolve(result);
        });
      });
    },
    update: function wrappedUpdate(req, id, payload): Promise<any> {
      return new Promise((resolve, reject) => {
        return updateById(moduleConfig, req, id, payload, function(
          err,
          result
        ) {
          if (err) return reject(err);
          resolve(result);
        });
      });
    },
    find: function wrappedFind(db, options, callback) {
      return find(moduleConfig, db, options, callback);
    },

    findById: function wrappedFindById(req, id, callback) {
      return findById(moduleConfig, req, id, new MongoFindParams(), callback);
    },

    findByIdWithFilter: function wrappedFindById(
      req,
      id,
      options: MongoFindParams,
      callback
    ) {
      return findById(moduleConfig, req, id, options, callback);
    }
  };
}

export default createFunctions;
