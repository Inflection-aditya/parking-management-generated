import express from "express";
import { logger } from "../logger/logger";
// Routes imports start here -->


// Routes imports end here <--
////////////////////////////////////////////////////////////////////////////////////

export class RouteHandler {

    public static setup = async (expressApp: express.Application): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try {

                //Handling the base route
                expressApp.get('/api/{{ApiVersion}}/', (_request, response) => {
                    response.send({
                        message : `{{Service}} Service API [Version ${process.env.API_VERSION}]`,
                    });
                });
                expressApp.get('/health-check', (_request, response) => {
                    response.send('ok');
                });

                // Routes start here -->
                
                
                // Routes end here <--

                resolve(true);

            } catch (error) {
                logger.error('Error initializing the router: ' + error.message);
                reject(false);
            }
        });
    };

}
