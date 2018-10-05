import { MongoFindParams } from "../models/mongo-find-params";
import { DAOConfig } from "../models/dao-config";

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

function nameReplacer(match, p1: string, p2: string, p3: string, offset, string) {
  // p1 is nondigits, p2 digits, and p3 non-alphanumerics
  return p2.toLowerCase() + p3;
}
// TODO: Regarder la config DAO pour voir si les filtres par intervales sont activés
// TODO: Typer la valeur recherchée.
function _rangeFrom(filterName: string, value, options: MongoFindParams) {
  let field = filterName.replace(/^(from)([A-Z])(.*)/, nameReplacer);
  console.log(`From:  ${field} > ${value}`);
  let f = {};
  f[field] = { $gt: parseInt(value) };
  options.filters.push(f);
}

function _rangeTo(filterName: string, value, options: MongoFindParams) {
  let field = filterName.replace(/^(to)([A-Z])(.*)/, nameReplacer);
  console.log(`To:  ${field} < ${value}`);
  let f = {};
  f[field] = { $lt: parseInt(value) };
  options.filters.push(f);
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
  daoConfig: DAOConfig,
  options: MongoFindParams,
  query: any
): MongoFindParams => {

  Object.keys(query).forEach(param => {
    let value = query[param];

    if (param === "limit") {
      _limit(value, options);
    } else if (param === "offset") {
      _offset(value, options);
    } else if (param === "q") {
      if (daoConfig.fullTextSearch.enable) {
        _textQuery(value, options);
      }
    } else if (param === "fields") {
      _fields(value, options);
    } else if (param === "sort") {
      _sort(value, options);
      } else if (param.match(/^from[A-Z]*/)) {
        _rangeFrom(param, value, options);
      } else if (param.match(/^to[A-Z]*/)) {
        _rangeTo(param, value, options);
    } else {
      // Si aucun mot réservé, alors c'est des filtres sur le champ
      if (Array.isArray(value)) {
        _paramRepeated(param, value, options);
      } else {
        // TODO: Il faut considérer le type de la donnée recherchée lors de la construction de la requête.
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

export class ControllerHelper {
  constructor(private daoConfig: DAOConfig) {}

  queryParamsToMongoFindParams(options: MongoFindParams, query: any) {
    return _queryParamsToMongoFindParams(this.daoConfig, options, query);
  }
}
