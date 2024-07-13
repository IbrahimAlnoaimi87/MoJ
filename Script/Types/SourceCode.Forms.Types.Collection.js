var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types;
	var Helper = SourceCode.Forms.TypeHelper;

	//var useProperties = Helper.getSettings().useProperties;

	var definition =
	{
		key: null,
		name: "Items",
		itemType: null // the constructor that will be called when adding items
	};

	/**
	* @typedef Collection_options
	* @property {String} key - key property name for the associative array. For exampel id.
	* @property {String} name - name of the collection. Used for xml generation
	* @property {Class} itemType - the type of the items that will be added
	*/

	/**
	* @param {Collection_options} options - object containing the init options
	*/
	Types.Collection = function (options)
	{
		this._settings = {};
		Helper.setObjProperties(this._settings, definition, options);
	}

	var lastUsedKeyValue = 0;

	function generateKey()
	{
		while(this.hasOwnProperty(key))
		{
			key++;
		}

		return key;
	}

	function verifyRequiredValues(options)
	{
		if (typeof options.itemType !== "function")
		{
			Helper.handlePropertyError({ message: "Error message about which property is missing" });
		}
	}

	$.extend(Types.Collection.prototype, {

		findByKey: function (id)
		{
			return this[id];
		},

		add: function (items)
		{
			if (Array.isArray(items))
			{
				this.addArray(items);
			}
			else
			{
				this.addSingle(items);
			}
		},

		addCollection: function (items)
		{
			var properties = Object.getOwnPropertyNames(items);
			properties.splice("_settings", 1); // remove the settings from the property name. It will have it if it was serialized from this

			for (var i = 0; i < properties.length; i++)
			{
				this.addSingle(items[properties[i]]);
			}
		},

		addArray: function (items)
		{
			for (var i = 0; i < items.length; i++)
			{
				this.addSingle(items[i]);
			}
		},

		addSingle: function (item)
		{
			var newItem;

			if (item instanceof this._settings.itemType)
			{
				newItem = item;
			}
			else
			{
				newItem = new this._settings.itemType(item);
			}

			var key = newItem[this._settings.key];

			this[key] = newItem;
		},

		remove: function (id)
		{
			delete this.items[id];
		},

		getKeys: function ()
		{
			var properties = Object.getOwnPropertyNames(this);
			properties.splice("_settings", 1); // remove the settings from the property name

			return properties;
		},

		toXml: function ()
		{
			var xml = "";
			var properties = this.getKeys();

			var name = this._settings.name.xmlEncode();

			if (properties.length > 0)
			{
				xml += "<{0}>".format(name);

				this.foreach(function (item)
				{
					xml += item.toXml();
				});

				xml += "</{0}>".format(name);
			}

			return xml;
		},

		toArray: function ()
		{
			var arr = [];
			var properties = this.getKeys();

			if (properties.length > 0)
			{
				for (var i = 0; i < properties.length; i++)
				{
					arr.push(this[properties[i]]);
				}
			}

			return arr;
		},

		foreach: function (fn, context)
		{
			if (typeof fn === "function")
			{
				var properties = this.getKeys();
				var useContext = checkExists(context);

				for (var i = 0; i < properties.length; i++)
				{
					if (useContext)
					{
						fn.apply(context, this[properties[i]]);
					}
					else
					{
						fn(this[properties[i]]);
					}
				}
			}
		}
	});

})();
