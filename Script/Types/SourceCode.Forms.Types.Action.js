var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	var definition =
	{
		id: null,
		definitionId: null,
		executionType: "Synchronous",
		type: "Calculate"
	};

	/**
	* @typedef Action
	* @property {String} definitionId
	* @property {String} id
	* @property {String=} executionType - defaults to Synchronous
	* @property {String=} type - defaults to "Capture"
	*
	*/

	/**
	* @class
	* @param {Action} options - params for initializing the View
	* @returns {Action}
	*/
	Types.Action = function (options)
	{
		verifyRequiredValues(options);

		this.properties = new Types.Collection({
			key: "name",
			name: "Properties",
			itemType: Types.Property
		});

		this.parameters = new Types.Collection({
			name: "Parameters",
			itemType: Types.Parameter,
			key: "sourceId"
		})

		Helper.addToCollection("properties", options, this);
		Helper.addToCollection("parameters", options, this);

		Helper.setObjProperties(this, definition, options);

		return this;
	}

	function verifyRequiredValues(options)
	{
		if (false)
		{
			Helper.handlePropertyError({ message: "Error message about which property is missing" });
		}
	}

	$.extend(Types.Action.prototype, {
		toXml: function ()
		{
			var xml = "<Action DefinitionID='{0}' ExecutionType='{1}' ID='{2}' Type='{3}'>"
				.format(this.definitionId, this.executionType, this.id, this.type);
			xml += this.properties.toXml();
			xml += this.parameters.toXml();
			xml += "</Action>";

			return xml;
		}
	});

})();
