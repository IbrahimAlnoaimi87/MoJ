var SourceCode = SourceCode || {};
SourceCode.Forms = SourceCode.Forms || {};
SourceCode.Forms.Types = SourceCode.Forms.Types || {};

(function ()
{
	var Types = SourceCode.Forms.Types

	/**
	* Array of mappings objects
	*/
	Types.Mappings = function (options)
	{
		this.mappings = [];

		if (Array.isArray(options))
		{
			for(var i = 0; i < options.length; i++)
			{
				this.mappings.push(new Types.Mapping(options[i]));
			}
		}
		else
		{
			this.mappings.push(new Types.Mapping(options));
		}

		return this;
	}

	Types.Mappings.prototype.addMapping = function (mapping)
	{
		if(mapping instanceof Types.Mapping)	
		{
			this.mappings.push(mapping);
		}
		else
		{
			this.mappings.push(new Types.Mapping(mapping));
		}
	}

	/**
	* Takes a mappings/mapping xml document and returns a mappings object
	* @function
	* @param {xml} xmlDocument The xml document to convert to JSON objects
	*/
	Types.Mappings.prototype.fromMappingsXml = function(xmlDocument)
	{
		var mappings = xmlDocument.selectNodes("Mapping");

		for(var i = 0; i < mappings.length; i++)
		{
			var mapping = mappings[i];
			var contextNode = mapping.selectSingleNode("Item[@ContextType='context']");
			var targetNode = mapping.selectSingleNode("Item[@ContextType='target']");

			this.addMapping(new Types.Mapping({
				context: new Types.MappingContext().fromMappingContextXml(contextNode),
				target: new Types.MappingTarget().fromMappingTargetXml(targetNode)
			}));
		}

		return this;
	}

	Types.Mappings.prototype.getArray = function()
	{
		return this.mappings;
	}

	/**
	* Mapping constructor
	* @function
	* 
	*/
	Types.Mapping = function(mapping)
	{
		this.isSelected = false;

		if (mapping)
		{
			this.context = new Types.MappingContext(mapping.context);
			this.target = new Types.MappingTarget(mapping.target);
			this.isSelected = mapping.isSelected;
		}

		return this;
	}

	/**
	* Creates the mapping object from xml
	*/
	Types.Mapping.prototype.fromMappingXml = function(xmlDocument)
	{
		if (checkExists(xmlDocument))
		{
			this.context = {};
			this.target = {};
			this.isSelected = false;

			var contextNode = xmlDocument.selectSingleNode("Item[@ContextType='context']");
			var targetNode = xmlDocument.selectSingleNode("Item[@ContextType='target']");

			if (checkExists(contextNode))
			{
				this.context = new Types.MappingContext().fromMappingContextXml(contextNode);
			}

			if (checkExists(targetNode))
			{
				this.target = new Types.MappingTarget().fromMappingTargetXml(targetNode);
			}

			if (this.context || this.target)
			{
				return this;
			}
			else
			{
				return null;
			}
		}
		else
		{
			return null;
		}
	}

	/**
	* MappingTarget constructor
	* @function
	* 
	*/
	Types.MappingTarget = function(target)
	{
		target = target || {};
		this.guid = target.guid;
		this.contextType = "target";
		this.instanceId = target.instanceId || "00000000-0000-0000-0000-000000000000";
		this.itemType = target.itemType || "";
		this.subformId = target.subformId || "";
		this.targetPath = target.targetPath || "";
		this.validationStatus = target.validationStatus || "";
		this.validationMessages = target.validationMessages || "";

		return this;
	}

	/**
	* Convert from xml to the mappingTarget object
	* @function
	* @param {XmlDocument} xmlDocument XML document representing the mapping target
	*/
	Types.MappingTarget.prototype.fromMappingTargetXml = function (xmlDocument)
	{
		this.contextType = xmlDocument.getAttribute("ContextType");

		if(this.contextType !== "target")
		{
			throw "trying to create target with a context type that is not target: " + xmlDocument.xml;
		}

		this.guid = xmlDocument.getAttribute("Guid");
		this.instanceId = xmlDocument.getAttribute("InstanceID");
		this.itemType = xmlDocument.getAttribute("ItemType");
		this.subformId = xmlDocument.getAttribute("SubformID");
		this.targetPath = xmlDocument.getAttribute("TargetPath");
		this.validationStatus = xmlDocument.getAttribute("ValidationStatus");
		this.validationMessages = xmlDocument.getAttribute("ValidationMessages");

		return this;
	}

	/**
	* MappingContext constructor
	* @function
	* 
	*/
	Types.MappingContext = function(context)
	{
		context = context || {};
		this.guid = context.guid;
		this.contextType = "context";
		this.instanceId = context.instanceId || "00000000-0000-0000-0000-000000000000";
		this.itemType = context.itemType || "";
		this.subformId = context.subformId || "";
		this.validationStatus = context.validationStatus || "";
		this.validationMessages = context.validationMessages || "";

		return this;
	}


	/**
	* Convert from xml to the mappingContext object
	* @function
	* @param {XmlDocument} xmlDocument XML document representing the mapping target
	*/
	Types.MappingContext.prototype.fromMappingContextXml = function (xmlDocument)
	{
		this.contextType = xmlDocument.getAttribute("ContextType");

		if (this.contextType !== "context")
		{
			throw "trying to create context with a context type that is not context: " + xmlDocument.xml;
		}

		this.guid = xmlDocument.getAttribute("Guid");
		this.instanceId = xmlDocument.getAttribute("InstanceID");
		this.itemType = xmlDocument.getAttribute("ItemType");
		this.subformId = xmlDocument.getAttribute("SubformID");
		this.targetPath = xmlDocument.getAttribute("TargetPath");
		this.validationStatus = xmlDocument.getAttribute("ValidationStatus");
		this.validationMessages = xmlDocument.getAttribute("ValidationMessages");

		return this;
	}


})();