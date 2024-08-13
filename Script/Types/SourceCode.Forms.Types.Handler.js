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
		definitionId: null
	};

	Types.Handler = function (options)
	{
		verifyRequiredValues(options);

		this.actions = new Types.Collection({
			key: "id",
			name: "Actions",
			itemType: Types.Action
		});

		Helper.addToCollection("actions", options, this);

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

	$.extend(Types.Handler.prototype, {
		toXml: function ()
		{
			var xml = "<Handler DefinitionID='{0}' ID='{1}'>".format(this.definitionId.xmlEncode(), this.id.xmlEncode());
			xml += this.actions.toXml();
			xml += "</Handler>";

			return xml;
		},
	});

})();
