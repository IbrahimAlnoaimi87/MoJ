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
		name: "",
		definitionId: null,
		sourceName: "",
		sourceDisplayName: "",
		sourceId: "",
		sourceType: null,
		subFormId: null,
		type: "user"
	};

	Types.Event = function (options)
	{
		verifyRequiredValues(options);

		this.handlers = new Types.Collection({
			key: "id",
			name: "Handlers",
			itemType: Types.Handler
		});

		Helper.addToCollection("handlers", options, this);

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

	$.extend(Types.Event.prototype, {
		toXml: function ()
		{
			var xml = "<Event " +
				"{{DefinitionID=definitionId}} " +
				"{{ID=id}} " +
				"{{SourceDisplayName=sourceDisplayName}} " +
				"{{SourceID=sourceDisplayName}} " +
				"{{SourceName=sourceName}} " +
				"{{SourceType=sourceType}} " +
				"{{Type=type}} " +
				"{{SubFormID=subFormId}} " +
				">";

			xml = mergeTokenizedStringWithModelPropertyValues(xml, this, true);

			xml += "<Name>{0}</Name>".format(this.name.xmlEncode());
			xml += this.handlers.toXml();
			xml += "</Event>";

			return xml;
		},
	});

})();
