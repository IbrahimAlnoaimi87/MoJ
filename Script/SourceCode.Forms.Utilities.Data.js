(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null)
    {
        SourceCode = {};
    }
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null)
    {
        SourceCode.Forms = {};
    }
    if (typeof SourceCode.Forms.Utilities === "undefined" || SourceCode.Forms.Utilities === null)
    {
        SourceCode.Forms.Utilities = {};
    }

    var utilities = SourceCode.Forms.Utilities;

    function Data()
    {
        /**
        * @typedef {Object} smartObjectListMethodExecutionOptions
        * @property {string} smartObjectGuid - Required: The guid of the smartObject to retrieve.
        * @property {string} methodName - Required: The method name to execute
        * @property {int} pageNumber - Optional: The page to return
        * @property {int} pageSize - Optional: The page size to use for paging
        * @property {string} includedColumnsFilter - Optional: JSON string array of filter columns
        * @property {bool} limitXSS - Optional: 
        */
        /**
        * Gets a smartobject list method results
        * @param {smartObjectListMethodExecutionOptions} options configuration options
        * @returns {Promise} A jquery promise object
        */
        this.smartObjectListMethodExecution = function (options)
        {
            if (!checkExists(options) || !checkExists(options.smartObjectGuid) || !checkExists(options.methodName))
            {
                throw "Mandatory options.smartObjectGuid and or options.methodName not specified";
            }
            var deferred = $.Deferred();

            options.method = "SMARTOBJECTLISTMEHTODEXECUTION";

            $.ajax({
                cache: false,
                data: $.param(options),
                dataType: "text",
                url: "Utilities/AJAXCall.ashx",
                success: function (data)
                {
                    if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
                    {
                        deferred.reject(data);
                        return;
                    }
                    try
                    {
                        var jsonData = JSON.parse(data);
                        deferred.resolve(jsonData);
                    }
                    catch (ex)
                    {
                        deferred.reject(ex);
                    }

                },
                type: "POST"
            });
            return deferred.promise();
        };
    }

    utilities.Data = new Data();

})(jQuery);
