import request from 'supertest';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { faker } from '@faker-js/faker';
import Application from '../../../src/app';
import { setTestData, getTestData } from '../init';

const infra = Application.instance();

describe('ClientApps API tests', function () {
    const agent = request.agent(infra._expressApp);

    it('Create client app', function (done) {
        loadClientAppsCreateModel();
        const createModel = getTestData('ClientAppsCreateModel');

        agent
            .post('/api/v1/client-apps')
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(createModel)
            .expect((response) => {
                setTestData(response.body.Data.id, 'CLIENT_APP_ID');
                setTestData(response.body.Data.apiKey, 'CLIENT_APP_API_KEY');

                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('apiKey');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('permissions');

                expect(response.body.Data.name).to.equal(getTestData('ClientAppsCreateModel').name);
                expect(response.body.Data.description).to.equal(getTestData('ClientAppsCreateModel').description);
                expect(response.body.Data.isActive).to.equal(getTestData('ClientAppsCreateModel').isActive);
                expect(response.body.Data.permissions).to.deep.equal(getTestData('ClientAppsCreateModel').permissions);
            })
            .expect(201, done);
    });

    it('Get client app by id', function (done) {
        agent
            .get(`/api/v1/client-apps/${getTestData('CLIENT_APP_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('apiKey');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('permissions');

                expect(response.body.Data.name).to.equal(getTestData('ClientAppsCreateModel').name);
                expect(response.body.Data.description).to.equal(getTestData('ClientAppsCreateModel').description);
                expect(response.body.Data.isActive).to.equal(getTestData('ClientAppsCreateModel').isActive);
                expect(response.body.Data.permissions).to.deep.equal(getTestData('ClientAppsCreateModel').permissions);
            })
            .expect(200, done);
    });

    it('Search client apps records', function (done) {
        loadClientAppsQueryString();

        agent
            .get(`/api/v1/client-apps/search${loadClientAppsQueryString()}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Data.ClientAppsRecords).to.have.property('TotalCount');
                expect(response.body.Data.ClientAppsRecords).to.have.property('RetrievedCount');
                expect(response.body.Data.ClientAppsRecords).to.have.property('PageIndex');
                expect(response.body.Data.ClientAppsRecords).to.have.property('ItemsPerPage');
                expect(response.body.Data.ClientAppsRecords).to.have.property('Order');

                expect(response.body.Data.ClientAppsRecords.TotalCount).to.be.greaterThan(0);
                expect(response.body.Data.ClientAppsRecords.RetrievedCount).to.be.greaterThan(0);
                expect(response.body.Data.ClientAppsRecords.Items.length).to.be.greaterThan(0);
            })
            .expect(200, done);
    });

    it('Update client app', function (done) {
        loadClientAppsUpdateModel();
        const updateModel = getTestData('ClientAppsUpdateModel');

        agent
            .put(`/api/v1/client-apps/${getTestData('CLIENT_APP_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(updateModel)
            .expect((response) => {
                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('apiKey');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('permissions');

                expect(response.body.Data.name).to.equal(getTestData('ClientAppsUpdateModel').name);
                expect(response.body.Data.description).to.equal(getTestData('ClientAppsUpdateModel').description);
                expect(response.body.Data.isActive).to.equal(getTestData('ClientAppsUpdateModel').isActive);
                expect(response.body.Data.permissions).to.deep.equal(getTestData('ClientAppsUpdateModel').permissions);
            })
            .expect(200, done);
    });

    it('Delete client app', function (done) {
        agent
            .delete(`/api/v1/client-apps/${getTestData('CLIENT_APP_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Status).to.equal('success');
            })
            .expect(200, done);
    });

    it('Create client app', function (done) {
        loadClientAppsCreateModel();
        const createModel = getTestData('ClientAppsCreateModel');

        agent
            .post('/api/v1/client-apps')
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(createModel)
            .expect((response) => {
                setTestData(response.body.Data.id, 'CLIENT_APP_ID');
                setTestData(response.body.Data.apiKey, 'CLIENT_APP_API_KEY');

                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('apiKey');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('permissions');

                expect(response.body.Data.name).to.equal(getTestData('ClientAppsCreateModel').name);
                expect(response.body.Data.description).to.equal(getTestData('ClientAppsCreateModel').description);
                expect(response.body.Data.isActive).to.equal(getTestData('ClientAppsCreateModel').isActive);
                expect(response.body.Data.permissions).to.deep.equal(getTestData('ClientAppsCreateModel').permissions);
            })
            .expect(201, done);
    });
});

export const loadClientAppsCreateModel = () => {
    const model = {
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        isActive: faker.datatype.boolean(),
        permissions: ['read', 'write']
    };

    setTestData(model, 'ClientAppsCreateModel');
};

export const loadClientAppsUpdateModel = () => {
    const model = {
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        isActive: faker.datatype.boolean(),
        permissions: ['read']
    };

    setTestData(model, 'ClientAppsUpdateModel');
};

export function loadClientAppsQueryString() {
    return '?';
}
