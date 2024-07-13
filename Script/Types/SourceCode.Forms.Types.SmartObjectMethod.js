var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	/**
	* @type SmartObjectMethodOptions

	* @property {string} name - The name of the SmartObjectMethod
	* @property {string} displayName - The display name of the SmartObjectMethod
	* @property {string} validationStatus - Validation status
	* @property {string} validationMessages - Validation messages, pipe separated.
	* @property {boolean} isUnique - must it be a unique value
	* @property {string} subType - Sub type of the SmartObjectMethod
	*/

	/**
	* A SmartObject method. The options object overrides the default values.
	* @function
	* @param {SmartObjectMethodOptions} options
	*/
	SourceCode.Forms.Types.SmartObjectMethod = function (options)
	{
		options = options || {};
		verifyRequiredValues(options);

		this.name = options.name || "";
		this.displayName = options.displayName || "";
		this.value = options.value || "";
		this.isUnique = options.isUnique || false;
		this.itemType = "Method";
		this.subType = options.subType || "";
		this.validationStatus = options.validationStatus || "";
		this.validationMessages = options.validationMessages || "";

		return this;
	}

	function verifyRequiredValues(options)
	{
		//Not implemented
	}

})();
