var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	var definition =
	{
		name : "",
		displayName : "",
		mapName : "",
		mapDisplayName : "",
		validationStatus : "",
		validationMessages : ""
	};

	/**
	* @type SmartObjectAssociationProperty

	* @property {string} name - The name of the SmartObjectAssociationProperty of the associated SmartObject
	* @property {string} displayName - The display name of the SmartObjectAssociationProperty of the associated SmartObject
	* @property {string} mapName - The name of the SmartObjectAssociationProperty of the current SmartObject
	* @property {string} mapDisplayName - The display name of the SmartObjectAssociationProperty of the current SmartObject
	* @property {string} validationStatus - Validation status
	* @property {string} validationMessages - Validation messages, pipe separated.
	*/

	/**
	* A SmartObject association property. The options object overrides the default values.
	* @function
	* @param {SmartObjectAssociationPropertyOptions} options
	*/
	SourceCode.Forms.Types.SmartObjectAssociationProperty = function (options)
	{
		options = options || {};
		verifyRequiredValues(options);

		Helper.setObjProperties(this, definition, options);

		return this;
	}

	function verifyRequiredValues(options)
	{
		//Not implemented
	}

})();