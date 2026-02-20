import request from 'supertest';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { faker } from '@faker-js/faker';
import Application from '../../../src/app';
import { setTestData, getTestData } from '../init';

const infra = Application.instance();

describe('Roles API tests', function () {
    const agent = request.agent(infra._expressApp);

    it('Create role', function (done) {
        loadRolesCreateModel();
        const createModel = getTestData('RolesCreateModel');

        agent
            .post('/api/v1/roles')
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(createModel)
            .expect((response) => {
                setTestData(response.body.Data.id, 'ROLE_ID');

                expect(response.body.Data).to.have.property('id');
                expect(response.body.Data).to.have.property('userId');
                expect(response.body.Data).to.have.property('roleName');

                expect(response.body.Data.userId).to.equal(getTestData('RolesCreateModel').userId);
                expect(response.body.Data.roleName).to.equal(getTestData('RolesCreateModel').roleName);
            })
            .expect(201, done);
    });

    it('Get role by id', function (done) {
        agent
            .get(`/api/v1/roles/${getTestData('ROLE_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Data).to.have.property('id');
                expect(response.body.Data).to.have.property('userId');
                expect(response.body.Data).to.have.property('roleName');

                expect(response.body.Data.userId).to.equal(getTestData('RolesCreateModel').userId);
                expect(response.body.Data.roleName).to.equal(getTestData('RolesCreateModel').roleName);
            })
            .expect(200, done);
    });

    it('Search roles', function (done) {
        agent
            .get(`/api/v1/roles/search${loadRolesQueryString()}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Data.RolesRecords).to.have.property('TotalCount');
                expect(response.body.Data.RolesRecords).to.have.property('RetrievedCount');
                expect(response.body.Data.RolesRecords).to.have.property('PageIndex');
                expect(response.body.Data.RolesRecords).to.have.property('ItemsPerPage');
                expect(response.body.Data.RolesRecords).to.have.property('Order');

                expect(response.body.Data.RolesRecords.TotalCount).to.be.greaterThan(0);
                expect(response.body.Data.RolesRecords.RetrievedCount).to.be.greaterThan(0);
                expect(response.body.Data.RolesRecords.Items.length).to.be.greaterThan(0);
            })
            .expect(200, done);
    });

    it('Update role', function (done) {
        loadRolesUpdateModel();
        const updateModel = getTestData('RolesUpdateModel');

        agent
            .put(`/api/v1/roles/${getTestData('ROLE_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(updateModel)
            .expect((response) => {
                expect(response.body.Data).to.have.property('id');
                expect(response.body.Data).to.have.property('userId');
                expect(response.body.Data).to.have.property('roleName');

                expect(response.body.Data.userId).to.equal(getTestData('RolesUpdateModel').userId);
                expect(response.body.Data.roleName).to.equal(getTestData('RolesUpdateModel').roleName);
            })
            .expect(200, done);
    });

    it('Delete role', function (done) {
        agent
            .delete(`/api/v1/roles/${getTestData('ROLE_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Status).to.equal('success');
            })
            .expect(200, done);
    });

    it('Create role again', function (done) {
        loadRolesCreateModel();
        const createModel = getTestData('RolesCreateModel');

        agent
            .post('/api/v1/roles')
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(createModel)
            .expect((response) => {
                setTestData(response.body.Data.id, 'ROLE_ID');

                expect(response.body.Data).to.have.property('id');
                expect(response.body.Data).to.have.property('userId');
                expect(response.body.Data).to.have.property('roleName');

                expect(response.body.Data.userId).to.equal(getTestData('RolesCreateModel').userId);
                expect(response.body.Data.roleName).to.equal(getTestData('RolesCreateModel').roleName);
            })
            .expect(201, done);
    });
});

// ---------------------------------------------------------------------------
// MODEL LOADERS
// ---------------------------------------------------------------------------

export const loadRolesCreateModel = () => {
    const model = {
        userId: getTestData('USER_ID'),
        roleName: faker.helpers.arrayElement([
            'ADMIN',
            'OWNER',
            'MANAGER',
            'MEMBER'
        ])
    };

    setTestData(model, 'RolesCreateModel');
};

export const loadRolesUpdateModel = () => {
    const model = {
        roleName: faker.helpers.arrayElement([
            'ADMIN',
            'MANAGER',
            'MEMBER'
        ])
    };

    setTestData(model, 'RolesUpdateModel');
};

export function loadRolesQueryString() {
    return '?';
}
