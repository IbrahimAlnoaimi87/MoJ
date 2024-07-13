var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	T = Types;

	var definition =
	{
		name: "myControl",
		displayName: "my control",
		id: "controlId",
		type: "",
		fieldId: null
	};

	function verifyRequiredValues(options)
	{
		if (false)
		{
			Helper.handlePropertyError({ message: "Error message about which property is missing" });
		}
	}

	/**
	* @typedef Control
	* @property {String} name
	* @property {String=} displayName - defaults to the name
	* @property {String} id
	* @property {String} type - Control Type
	* @property {String} fieldId - The id of the field the control is bound to, if it is bound
	*/

	/**
	* @class
	* @param {Control} options - params for initializing the Control
	* @returns {Control}
	*/
	Types.Control = function (options)
	{
		verifyRequiredValues(options);

		this.properties = new Types.Collection({
			key: "name",
			name: "Properties",
			itemType: Types.Property
		});

		if (typeof options === "string")
		{
			this.id = options;
			this.name = options;
			this.displayName = options;
		}
		else
		{
			Helper.addToCollection("properties", options, this);

			// TODO: add for styles, conditional styles etc...

			Helper.setObjProperties(this, definition, options);
		}

		//Helper.applyonChange(this, definition, function (prop) { console.log("set control: ", prop)});

		return this;
	}

	$.extend(Types.Control.prototype = {
		toXml: function ()
		{
			var xml = "<Control ID='{0}' Type='{1}'".format(this.id.xmlEncode(), this.type.xmlEncode());

			if (checkExists(this.fieldId))
			{
				xml += "FieldID='{0}'".format(this.fieldId.xmlEncode());
			}

			xml += "><Name>{0}</Name>".format(this.name.xmlEncode());
			xml += "<DisplayName>{0}</DisplayName>".format(this.displayName.xmlEncode());
			xml += this.properties.toXml();
			xml += "</Control>";

			return xml;
		},
	});

})();
