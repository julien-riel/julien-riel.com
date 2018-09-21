var ObjectId = require("mongodb").ObjectID;

const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });

function cleanId(insertedObject) {
  if (!insertedObject.id) {
    insertedObject.id = insertedObject._id;
  }
  delete insertedObject._id;
}

function insert(moduleConfig, req, payload, callback) {
  if (moduleConfig.insertJsonSchema) {
    var validate = ajv.compile(moduleConfig.insertJsonSchema);
    var valid = validate(payload);
    if (!valid) {
      return req.res.status(400).send(validate.errors);
    }
  }

  // Changement au payload (id et version)
  if (payload.id) {
    payload._id = payload.id;
  }

  if (payload.id) {
    payload._id = payload.id;
  }
  if (payload.version) {
    return req.res.status(400).send("Ne pas spécifier la version");
  }
  payload.version = 1;

  req.db
    .collection(moduleConfig.collectionName)
    .insertOne(payload, function(err, result) {
      if (err) {
        return req.next(err);
      }
      console.log(
        `${result.insertedId} ${
          result.insertedCount
        } insérés dans la collection ${moduleConfig.collectionName}`
      );
      insertedObject = result.ops[0];

      cleanId(insertedObject);

      callback(insertedObject);
    });
}

function find(moduleConfig, req, options, callback) {
  try {
    options = options || {};
    let filter = options.filter || {};

    req.db
      .collection(moduleConfig.collectionName)
      .count(filter, (err, count) => {
        if (err) {
          console.log("ERRR", err);
          return req.next(err);
        }

        let cursor = null;
        if (options.projection) {
          cursor = req.db
            .collection(moduleConfig.collectionName)
            .find(filter, options.projection);
        } else {
          cursor = req.db.collection(moduleConfig.collectionName).find(filter);
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
            return req.next(err);
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
      });
  } catch (err) {
    return req.next(err);
  }
}

function findById(moduleConfig, req, id, callback) {
  const query = moduleConfig.useObjectId
    ? { _id: new ObjectId(id) }
    : { _id: id };
  req.db
    .collection(moduleConfig.collectionName)
    .find(query)
    .toArray(function(err, result) {
      if (err) {
        return req.next(err);
      }

      let rr = result[0];
      cleanId(rr);

      callback(rr);
    });
}

function updateById(moduleConfig, req, id, payload, callback) {
  if (moduleConfig.updateJsonSchema) {
    var validate = ajv.compile(moduleConfig.updateJsonSchema);
    var valid = validate(payload);
    if (!valid) {
      return req.res.status(400).send(validate.errors);
    }
  }

  findById(moduleConfig, req, id, function(findResult) {
    let dbVersion = findResult.version;
    if (dbVersion != payload.version) {
      console.log("Erreur 409");
      req.next(new Error("409"));
    }

    let payloadClone = JSON.parse(JSON.stringify(payload));
    payloadClone.version = payloadClone.version + 1;

    const query = moduleConfig.useObjectId
      ? { _id: new ObjectId(id) }
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

function createFunctions(moduleConfig) {
  if (!moduleConfig) {
    throw new Error("Missing configuration in dao");
  }

  return {
    insert: function wrappedInsert(req, payload, callback) {
      return insert(moduleConfig, req, payload, callback);
    },
    update: function wrappedUpdate(req, id, payload, callback) {
      return updateById(moduleConfig, req, id, payload, callback);
    },
    find: function wrappedFind(req, options, callback) {
      return find(moduleConfig, req, options, callback);
    },
    findById: function wrappedFindById(req, id, payload, callback) {
      return findById(moduleConfig, req, id, payload, callback);
    }
  };
}

module.exports = createFunctions;
