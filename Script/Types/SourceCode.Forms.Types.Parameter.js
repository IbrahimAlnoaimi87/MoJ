var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	var definition = {
		sourceName: null,
		sourceDisplayName: null,
		sourceId: null,
		sourceSubFormId: null,
		sourceType: null,
		targetId: null,
		targetName: null,
		targetDisplayName: null,
		targetType: null
	}

	Types.Parameter = function (options)
	{
		verifyRequiredValues(options);

		Helper.setObjProperties(this, definition, options);

		return this;
	}

	function verifyRequiredValues(options)
	{
		if(!checkExists(options.sourceId))
		{
			Helper.handlePropertyError({
				message: "source id bla"
			});
		}
	}

	$.extend(Types.Parameter.prototype, {
		toXml: function ()
		{
			var xml = "<Parameter " +
				"{{SourceSubFormID=sourceSubFormId}} " +
				"{{SourceID=sourceId}} " +
				"{{SourceName=sourceName}} " +
				"{{SourceType=sourceType}} " +
				"{{SourceDisplayName=sourceDisplayName}} " +
				"{{TargetID=targetId}} " +
				"{{TargetName=targetName}} " +
				"{{TargetDisplayName=targetDisplayName}} " +
				"{{TargetType=targetType}} " +
				"/>";

			xml = mergeTokenizedStringWithModelPropertyValues(xml, this, true);

			return xml;
		}
	});
})();