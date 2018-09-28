import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";

// Importations des controlleurs
import errorController from "./controllers/error-controller";
import helloWorldController from "./controllers/hello-world-controller";
import userMiddleware from "./middlewares/user-middleware";
// const configRoutes = require('../common/config-routes');
// const fileRoutes = require('../common/file-routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(userMiddleware);

app.use("/applications", helloWorldController);

// Error Handler
app.use(errorController);

export default app;
