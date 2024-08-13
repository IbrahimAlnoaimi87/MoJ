var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;

	var definition =
	{
		name: "myProperty",
		value: "myval",
		displayValue: "my property value",
		nameValue: "my property name value"
	};

	/**
	* @typedef Property
	* @property {String} name
	* @property {String} displayName - defaults to the name
	* @property {String} value
	* @property {String} nameValue
	*/

	/**
	* @class
	* @param {Property} options - params for initializing the Property
	* @returns {Property}
	*/
	Types.Property = function (options)
	{
		verifyRequiredValues(options);

		SourceCode.Forms.TypeHelper.setObjProperties(this, definition, options);

		return this;
	}

	function verifyRequiredValues(options)
	{
		if (false)
		{
			Helper.handlePropertyError({ message: "Error message about which property is missing" });
		}
	}

	$.extend(Types.Property.prototype, {
		toXml: function ()
		{
			var xml = "<Property>";
			xml += "<Name>{0}</Name>".format(this.name.xmlEncode());
			xml += "<Value>{0}</Value>".format(this.value.xmlEncode());
			xml += "<DisplayValue>{0}</DisplayValue>".format(this.displayValue.xmlEncode());
			xml += "<NameValue>{0}</NameValue>".format(this.nameValue.xmlEncode());
			xml += "</Property>";

			return xml;
		}
	});

})();
