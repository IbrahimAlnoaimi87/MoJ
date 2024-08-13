var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	var definition = {
		sourceName: null,
		sourceId: null
	}

	Types.Result = function (options)
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
				 message:"source id bla"
			})
		}
	}

	$.extend(Types.Result.prototype, {
		toXml: function ()
		{
			var xml = "<Result SourceID='{0}' SourceName='{1}'/>".format(this.sourceId, this.sourceName);
			return xml;
		}

	});

})();