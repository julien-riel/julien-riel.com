import app from "./app";
import * as config from "config";

let port: number = config.get("server.port");

app.listen(port, function() {
  console.log(`Service listening on port ${port}`);
});
