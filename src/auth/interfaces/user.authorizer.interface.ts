import express from 'express';

////////////////////////////////////////////////////////////////////////

export interface IUserAuthorizer {

    authorize(
        request: express.Request,
        response: express.Response | null) : Promise<boolean>;

}
