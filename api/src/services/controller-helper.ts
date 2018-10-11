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



function nameReplacer(
  match,
  p1: string,
  p2: string,
  p3: string,
  offset,
  string
) {
  // p1 is nondigits, p2 digits, and p3 non-alphanumerics
  return p2.toLowerCase() + p3;
}
// TODO: Regarder la config DAO pour voir si les filtres par intervales sont activés
// TODO: Typer la valeur recherchée.
function _rangeFrom(filterName: string, value, options: MongoFindParams, daoConfig: DAOConfig) {
  let field = filterName.replace(/^(from)([A-Z])(.*)/, nameReplacer);
  // console.log(`From:  ${field} > ${value}`);
  let theType = getTypeOfJsonSchemaProperty(daoConfig.jsonSchema, field);
  let parsedValue = parseAccordingToJsonSchemaType(value, theType);

  let f = {};
  f[field] = { $gt: parsedValue };
  options.filters.push(f);
}

function _rangeTo(filterName: string, value, options: MongoFindParams, daoConfig: DAOConfig) {
  let field = filterName.replace(/^(to)([A-Z])(.*)/, nameReplacer);
  // console.log(`To:  ${field} < ${value}`);
  let theType = getTypeOfJsonSchemaProperty(daoConfig.jsonSchema, field);
  let parsedValue = parseAccordingToJsonSchemaType(value, theType);

  let f = {};
  f[field] = { $lt: parsedValue };
  options.filters.push(f);
}

// TODO: Tester cette fonction
function _paramRepeated(filterName: string, value, options: MongoFindParams, daoConfig: DAOConfig) {
  let $or = [];
  let theType = getTypeOfJsonSchemaProperty(daoConfig.jsonSchema, filterName);
  value.forEach(item => {
    let f = {};
    let parsedValue = parseAccordingToJsonSchemaType(item, theType);
    f[filterName] = parsedValue;
    $or.push(f);
  });
  options.filters.push({ $or });
}

/**
 * Retourne la définition d'un json-schema en fonction d'une dot notation.
 * @param jsonSchema
 * @param path
 */
function getTypeOfJsonSchemaProperty(jsonSchema: any, path: string) {
  let parts: string[] = path.split(".");
  if (parts.length == 1) {
    return jsonSchema.properties[parts[0]];
  } else {
    let otherParts = parts.slice(1);
    let subSchema = null;
    if (jsonSchema.type === "object") {
      subSchema = jsonSchema.properties[parts[0]];
    } else if (jsonSchema.type === "array") {
      if (
        jsonSchema.items.type === "array" ||
        jsonSchema.items.type === "object"
      ) {
        subSchema = jsonSchema.properties;
      } else {
        return jsonSchema.items[parts[0]];
      }
    }
    return getTypeOfJsonSchemaProperty(subSchema, otherParts.join("."));
  }
}

function parseAccordingToJsonSchemaType(value: string, theType: any) {
  if (theType.type === "string") {
    // TODO: Checker les formats pour supporter d'autres trucs tels que les dates.
    return value;
  } else if (theType.type === "boolean") {
    if (value === "1" || value.toUpperCase() === "TRUE") {
      return true;
    } else {
      return false;
    }
  } else if (theType.type === "integer") {
    return parseInt(value);
  } else if (theType.type === "number") {
    return parseFloat(value);
  }
}

function _filter(
  filterName: string,
  value,
  options: MongoFindParams,
  daoConfig: DAOConfig
) {
  let theType = getTypeOfJsonSchemaProperty(daoConfig.jsonSchema, filterName);
  let parsedValue = parseAccordingToJsonSchemaType(value, theType);
  let f = {};
  f[filterName] = parsedValue;
  options.filters.push(f);
}



let bb = [
  [
    -73.63861083984375,
    45.534731835669675
  ],
  [
    -73.60153198242186,
    45.534731835669675
  ],
  [
    -73.60153198242186,
    45.55252525134013
  ],
  [
    -73.63861083984375,
    45.55252525134013
  ],
  [
    -73.63861083984375,
    45.534731835669675
  ]
];


// https://wiki.openstreetmap.org/wiki/Bounding_Box
// bbox = left,bottom,right,top
// bbox = min Longitude , min Latitude , max Longitude , max Latitude 
function _bbox(value, options: MongoFindParams, daoConfig: DAOConfig) {
  let geoQuery: any = { "location.geometry" : {
    $geoWithin :{ $geometry : { type: "Polygon", coordinates: [ bb ] } }
  }};

  options.filters.push(geoQuery);
}
 
// Special Indexes Restriction
// You cannot combine the $near operator, which requires a special geospatial index, with a query operator or command that requires another special index. For example you cannot combine $near with the $text query.
function _radius_not_usable(value, options: MongoFindParams, daoConfig: DAOConfig) {
  let geoQuery: any = { "location.geometry" : {
    $near:{
        $geometry : {
        type : "Point" ,
        coordinates : [ -73.56994628906249, 45.50394073994564 ]
      },
      $maxDistance: 1000 /* en mètres */
    }
  }};

  options.filters.push(geoQuery);
}


function _radius(value, options: MongoFindParams, daoConfig: DAOConfig) {
  let geoQuery: any = { "location.geometry" : {
    $geoWithin :{ $centerSphere :[ [ -73.56994628906249, 45.50394073994564 ] , 1 / 6378.1 ]} }
  };

  options.filters.push(geoQuery);
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
    }
    else if (param === "bbox") {
      _bbox(value, options, daoConfig);
    }
    else if (param === "radius") {
      _radius(value, options, daoConfig);
    } else if (param === "sort") {
      _sort(value, options);
    } else if (param.match(/^from[A-Z]*/)) {
      // TODO: Gérer les ranges de dates.
      // Gérer le cas ou un nom commence vraiment par
      _rangeFrom(param, value, options, daoConfig);
    } else if (param.match(/^to[A-Z]*/)) {
      _rangeTo(param, value, options, daoConfig);
    } else {
      // Si aucun mot réservé, alors c'est des filtres sur le champ
      if (Array.isArray(value)) {
        _paramRepeated(param, value, options, daoConfig);
      } else {
        _filter(param, value, options, daoConfig);
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

/**
 * Cette classe permet d'appliquer les conventions
 * 
 * NOTE: pour que la recherche soit insensible à la casse, les champs doivent être indexés.
 * 
 */
export class ControllerHelper {
  constructor(private daoConfig: DAOConfig) {}

  queryParamsToMongoFindParams(options: MongoFindParams, query: any) {
    return _queryParamsToMongoFindParams(this.daoConfig, options, query);
  }
}
