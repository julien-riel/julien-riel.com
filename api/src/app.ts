import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";

// Importations des controlleurs
import errorController from "./controllers/error-controller";
import helloWorldController from "./controllers/hello-world-controller";
// const configRoutes = require('../common/config-routes');
// const fileRoutes = require('../common/file-routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/hello", helloWorldController);

// Error Handler
app.use(errorController);

export default app;
