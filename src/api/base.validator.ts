import joi from 'joi';
import express from 'express';
import { ErrorHandler } from '../common/error.handling/error.handler';
import { uuid } from '../domain.types/miscellaneous/system.types';

//////////////////////////////////////////////////////////////////

export default class BaseValidator {

    public requestParamAsUUID = async (request: express.Request, paramName: string): Promise<uuid> => {
        try {
            const schema = joi.string().uuid({ version: 'uuidv4' }).required();
            const param = request.params[paramName];
            await schema.validateAsync(param);
            return request.params[paramName] as string;
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    public requestParamAsInteger = async (request: express.Request, paramName: string): Promise<number> => {
        try {
            const schema = joi.number().integer().required();
            const param = request.params[paramName];
            await schema.validateAsync(param);
            return parseInt(request.params[paramName] as string);
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    public requestParamAsDecimal = async (request: express.Request, paramName: string): Promise<number> => {
        try {
            const schema = joi.number().required();
            const param = request.params[paramName];
            await schema.validateAsync(param);
            return parseFloat(request.params[paramName] as string);
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    public validateBaseSearchFilters = async(request: express.Request) => {
        try {
            const schema = joi.object({
            //     createdDateFrom : joi.date().optional(),
            //     createdDateTo   : joi.date().optional(),
                orderBy         : joi.string().optional(),
                order           : joi.string().allow('ascending', 'descending').optional(),
                pageIndex       : joi.number().integer().sign('positive').optional(),
                itemsPerPage    : joi.number().integer().sign('positive').optional(),
            });
            await schema.validateAsync(request.query);
            return this.getBaseSearchFilters(request);
        } catch (error) {
            ErrorHandler.handleValidationError(error);
        }
    };

    public getBaseSearchFilters = (request: express.Request): any => {

        var filters = {};
        
        // Support both old (page, limit) and new (pageIndex, itemsPerPage) query parameters
        let pageIndex: number;
        if (request.query.pageIndex !== undefined && request.query.pageIndex != null) {
            pageIndex = parseInt(request.query.pageIndex as string, 10);
        } else if (request.query.page !== undefined && request.query.page != null) {
            // Convert 1-based page to 0-based pageIndex
            const page = parseInt(request.query.page as string, 10);
            pageIndex = page < 1 ? 0 : page - 1;
        } else {
            pageIndex = 0;
        }

        let itemsPerPage: number;
        if (request.query.itemsPerPage !== undefined && request.query.itemsPerPage != null) {
            itemsPerPage = parseInt(request.query.itemsPerPage as string, 10);
        } else if (request.query.limit !== undefined && request.query.limit != null) {
            itemsPerPage = parseInt(request.query.limit as string, 10);
        } else {
            itemsPerPage = 25;
        }

        // Support both old (sortBy, sortOrder) and new (orderBy, order) query parameters
        let orderBy: string;
        if (request.query.orderBy !== undefined && request.query.orderBy != null) {
            orderBy = request.query.orderBy as string;
        } else if (request.query.sortBy !== undefined && request.query.sortBy != null) {
            orderBy = request.query.sortBy as string;
        } else {
            orderBy = 'createdAt';
        }

        let order: string;
        if (request.query.order !== undefined && request.query.order != null) {
            order = request.query.order as string;
        } else if (request.query.sortOrder !== undefined && request.query.sortOrder != null) {
            // Convert 'asc'/'desc' to 'ascending'/'descending'
            const sortOrder = request.query.sortOrder as string;
            order = sortOrder === 'desc' ? 'descending' : 'ascending';
        } else {
            order = 'descending';
        }

        // filters['CreatedDateFrom'] = request.query.createdDateFrom ? new Date(request.query.createdDateFrom as string) : null;
        // filters['CreatedDateTo']   = request.query.createdDateTo ? new Date(request.query.createdDateTo as string) : null;
        filters['OrderBy']         = orderBy;
        filters['Order']           = order;
        filters['PageIndex']       = pageIndex;
        filters['ItemsPerPage']    = itemsPerPage;

        return filters;
    };

}
