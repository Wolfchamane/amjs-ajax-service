require('../_setup');
const { AmjsAjaxAdapterJSON }   = require('@amjs/ajax-adapter');
const { equal }                 = require('assert');
const AmjsAjaxService           = require('../../src/Service');
const AmjsDataTypesBase         = require('@amjs/data-types/src/Base');
const AmjsDataTypesObject       = require('@amjs/data-types/src/Object');
const AmjsFactory               = require('@amjs/factory');

/**
 * Mock service
 * @class   MockService
 */
class MockService extends AmjsAjaxService
{
    /**
     * @override
     */
    _getModel()
    {
        return 'MockModel';
    }
}

/**
 * Mock model
 * @class   MockModel
 */
class MockModel extends AmjsDataTypesObject
{
    /**
     * @override
     */
    toJSON()
    {
        return { key : 'value' };
    }
}

AmjsFactory.register('MockModel', MockModel);

(function ()
{
    let sut = new AmjsAjaxService();
    equal(sut instanceof AmjsDataTypesBase, true, 'AmjsAjaxService extends AmjsDataTypesBase');

    sut = AmjsFactory.create('AjaxService');
    equal(sut instanceof AmjsAjaxService, true, 'AmjsAjaxService is registered as "AjaxService"');
})();

(async function ()
{
    try
    {
        const sut = new MockService();
        let response = await sut._onRequestEnd(new Response());
        equal(AmjsFactory.is('MockModel', response) === true, true, '_onRequestEnd returns valid model');
        sut.$model = null;

        response = await sut._onRequestEnd(new Error('MockError'));
        equal(Array.isArray(response.errors), true, true, '_onRequestEnd returns a pool of errors');
    }
    catch (e)
    {
        console.log(`AmjsAjaxService > _onRequestEnd > Error: ${e}`);
    }
})();

(function ()
{
    const sut = new AmjsAjaxService();
    equal(sut._getModel() === null, true, '_getModel by default returns "null"');
})();

(function ()
{
    const config = {};
    const sut = new AmjsAjaxService();
    sut._buildRequestConfig();

    sut._buildRequestConfig(config);
    equal(config.headers === sut.headers, true, '_buildRequestConfig > config > headers are equal to service\'s headers');
    equal(config.method === sut.method, true, '_buildRequestConfig > config > method is equal to service\'s method');
    equal(config.params === sut.params, true, '_buildRequestConfig > config > params are equal to service\'s params');
    equal(AmjsFactory.is('URL', config.url), true, '_buildRequestConfig > config > ulr is an instanceof URL');

    const mockSut = new MockModel();

    sut.method = 'POST';
    sut.$model = new MockModel();
    sut._buildRequestConfig(config);
    equal(JSON.stringify(config.body) === JSON.stringify(mockSut.toJSON()), true,
        '_buildRequestConfig > config > body is related model toJSON()');

    sut.$model = null;
    sut.body = 'foo';
    sut._buildRequestConfig(config);
    equal(config.body === 'foo', true, '_buildRequestConfig > config > body persists as it was in service');

})();

(async function ()
{
    const host = 'https://swapi.dev';
    AmjsAjaxAdapterJSON.register(`Adapter::${host}`, AmjsAjaxAdapterJSON);
    const sut = new AmjsAjaxService({
        host,
        path    : '/api/people/{id}'
    });

    const response = await sut.doRequest();
    equal(Array.isArray(response.errors), true,
        'If there is an error while performing request, response is a pool of errors');
})();

(async function ()
{
    const host = 'https://swapi.dev';
    AmjsAjaxAdapterJSON.register(`Adapter::${host}`, AmjsAjaxAdapterJSON);
    const sut = new AmjsAjaxService({
        host,
        path    : '/api/people/{id}',
        params  : {
            id  : 1
        }
    });
    const response = await sut.doRequest();
    equal(response.data.name === 'Luke Skywalker', true, 'doRequest works as expected');
})();
