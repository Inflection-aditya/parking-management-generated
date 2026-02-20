import express from "express";
import fileUpload from 'express-fileupload';
import helmet from 'helmet';
import cors from 'cors';
import { HttpLogger } from "../logger/http.logger";
import { logger } from "../logger/logger";

////////////////////////////////////////////////////////////////////////////////////

export class CommonMiddlewares {

    public static setup = async (expressApp: express.Application): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try {
                expressApp.use(express.urlencoded({ extended: true }));
                expressApp.use(express.json());
                expressApp.use(helmet());
                expressApp.use(cors({
                    origin: '*', //Allow all origins, change this to restrict access to specific origins
                }));
                if (process.env.HTTP_LOGGING_ENABLED === 'true') {
                    HttpLogger.use(expressApp);
                }

                //Your custom middlewares go here

                resolve(true);
            }
            catch (error) {
                logger.error('Error initializing the middlewares: ' + error.message);
                reject(error);
            }
        });
    };

    //Add your custom middlewares here
    //...

}
