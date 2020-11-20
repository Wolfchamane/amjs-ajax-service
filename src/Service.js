require('@amjs/ajax-url');
require('@amjs/ajax-adapter');
const AmjsDataTypesBase = require('@amjs/data-types/src/Base');

/**
 * Base class for performing any AJAX request
 * @namespace   amjs.ajax
 * @class       amjs.ajax.Service
 * @extends     amjs.dataTypes.Base
 * @requires    amjs.ajax.URL
 * @requires    amjs.ajax.adapter.Base
 */
class AmjsAjaxService extends AmjsDataTypesBase
{
    /**
     * @inheritDoc
     */
    constructor(values = {})
    {
        super();

        // Set private properties
        this._setPrivateProperties([
            'adapter',
            'allowedMethods',
            'model',
            'raw',
            'request',
            'response',
            'url'
        ]);

        /**
         * Flags if debug info is prompted into console
         * @property    debug
         * @type        {Boolean}
         * @default     false
         */
        this.debug      = false;

        /**
         * Request domain to query
         * @property    host
         * @type        {String}
         * @default     ''
         */
        this.host       = '';

        /**
         * Request path to add into host
         * @property    path
         * @type        {String}
         * @default     ''
         */
        this.path       = '';

        /**
         * Request method to perform.
         * @property    method
         * @type        {String}
         * @default     'GET'
         */
        this.method     = 'GET';

        /**
         * Specific headers to sent into service
         * @property    headers
         * @type        {Object}
         * @default     {}
         */
        this.headers    = {};

        /**
         * Specific params to add into query URL
         * @property    params
         * @type        {Object}
         * @default     {}
         */
        this.params     = {};

        /**
         * Request body payload to be sent, only for 'POST, 'PUT' and 'PATCH' requests
         * @property    body
         * @type        {Object}
         * @default     null
         */
        this.body       = null;

        /**
         * Allowed methods for this service
         * @property    $allowedMethods
         * @type        {Array}
         * @default     [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ]
         * @private
         * @protected
         */
        this.$allowedMethods = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ];

        /**
         * URL object
         * @property    $url
         * @type        {amjs.ajax.URL|null}
         * @default     null
         * @private
         * @protected
         */
        this.$url       = null;

        /**
         * Model associated with this service request.
         * @property    $model
         * @type        {amjs.dataTypes.Object|null}
         * @default     null
         * @private
         * @protected
         */
        this.$model     = null;

        /**
         * API adapter associated with this service request.
         * @property    $adapter
         * @type        {amjs.ajax.adapter.Base|null}
         * @default     null
         * @private
         * @protected
         */
        this.$adapter   = null;

        /**
         * API request configuration
         * @property    $request
         * @type        {Object}
         * @default     null
         * @private
         * @protected
         */
        this.$request   = null;

        /**
         * Raw response obtained from service
         * @property    $response
         * @type        {Object}
         * @default     null
         * @private
         * @protected
         */
        this.$response  = null;

        // Init values
        this._setProperties(values);
    }

    /**
     * Logs info into console system
     * @param   {String}    type    'group | time | error | log | info | warn' kind of message
     * @param   {String}    message To be logged
     * @param   {*}         args    Remaining arguments
     * @private
     */
    _log(type = 'log', message = '', ...args)
    {
        if ([
            'group',
            'groupCollapsed',
            'groupEnd',
            'time',
            'timeEnd',
            'error',
            'log',
            'info',
            'warn'
        ].includes(type) && this.debug)
        {
            console[type](message, ...args);
        }
    }

    /**
     * Callback executed after fetching service endpoint
     * @param   {*} response    Response obtained from service
     * @private
     */
    async _onRequestEnd(response)
    {
        if (response && response.clone)
        {
            response = await response.clone();
        }

        const adapter = this.getAdapter();
        response = await adapter.unserialize(response, this);

        if (response && response.data)
        {
            this.getModel(response.data);
        }

        return this.$model || response;
    }

    /**
     * Returns the model name associated with this request.
     * Model name must be registered through AmjsFactory.
     * @param   {String}    method  This service method
     * @return  {*|null}    Model name associated with this service based on request method.
     * @private
     */
    _getModel(method = 'GET')
    {
        let model;
        switch (method)
        {
            case 'GET':
            default:
                model = null;
                break;
        }

        return model;
    }

    /**
     * Setups the URL object based on current service configuration
     * @param   {Object}    config  Request configuration
     * @private
     */
    _buildURL(config)
    {
        config.url = this.$url = AmjsDataTypesBase.create('URL', {
            domain : this.host,
            path   : this.path,
            params : this.params
        });
    }

    /**
     * Builds request configuration object in order to serialize it with associated API adapter.
     * @param   {Object}    config  Configuration object
     * @private
     */
    _buildRequestConfig(config = {})
    {
        config.headers = this.headers;
        config.method  = this.method;
        config.params  = this.params;

        this._buildURL(config);
        if (['POST', 'PUT', 'PATCH'].includes(this.method))
        {
            const model = this.getModel(this.body);
            config.body = AmjsDataTypesBase.is('Object', model)
                ? model.toJSON()
                : model || this.body;
            this.$model = null;
        }
    }

    /**
     * Performs request.
     * @return {*}  Parsed request response.
     */
    async doRequest()
    {
        const trace = [`Request: %c${this.path}%c`, 'font-weight: 600', 'font-weight: 400'];
        this._log('groupCollapsed', ...trace);
        let response;
        try
        {
            const config = {};
            this._buildRequestConfig(config);
            const adapter = this.getAdapter();
            await adapter.serialize(config, this);
            this._log('log', `[%c${config.method}%c] ${this.$url}`, 'font-weight: 600', 'font-weight: 400');
            this._log('log', `Headers: ${JSON.stringify(config.headers)}`);
            this._log('time', 'Time');
            response = await fetch(this.$url.value, this.$request);
            this._log('timeEnd', 'Time');
        }
        catch (e)
        {
            this._log('error', '%ERROR%c: %o', e, 'font-weight: 600; color: red', 'font-weight: 400; color: black');
            response = e;
        }

        response = await this._onRequestEnd(response);
        this._log('log', `Response: %o`, response);
        this._log('groupEnd', ...trace);

        return response;
    }

    /**
     * Returns current associated adapter with this service instance.
     * @return {amjs.ajax.adapter.Base} Associated adapter
     */
    getAdapter()
    {
        let adapter = this.$adapter;
        if (!adapter)
        {
            this.$adapter = adapter = AmjsDataTypesBase.create(`Adapter::${this.host || 'JSON'}`);
        }

        return adapter;
    }

    /**
     * Returns current model associated with this service instance.
     * @param   {*} values  Values to inject into model.
     * @return  {amjs.dataTypes.Object} Associated model.
     */
    getModel(values)
    {
        let model = this.$model;
        if (!model)
        {
            model = this._getModel(this.method);
            if (model)
            {
                this.$model = model = AmjsDataTypesBase.create(model, values);
            }
        }

        return model;
    }
}

AmjsDataTypesBase.register('AjaxService', AmjsAjaxService);
module.exports = AmjsAjaxService;
