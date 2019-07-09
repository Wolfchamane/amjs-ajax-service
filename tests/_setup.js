/**
 * Mock of Headers
 * @class   Headers
 */
class Headers
{
    /**
     * @constructor
     * @param   {Object}    headers Headers
     */
    constructor(headers = {})
    {
        Object.keys(headers).forEach(header => this[header] = headers[header], this);
    }
}

/**
 * Mock of response
 * @class   Response
 */
class Response
{
    /**
     * @constructor
     * @param   {Object}    values  Values
     */
    constructor(values = {})
    {
        this.status = 200;
        this.$value = JSON.stringify(values);
    }

    /**
     * Returns a Promise cloning this object
     * @return {Promise<any>} Promise
     */
    clone()
    {
        return new Promise(resolve => resolve(this));
    }

    /**
     * Returns a Promise resolving the parse of this values
     * @return {Promise<any>}   Promise
     */
    json()
    {
        return new Promise(resolve =>
        {
            resolve(JSON.parse(this.$value));
        });
    }
}

/**
 * Mock a bad response
 * @class   BadResponse
 * @extends Response
 */
class BadResponse extends Response
{
    /**
     * @inheritDoc
     */
    constructor(values = {})
    {
        super(values);
        this.status = 400;
    }

    /**
     * @override
     */
    json()
    {
        return new Promise((res, rej) =>
        {
            rej(new Error('Invalid response'));
        });
    }
}

/**
 * Mock a good bad response
 * @class    ValidBadResponse
 * @extends  BadResponse
 */
class ValidBadResponse extends BadResponse
{
    /**
     * @inheritDoc
     */
    constructor(values = {})
    {
        super(values);
        this.status = 401;
    }

    /**
     * @override
     */
    json()
    {
        return new Promise(resolve => resolve('Unauthorized'));
    }
}

global.fetch                = require('node-fetch');
global.Headers              = global.Headers || Headers;
global.Response             = global.Response || Response;
global.BadResponse          = global.BadResponse || BadResponse;
global.ValidBadResponse     = global.ValidBadResponse || ValidBadResponse;
