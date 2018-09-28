import { MongoFindParams } from "../models/mongo-find-params";

// Faire une classe et passer le schémas au constructeur
function _limit(value, options: MongoFindParams) {
  options.limit = parseInt(value);
}

function _offset(value, options: MongoFindParams) {
  options.skip = parseInt(value);
}

function _textQuery(value, options: MongoFindParams) {
  options.filters.push({ $text: { $search: value } });

  // TODO: Prendre en charge le tri par score
  //   db.stores.find(
  //     { $text: { $search: "java coffee shop" } },
  //     { score: { $meta: "textScore" } }
  //  )
  //   options.sort = { score: { $meta: "textScore" } };
  // db.collection.createIndex( { "$**": "text" } )
  // options.skip = value;
}

function _fields(value, options: MongoFindParams) {
  options.projection = value.split(",").reduce((prev, curr) => {
    prev[curr] = 1;
    return prev;
  }, {});
}

function _sort(value, options: MongoFindParams) {
  options.sort = value.split(",").reduce((prev, curr) => {
    let dir = 1;
    let name = curr;
    if (curr.startsWith("+")) {
      dir = 1;
      name = curr.replace("+", "");
    } else if (curr.startsWith("-")) {
      dir = -1;
      name = curr.replace("-", "");
    }
    prev[name] = dir;
    return prev;
  }, {});
}
function _rangeFrom(value, filters) {
  // let f = {};
  // f[param] = { $gt: value };
  // filters.push(f);
}
function _rangeTo(value) {
  // let f = {};
  // f[param] = { $lt: value };
  // filters.push(f);
}

function _paramRepeated(filterName: string, value, options: MongoFindParams) {
  let $or = [];
  value.forEach(item => {
    let f = {};
    f[filterName] = item;
    $or.push(f);
  });
  options.filters.push({ $or });
}

function _filter(filterName: string, value, options: MongoFindParams) {
  let f = {};
  f[filterName] = value;
  options.filters.push(f);
}

let _queryParamsToMongoFindParams = (
  schema: any,
  options: MongoFindParams,
  query: any
): MongoFindParams => {
  console.log("Voici le schema", schema);

  Object.keys(query).forEach(param => {
    let value = query[param];

    if (param === "limit") {
      _limit(value, options);
    } else if (param === "offset") {
      _offset(value, options);
    } else if (param === "q") {
      _textQuery(value, options);
    } else if (param === "fields") {
      _fields(value, options);
    } else if (param === "sort") {
      _sort(value, options);
      // } else if (param === "from[A-Z].*") {
      //   _rangeFrom(value);
      // } else if (param === "to[A-Z]") {
      //   _rangeTo(value, filters);
    } else {
      if (Array.isArray(value)) {
        _paramRepeated(param, value, options);
      } else {
        // Si on recherche avec un string, un integer, ça ne trouve pas.
        _filter(param, value, options);
      }
    }
  });

  // Rajouter les valeurs par défaut pour le paging
  if (!options.skip) {
    options.skip = 0;
  }

  if (!options.limit) {
    options.limit = 10;
  }

  if (!options.sort) {
    options.sort = { _id: 1 };
  }

  return options;
};

export class ControlleurHelper {
  constructor(private schema: any) {}

  queryParamsToMongoFindParams(options: MongoFindParams, query: any) {
    return _queryParamsToMongoFindParams(this.schema, options, query);
  }
}
