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

	function FunctionManager()
	{
		this.functionQueued = false;
		this.timeoutHandle = null;
		this.executionQueue = [];
		this.deferred = null;
	}

	function Performance()
	{
		this.cachedContexts = null;
		this.cachedFunctions = null;
		this.cachedArgs = null;

		this.debounceFunctions = null;

		this.initialize = function ()
		{
			this.cachedContexts = [];
			this.cachedFunctions = [];
			this.cachedArgs = ["undefined"];

			this.debounceFunctions = {};
		}

		this.initialize();

		/*
		 *  Moves the supplied function to the end of the execution queue, and removes duplicate calls.
		 *  Returns a jQuery promise.
		 */
		// func - function that will be debounced.
		// options (optional):
		// args - arguments to pass to the function that will be debounced, as an array.
		// delay - amount of time after the js execution stack completes before the function should execute. Defaults to 0.
		// requeue - removes the existing timeout and schedules a new one.
		// thisContext - parse a this context in to bind the function to before calling it
		this.debounce = function (func, options)
		{
			if (typeof func !== "function")
			{
				throw "The first parameter when calling debounce should be a function.";
			}

			if (typeof options === "undefined")
			{
				options = {}; // just create it, it's easier than checking for it everywhere
			}

			var key = this._determineDebounceKey(func, options);

			if (this.debounceFunctions[key] === null || typeof this.debounceFunctions[key] === 'undefined')
			{
				this.debounceFunctions[key] = new FunctionManager();
			}

			if (this.debounceFunctions[key].deferred === null)
			{
				this.debounceFunctions[key].deferred = $.Deferred();
			}

			var functionManager = this.debounceFunctions[key];

			if (functionManager.functionQueued === true && options.requeue === true)
			{
				clearTimeout(functionManager.timeoutHandle);
				functionManager.timeoutHandle = null;
				functionManager.functionQueued = false;
			}

			if (functionManager.functionQueued === false)
			{
				var delay = options.delay || 0;
				functionManager.functionQueued = true;

				var self = this;

				functionManager.timeoutHandle = setTimeout(function ()
				{
					var functionToExecute = func;
					var thisContext = (checkExists(options.thisContext))? options.thisContext : this;
					functionToExecute.apply(thisContext, options.args);

					functionManager.functionQueued = false;

					functionManager.deferred.resolve();

					self.debounceFunctions[key] = null;

				}, delay);
			}

			return this.debounceFunctions[key].deferred.promise(this.debounceFunctions[key]);
		};

		this._determineDebounceKey = function (func, options)
		{
			if (typeof options.thisContext === "undefined")
			{
				options.thisContext = window.self;
			}

			var argsDefined = true;

			if (typeof options.args === "undefined" || options.args === null || options.args.length === 0)
			{
				argsDefined = false;
			}

			var indexOfContext = this.cachedContexts.indexOf(options.thisContext);

			if (indexOfContext === -1)
			{
				this.cachedContexts.push(options.thisContext);
				indexOfContext = this.cachedContexts.length - 1;
			}

			var indexOfFunc = this.cachedFunctions.indexOf(func);

			if (indexOfFunc === -1)
			{
				this.cachedFunctions.push(func);
				indexOfFunc = this.cachedFunctions.length - 1;
			}

			var indexOfArgs = 0;

			if (argsDefined)
			{
				indexOfArgs = this.cachedArgs.indexOf(options.args);

				if (indexOfArgs === -1)
				{
					this.cachedArgs.push(options.args);
					indexOfArgs = this.cachedArgs.length - 1;
				}
			}

			var key = "{0}_{1}_{2}".format(indexOfContext, indexOfFunc, indexOfArgs);

			return key;
		};
	}

	utilities.performance = new Performance();
	utilities.FunctionManager = FunctionManager;

})(jQuery);