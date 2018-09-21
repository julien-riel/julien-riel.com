function help(query) {
  let options = {};

  filters = [];
  Object.keys(query).forEach(param => {
    if (param === "limit") {
      options.limit = parseInt(query[param]);
    } else if (param === "offset") {
      options.skip = parseInt(query[param]);
    } else if (param === "q") {
      // db.collection.createIndex( { "$**": "text" } )
      // options.skip = query[param];
    } else if (param === "fields") {
      options.projection = query[param].split(",").reduce((prev, curr) => {
        prev[curr] = 1;
        return prev;
      }, {});
    } else if (param === "sort") {
      options.sort = query[param].split(",").reduce((prev, curr) => {
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
    } else if (param === "from[A-Z].*") {
      let f = {};
      f[param] = { $gt: query[param] };
      filters.push(f);
    } else if (param === "to[A-Z]") {
      let f = {};
      f[param] = { $lt: query[param] };
      filters.push(f);
    } else {
      if (Array.isArray(query[param])) {
        let $or = [];
        query[param].forEach(item => {
          let f = {};
          f[param] = item;
          $or.push(f);
        });
        filters.push({ $or });
      } else {
        let f = {};
        f[param] = query[param];
        filters.push(f);
      }
    }
  });

  if (filters.length > 0) {
    options.filter = { $and: filters };
  }

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
}

module.exports = help;
