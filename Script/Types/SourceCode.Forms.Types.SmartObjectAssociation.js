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
		description : "",
		associationType : "",
		smoGuid : "",
		validationStatus : "",
		validationMessages : ""
	};

	/**
	* @type SmartObjectAssociationOptions

	* @property {string} name - The name of the SmartObjectAssociation
	* @property {string} displayName - The display name of the SmartObjectAssociation
	* @property {string} description - Description for the SmartObjectAssociation
	* @property {string} validationStatus - Validation status
	* @property {string} validationMessages - Validation messages, pipe separated.
	* @property {string} associationType - Type of association (e.g. onetoone, onetomany)
	* @property {guid} smoGuid - Guid of SmartObject the current SmartObject is associated to.
	* @property {SourceCode.Forms.Types.SmartObjectAssociationProperty} associationProperties - Collection of SmartObject Properties used by this association
	*/

	/**
	* A SmartObject association. The options object overrides the default values.
	* @function
	* @param {SmartObjectAssociationOptions} options
	*/
	SourceCode.Forms.Types.SmartObjectAssociation = function (options)
	{
		options = options || {};
		verifyRequiredValues(options);

		this.associationProperties = new Types.Collection({
			key: "name",
			name: "Properties",
			itemType: SourceCode.Forms.Types.SmartObjectAssociationProperty
		});

		Helper.addToCollection("associationProperties", options, this);

		Helper.setObjProperties(this, definition, options);

		return this;
	}

	function verifyRequiredValues(options)
	{
		//Not implemented
	}

})();
