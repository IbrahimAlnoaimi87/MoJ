var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	var definition =
	{
		version: 14
	};

	/**
	* @typedef SmartForm
	* @property {int} version
	*
	*/

	/**
	* @class
	* @param {SmartForm} options - params for initializing the View
	* @returns {SmartForm}
	*/
	Types.SmartForm = function (options)
	{
		verifyRequiredValues(options);

		this.views = new Types.Collection({
			key: "id",
			name: "Views",
			itemType: Types.View
		});

		if (typeof options === "number")
		{
			this.version = options;
		}
		else
		{
			// add the stuff that should go into collections, and remove from the options obj, so they aren't added by Helper.setObjProperties
			if (checkExists(options))
			{
				Helper.addToCollection("views", options, this);
			}

			Helper.setObjProperties(this, definition, options);
		}

		return this;
	};

	function verifyRequiredValues(options)
	{
		if (false)
		{
			Helper.handlePropertyError({ message: "Error message about which property is missing" });
		}
	}


	$.extend(Types.SmartForm.prototype, {

		/**
		* @returns {String} xml - xml representation of the view
		*/
		toXml: function ()
		{
			var xml = "<SmartForm Version='{0}'>".format(this.version.toString());
			xml += this.views.toXml();
			xml += "</SmartForm>";

			return xml;
		}
	});

})();
