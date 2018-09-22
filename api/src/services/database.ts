import { MongoClient, Db } from "mongodb";
import * as config from "config";

const state = {
  db: null as MongoClient
};

export let connect = async (): Promise<void> => {
  if (state.db) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let url: string = config.get("mongo.connectionString");
    MongoClient.connect(
      url,
      { useNewUrlParser: true },
      function(err, db) {
        if (err) return reject(err);
        state.db = db;
        return resolve();
      }
    );
  });
};

export let get = (): Db => {
  return state.db.db("sss");
};

export let close = async (): Promise<any> => {
  if (state.db) {
    state.db.close(function(err, result) {
      if (err) return Promise.reject(err);
      state.db = null;
      return Promise.resolve(result);
    });
  }
  return Promise.resolve(null);
};
