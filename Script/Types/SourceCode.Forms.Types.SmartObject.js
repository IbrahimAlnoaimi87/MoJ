var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;
	/**
	* @typedef SmartObjectOptions
	* @property {guid} id - The Id of the SmartObject
	* @property {string} name - The name of the SmartObject
	* @property {string} displayName - The display name of the SmartObject
	* @property {string} validationStatus - Validation status
	* @property {string} validationMessages - Validation messages, pipe separated.
	* @property {string="User"} subType - Sub type of the SmartObject
	* @property {string="simple"} mode - Simple or Advanced SmartObject
	* @property {string} description - Description for the SmartObject
	* @property {string="getList"} defaultListMethod - Name for the default list method for the SmartObject
	* @property {SourceCode.Forms.Types.SmartObjectProperties} objectProperties - Object properties collection of the SmartObject
	* @property {SourceCode.Forms.Types.SmartObjectMethods} methods - Methods collection of the SmartObject
	* @property {SourceCode.Forms.Types.SmartObjectAssociation} associations - Association collection of the SmartObject
	*/

	(function ()
	{
		var Types = SourceCode.Forms.Types;
		var Helper = SourceCode.Forms.TypeHelper;

		var definition =
		{
			id: "",
			name : "",
			displayName : "",
			validationStatus : "",
			validationMessages : "",
			itemType : "Object", // smo
			subType : "User", // Default to user smo
			mode : "simple",
			description : "",
			defaultListMethod: "getList"
		};

		/**
		* SmartObject type. It will create the default properties on instantiation, and accepts a paramter to override the defaults.
		* The properties and methods are SmartObjectProperties, SmartObjectMethods collection types, and are not just arrays, although
		* an array or generic object can be used for instantiation
		* @function
		* @param {SmartObjectOptions} options - The data from which the SmartObject will be built
		*/
		SourceCode.Forms.Types.SmartObject = function (options)
		{
			options = options || {};
			verifyRequiredValues(options);

			this.objectProperties = new Types.Collection({
				key: "name",
				name: "Properties",
				itemType: SourceCode.Forms.Types.SmartObjectProperty
			});

			this.methods = new Types.Collection({
				key: "name",
				name: "Methods",
				itemType: SourceCode.Forms.Types.SmartObjectMethod
			});

			this.associations = new Types.Collection({
				key: "name",
				name: "Associations",
				itemType: SourceCode.Forms.Types.SmartObjectAssociation
			});

			Helper.addToCollection("objectProperties", options, this);
			Helper.addToCollection("methods", options, this);
			Helper.addToCollection("associations", options, this);

			Helper.setObjProperties(this, definition, options);

			return this;
		};

		function verifyRequiredValues(options)
		{
			//Not implemented
		}


	})();
})();