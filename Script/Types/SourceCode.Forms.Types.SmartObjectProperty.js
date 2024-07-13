var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	/**
	* @type SmartObjectPropertyOptions

	* @property {string} name - The name of the SmartObjectProperty
	* @property {string} displayName - The display name of the SmartObjectProperty
	* @property {string} validationStatus - Validation status
	* @property {string} validationMessages - Validation messages, pipe separated.
	* @property {boolean} isUnique - must it be a unique value
	* @property {boolean} isKey - flag to indicate if property is key
	* @property {boolean} isSmartBox - flag to indicate if property is SmartBox
	* @property {boolean} isRequired - flag to indicate if property is required
	* @property {string} subType - Sub type of the SmartObjectProperty
	* @property {string} description - Description for the SmartObjectProperty
	* @property {string} type - Data type of the SmartObjectProperty (e.g. text, autonumber)
	* @property {string} displayType - Data type's display value for the SmartObjectProperty (e.g. Text, Auto number)
	*/

	/**
	* A SmartObject property. The options object overrides the default values.
	* @function
	* @param {SmartObjectPropertyOptions} options
	*/
	SourceCode.Forms.Types.SmartObjectProperty = function (options)
	{
		options = options || {};

		this.name = options.name || "";
		this.displayName = options.displayName || "";
		this.value = options.value || "";
		this.isUnique = options.isUnique || false;
		this.isKey = options.isKey || false;
		this.isSmartBox = options.isSmartBox || false;
		this.isRequired = options.isRequired || false;
		this.itemType = "ObjectProperty";
		this.subType = options.subType || "";
		this.validationStatus = options.validationStatus || "";
		this.validationMessages = options.validationMessages || "";
		this.description = options.description || "";
		this.type = options.type || "";
		this.displayType = options.displayType || this.type;

		return this;
	}

})();