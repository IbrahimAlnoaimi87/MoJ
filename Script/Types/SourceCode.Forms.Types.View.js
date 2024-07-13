var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	var definition =
	{
		name: "myView",
		displayName: "my view",
		id: "viewid",
		isUserModified: false,
		type: "Capture"
	};

	/**
	* @typedef View
	* @property {String} name
	* @property {String=} displayName - defaults to the name
	* @property {String} id
	* @property {Boolean=} isUserModified - defaults to false
	* @property {String=} type - defaults to "Capture"
	*
	*/

	/**
	* @class
	* @param {View} options - params for initializing the View
	* @returns {View}
	*/
	Types.View = function (options)
	{
		verifyRequiredValues(options);

		this.controls = new Types.Collection({
			key: "id",
			name: "Controls",
			itemType: Types.Control
		});

		//this.canvas = {
		//	sections: new Types.Collection({
		//		key: "id",
		//		name: "Sections",
		//		itemType: Types.Section
		//	})
		//};

		this.events = new Types.Collection({
			key: "id",
			name: "Events",
			itemType: Types.Event
		});

		if (typeof options === "string")
		{
			this.id = options;
			this.name = options;
			this.displayName = options;
		}
		else
		{
			// add the stuff that should go into collections, and remove from the options obj, so they aren't added by Helper.setObjProperties
			if (checkExists(options))
			{
				// just because I can, should I use this:
				//add("controls").from(options).to(this);
				//add("sections").from(options.canvas).to(this.canvas);

				//// instead of this:
				Helper.addToCollection("controls", options, this);
				//Helper.addToCollection("sections", options.canvas, this.canvas);
				Helper.addToCollection("events", options, this);
			}

			// TODO: add for styles, conditional styles etc...
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

	
	$.extend(Types.View.prototype, {

		/**
		* @returns {String} xml - xml representation of the view
		*/
		toXml: function ()
		{
			var xml = "<View ID='{0}' IsUserModified='{1}' Type='{2}'>"
				.format(this.id.xmlEncode(), this.isUserModified.toString().capitalizeFirstLetter().xmlEncode(), this.type.xmlEncode());
			xml += this.controls.toXml();
			//xml += this.canvas.sections.toXml();
			xml += this.events.toXml();
			xml += "</View>";

			return xml;
		},

		/**
		* @param {String} propertyName - name of the property for which to search
		* @param {String} propertyValue - value that the property must have
		*/
		findControlWithPropertyValue: function (propertyName, propertyValue)
		{
			var controlIds = this.controls.getKeys();

			for (var i = 0; i < controlIds.length; i++)
			{
				if (this.controls[controlIds[i]].properties[propertyName].value === propertyValue)
				{
					return this.controls[controlIds[i]];
				}
			}
		},

		/**
		* @param {String} propertyName - name of the property for which to search
		* @param {String} propertyValue - value that the property must have
		*/
		findAllControlsWithPropertyValue: function (propertyName, propertyValue)
		{
			var controls = [];

			this.controls.foreach(function (control)
			{
				if (control.properties[propertyName].value === propertyValue)
				{
					controls.push(control);
				}
			})

			return controls;
		}
	});

})();
