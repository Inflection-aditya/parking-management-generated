import request from 'supertest';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { faker } from '@faker-js/faker';
import Application from '../../../src/app';
import { setTestData, getTestData } from '../init';

const infra = Application.instance();

describe('Tenants API tests', function () {
    const agent = request.agent(infra._expressApp);

    it('Create tenant', function (done) {
        loadTenantsCreateModel();
        const createModel = getTestData('TenantsCreateModel');

        agent
            .post('/api/v1/tenants')
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(createModel)
            .expect((response) => {
                setTestData(response.body.Data.id, 'TENANT_ID');

                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('code');
                expect(response.body.Data).to.have.property('domain');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('industry');
                expect(response.body.Data).to.have.property('websiteUrl');
                expect(response.body.Data).to.have.property('logoUrl');
                expect(response.body.Data).to.have.property('contactEmail');
                expect(response.body.Data).to.have.property('contactPhone');
                expect(response.body.Data).to.have.property('address');
                expect(response.body.Data).to.have.property('city');
                expect(response.body.Data).to.have.property('state');
                expect(response.body.Data).to.have.property('postalCode');
                expect(response.body.Data).to.have.property('country');
                expect(response.body.Data).to.have.property('status');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('isVerified');
                expect(response.body.Data).to.have.property('settings');
                expect(response.body.Data).to.have.property('billingConfig');
                expect(response.body.Data).to.have.property('verifiedAt');
                expect(response.body.Data).to.have.property('verifiedBy');

                expect(response.body.Data.name).to.equal(getTestData('TenantsCreateModel').name);
                expect(response.body.Data.code).to.equal(getTestData('TenantsCreateModel').code);
                expect(response.body.Data.domain).to.equal(getTestData('TenantsCreateModel').domain);
                expect(response.body.Data.description).to.equal(getTestData('TenantsCreateModel').description);
                expect(response.body.Data.industry).to.equal(getTestData('TenantsCreateModel').industry);
                expect(response.body.Data.websiteUrl).to.equal(getTestData('TenantsCreateModel').websiteUrl);
                expect(response.body.Data.logoUrl).to.equal(getTestData('TenantsCreateModel').logoUrl);
                expect(response.body.Data.contactEmail).to.equal(getTestData('TenantsCreateModel').contactEmail);
                expect(response.body.Data.contactPhone).to.equal(getTestData('TenantsCreateModel').contactPhone);
                expect(response.body.Data.address).to.equal(getTestData('TenantsCreateModel').address);
                expect(response.body.Data.city).to.equal(getTestData('TenantsCreateModel').city);
                expect(response.body.Data.state).to.equal(getTestData('TenantsCreateModel').state);
                expect(response.body.Data.postalCode).to.equal(getTestData('TenantsCreateModel').postalCode);
                expect(response.body.Data.country).to.equal(getTestData('TenantsCreateModel').country);
                expect(response.body.Data.status).to.equal(getTestData('TenantsCreateModel').status);
                expect(response.body.Data.isActive).to.equal(getTestData('TenantsCreateModel').isActive);
                expect(response.body.Data.isVerified).to.equal(getTestData('TenantsCreateModel').isVerified);

                expect(response.body.Data.settings)
                    .to.deep.equal(getTestData('TenantsCreateModel').settings);

                expect(response.body.Data.billingConfig)
                    .to.deep.equal(getTestData('TenantsCreateModel').billingConfig);
            })
            .expect(201, done);
    });

    it('Get tenant by id', function (done) {
        agent
            .get(`/api/v1/tenants/${getTestData('TENANT_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('code');
                expect(response.body.Data).to.have.property('domain');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('industry');
                expect(response.body.Data).to.have.property('websiteUrl');
                expect(response.body.Data).to.have.property('logoUrl');
                expect(response.body.Data).to.have.property('contactEmail');
                expect(response.body.Data).to.have.property('contactPhone');
                expect(response.body.Data).to.have.property('address');
                expect(response.body.Data).to.have.property('city');
                expect(response.body.Data).to.have.property('state');
                expect(response.body.Data).to.have.property('postalCode');
                expect(response.body.Data).to.have.property('country');
                expect(response.body.Data).to.have.property('status');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('isVerified');
                expect(response.body.Data).to.have.property('settings');
                expect(response.body.Data).to.have.property('billingConfig');
                expect(response.body.Data).to.have.property('verifiedAt');
                expect(response.body.Data).to.have.property('verifiedBy');

                expect(response.body.Data.name).to.equal(getTestData('TenantsCreateModel').name);
                expect(response.body.Data.code).to.equal(getTestData('TenantsCreateModel').code);
                expect(response.body.Data.domain).to.equal(getTestData('TenantsCreateModel').domain);
                expect(response.body.Data.description).to.equal(getTestData('TenantsCreateModel').description);
                expect(response.body.Data.industry).to.equal(getTestData('TenantsCreateModel').industry);
                expect(response.body.Data.websiteUrl).to.equal(getTestData('TenantsCreateModel').websiteUrl);
                expect(response.body.Data.logoUrl).to.equal(getTestData('TenantsCreateModel').logoUrl);
                expect(response.body.Data.contactEmail).to.equal(getTestData('TenantsCreateModel').contactEmail);
                expect(response.body.Data.contactPhone).to.equal(getTestData('TenantsCreateModel').contactPhone);
                expect(response.body.Data.address).to.equal(getTestData('TenantsCreateModel').address);
                expect(response.body.Data.city).to.equal(getTestData('TenantsCreateModel').city);
                expect(response.body.Data.state).to.equal(getTestData('TenantsCreateModel').state);
                expect(response.body.Data.postalCode).to.equal(getTestData('TenantsCreateModel').postalCode);
                expect(response.body.Data.country).to.equal(getTestData('TenantsCreateModel').country);
                expect(response.body.Data.status).to.equal(getTestData('TenantsCreateModel').status);
                expect(response.body.Data.isActive).to.equal(getTestData('TenantsCreateModel').isActive);
                expect(response.body.Data.isVerified).to.equal(getTestData('TenantsCreateModel').isVerified);
            })
            .expect(200, done);
    });

    it('Search tenants records', function (done) {
        agent
            .get(`/api/v1/tenants/search${loadTenantsQueryString()}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Data.TenantsRecords).to.have.property('TotalCount');
                expect(response.body.Data.TenantsRecords).to.have.property('RetrievedCount');
                expect(response.body.Data.TenantsRecords).to.have.property('PageIndex');
                expect(response.body.Data.TenantsRecords).to.have.property('ItemsPerPage');
                expect(response.body.Data.TenantsRecords).to.have.property('Order');

                expect(response.body.Data.TenantsRecords.TotalCount).to.be.greaterThan(0);
                expect(response.body.Data.TenantsRecords.RetrievedCount).to.be.greaterThan(0);
                expect(response.body.Data.TenantsRecords.Items.length).to.be.greaterThan(0);
            })
            .expect(200, done);
    });

    it('Update tenant', function (done) {
        loadTenantsUpdateModel();
        const updateModel = getTestData('TenantsUpdateModel');

        agent
            .put(`/api/v1/tenants/${getTestData('TENANT_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(updateModel)
            .expect((response) => {
                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('code');
                expect(response.body.Data).to.have.property('domain');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('industry');
                expect(response.body.Data).to.have.property('websiteUrl');
                expect(response.body.Data).to.have.property('logoUrl');
                expect(response.body.Data).to.have.property('contactEmail');
                expect(response.body.Data).to.have.property('contactPhone');
                expect(response.body.Data).to.have.property('address');
                expect(response.body.Data).to.have.property('city');
                expect(response.body.Data).to.have.property('state');
                expect(response.body.Data).to.have.property('postalCode');
                expect(response.body.Data).to.have.property('country');
                expect(response.body.Data).to.have.property('status');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('isVerified');
                expect(response.body.Data).to.have.property('settings');
                expect(response.body.Data).to.have.property('billingConfig');
                expect(response.body.Data).to.have.property('verifiedAt');
                expect(response.body.Data).to.have.property('verifiedBy');

                expect(response.body.Data.name).to.equal(getTestData('TenantsUpdateModel').name);
                expect(response.body.Data.code).to.equal(getTestData('TenantsUpdateModel').code);
                expect(response.body.Data.domain).to.equal(getTestData('TenantsUpdateModel').domain);
                expect(response.body.Data.description).to.equal(getTestData('TenantsUpdateModel').description);
                expect(response.body.Data.industry).to.equal(getTestData('TenantsUpdateModel').industry);
                expect(response.body.Data.websiteUrl).to.equal(getTestData('TenantsUpdateModel').websiteUrl);
                expect(response.body.Data.logoUrl).to.equal(getTestData('TenantsUpdateModel').logoUrl);
                expect(response.body.Data.contactEmail).to.equal(getTestData('TenantsUpdateModel').contactEmail);
                expect(response.body.Data.contactPhone).to.equal(getTestData('TenantsUpdateModel').contactPhone);
                expect(response.body.Data.address).to.equal(getTestData('TenantsUpdateModel').address);
                expect(response.body.Data.city).to.equal(getTestData('TenantsUpdateModel').city);
                expect(response.body.Data.state).to.equal(getTestData('TenantsUpdateModel').state);
                expect(response.body.Data.postalCode).to.equal(getTestData('TenantsUpdateModel').postalCode);
                expect(response.body.Data.country).to.equal(getTestData('TenantsUpdateModel').country);
                expect(response.body.Data.status).to.equal(getTestData('TenantsUpdateModel').status);
                expect(response.body.Data.isActive).to.equal(getTestData('TenantsUpdateModel').isActive);
                expect(response.body.Data.isVerified).to.equal(getTestData('TenantsUpdateModel').isVerified);
            })
            .expect(200, done);
    });

    it('Delete tenant', function (done) {
        agent
            .delete(`/api/v1/tenants/${getTestData('TENANT_ID')}`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .expect((response) => {
                expect(response.body.Status).to.equal('success');
            })
            .expect(200, done);
    });

    it('Create tenant again', function (done) {
        loadTenantsCreateModel();
        const createModel = getTestData('TenantsCreateModel');

        agent
            .post('/api/v1/tenants')
            .set('Content-Type', 'application/json')
            .set('x-api-key', `${process.env.TEST_API_KEY}`)
            .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
            .send(createModel)
            .expect((response) => {
                setTestData(response.body.Data.id, 'TENANT_ID');

                expect(response.body.Data).to.have.property('name');
                expect(response.body.Data).to.have.property('code');
                expect(response.body.Data).to.have.property('domain');
                expect(response.body.Data).to.have.property('description');
                expect(response.body.Data).to.have.property('industry');
                expect(response.body.Data).to.have.property('websiteUrl');
                expect(response.body.Data).to.have.property('logoUrl');
                expect(response.body.Data).to.have.property('contactEmail');
                expect(response.body.Data).to.have.property('contactPhone');
                expect(response.body.Data).to.have.property('address');
                expect(response.body.Data).to.have.property('city');
                expect(response.body.Data).to.have.property('state');
                expect(response.body.Data).to.have.property('postalCode');
                expect(response.body.Data).to.have.property('country');
                expect(response.body.Data).to.have.property('status');
                expect(response.body.Data).to.have.property('isActive');
                expect(response.body.Data).to.have.property('isVerified');
                expect(response.body.Data).to.have.property('settings');
                expect(response.body.Data).to.have.property('billingConfig');
                expect(response.body.Data).to.have.property('verifiedAt');
                expect(response.body.Data).to.have.property('verifiedBy');

                expect(response.body.Data.name).to.equal(getTestData('TenantsCreateModel').name);
                expect(response.body.Data.code).to.equal(getTestData('TenantsCreateModel').code);
                expect(response.body.Data.domain).to.equal(getTestData('TenantsCreateModel').domain);
                expect(response.body.Data.description).to.equal(getTestData('TenantsCreateModel').description);
                expect(response.body.Data.industry).to.equal(getTestData('TenantsCreateModel').industry);
                expect(response.body.Data.websiteUrl).to.equal(getTestData('TenantsCreateModel').websiteUrl);
                expect(response.body.Data.logoUrl).to.equal(getTestData('TenantsCreateModel').logoUrl);
                expect(response.body.Data.contactEmail).to.equal(getTestData('TenantsCreateModel').contactEmail);
                expect(response.body.Data.contactPhone).to.equal(getTestData('TenantsCreateModel').contactPhone);
                expect(response.body.Data.address).to.equal(getTestData('TenantsCreateModel').address);
                expect(response.body.Data.city).to.equal(getTestData('TenantsCreateModel').city);
                expect(response.body.Data.state).to.equal(getTestData('TenantsCreateModel').state);
                expect(response.body.Data.postalCode).to.equal(getTestData('TenantsCreateModel').postalCode);
                expect(response.body.Data.country).to.equal(getTestData('TenantsCreateModel').country);
                expect(response.body.Data.status).to.equal(getTestData('TenantsCreateModel').status);
                expect(response.body.Data.isActive).to.equal(getTestData('TenantsCreateModel').isActive);
                expect(response.body.Data.isVerified).to.equal(getTestData('TenantsCreateModel').isVerified);

                expect(response.body.Data.settings)
                    .to.deep.equal(getTestData('TenantsCreateModel').settings);

                expect(response.body.Data.billingConfig)
                    .to.deep.equal(getTestData('TenantsCreateModel').billingConfig);
            })
            .expect(201, done);
    });
});

export const loadTenantsCreateModel = () => {
    const model = {
        name: faker.company.name(),
        code: faker.string.alpha({ length: 6 }),
        domain: faker.internet.domainName(),
        description: faker.lorem.sentence(),
        industry: faker.commerce.department(),
        websiteUrl: faker.internet.url(),
        logoUrl: faker.image.url(),
        contactEmail: faker.internet.email(),
        contactPhone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode(),
        country: faker.location.country(),
        status: 'active',
        isActive: true,
        isVerified: false,
        settings: {
            theme: faker.color.human(),
            timezone: faker.location.timeZone()
        },
        billingConfig: {
            plan: 'pro',
            maxOrganizations: 10,
            maxUsers: 100,
            maxTeams: 20,
            features: ['users', 'teams', 'reports']
        }
    };

    setTestData(model, 'TenantsCreateModel');
};

export const loadTenantsUpdateModel = () => {
    const model = {
        name: faker.company.name(),
        description: faker.lorem.sentence(),
        isActive: faker.datatype.boolean(),
        settings: {
            theme: faker.color.human(),
            timezone: faker.location.timeZone()
        },
        billingConfig: {
            plan: 'enterprise',
            maxOrganizations: 50,
            maxUsers: 500,
            maxTeams: 100,
            features: ['users', 'teams', 'billing', 'analytics']
        }
    };

    setTestData(model, 'TenantsUpdateModel');
};

export function loadTenantsQueryString() {
    return '?';
}
