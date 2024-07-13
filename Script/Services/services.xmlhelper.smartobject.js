/* global SourceCode: true */
/* global parseXML: false */
/* global checkExistsNotEmpty: false */

(function ()
{
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Services === "undefined" || SourceCode.Forms.Services === null) SourceCode.Forms.Services = {};
	if (typeof SourceCode.Forms.Services.XmlHelper === "undefined" || SourceCode.Forms.Services.XmlHelper === null) SourceCode.Forms.Services.XmlHelper = {};

	/**
	* @class
	* Helper class to generate xml for smartobject in format used by SmartObject Designer (summary xml)
	*/

	function SmartObjectXmlHelper()
	{
		/**
		* @typedef SourceCode.Types.SmartObject
		* @property {guid} id - The Id of the SmartObject
		* @property {string} name - The name of the SmartObject
		* @property {string} displayName - The display name of the SmartObject
		* @property {string} validationStatus - Validation status
		* @property {string} validationMessages - Validation messages, pipe separated.
		* @property {string="User"} subType - Sub type of the SmartObject
		* @property {string="simple"} mode - Simple or Advanced SmartObject
		* @property {string} description - Description for the SmartObject
		* @property {string="getList"} defaultListMethod - Name for the default list method for the SmartObject
		* @property {SourceCode.Forms.Types.SmartObjectProperties} objectProperties - Object properties collection of the SmartObject
		* @property {SourceCode.Forms.Types.SmartObjectMethods} methods - Methods collection of the SmartObject
		* @property {SourceCode.Forms.Types.SmartObjectAssociation} associations - Association collection of the SmartObject
		*/

		/**
		* Will return a xml string representing the smart object
		* @function
		* @param {SourceCode.Types.SmartObject} smo
		*/
		this.getSmoDesignerXml = function (smo)
		{
			if (!checkExistsNotEmpty(smo))
			{
				return null;
			}

			var xml =
			'<SmartObject mode="{{mode}}" name="{{name}}">' +
				'<Dispname>{{displayName}}</Dispname>' +
				'<Desc>{{description}}</Desc>' +
				'<Props></Props>' +
				'<Assocs></Assocs>' +
				'<DefaultListMethod>{{defaultListMethod}}</DefaultListMethod>' +
			'</SmartObject>';

			//Non-collection smo properties:
			xml = replaceTokensInTemplate(xml, smo, true);

			//SMO Properties collection:
			xml = xml.replace("<Props></Props>", getObjectPropertiesDesignerXml(smo.objectProperties));

			//SMO Methods collection:
			//To be added when becomes needed

			//SMO Association collection:
			xml = xml.replace("<Assocs></Assocs>", getObjectAssociationsDesignerXml(smo.associations));
			return xml;
		};

		var getObjectPropertiesDesignerXml = function (properties)
		{
			var propXml = "";
			properties.foreach(function (property)
			{
				propXml += getObjectPropertyDesignerXml(property);
			})

			var xml = "";
			if (propXml !== "")
			{
				xml = '<Props>{0}</Props>'.format(propXml);
			}
			return xml;
		};

		var getObjectPropertyDesignerXml = function (property)
		{
			var propXml =
			'<Prop name="{{name}}">' +
				'<Dispname>{{displayName}}</Dispname>' +
				'<Desc>{{description}}</Desc>' +
				'<DisplayType>{{displayType}}</DisplayType>' +
				'<Type>{{type}}</Type>' +
				'<Key>{{isKey}}</Key>' +
				'<Smartbox>{{isSmartBox}}</Smartbox>' +
				'<Required>{{isRequired}}</Required>' +
				'<Unique>{{isUnique}}</Unique>' +
			'</Prop>';

			propXml = replaceTokensInTemplate(propXml, property, true);
			return propXml;
		};

		var getObjectAssociationsDesignerXml = function (associations)
		{
			var assocXml = "";
			associations.foreach(function (association)
			{
				assocXml += getObjectAssociationDesignerXml(association);
			})

			var xml = "";
			if (assocXml !== "")
			{
				xml = '<Assocs>{0}</Assocs>'.format(assocXml);
			}
			return xml;
		};

		var getObjectAssociationDesignerXml = function (association)
		{
			var assocXml =
			'<Assoc name="{{name}}">' +
				'<Dispname>{{displayName}}</Dispname>' +
				'<Desc>{{description}}</Desc>' +
				'<AssocType>{{associationType}}</AssocType>' +
				'<SoGuid>{{smoGuid}}</SoGuid>' +
				'<Props></Props>' +
			'</Assoc>';

			assocXml = replaceTokensInTemplate(assocXml, association, true);
			assocXml = assocXml.replace("<Props></Props>",
				getObjectAssociationPropertiesDesignerXml(association.associationProperties));
			return assocXml;
		};

		var getObjectAssociationPropertiesDesignerXml = function (properties)
		{
			var propXml = "";
			properties.foreach(function (property)
			{
				propXml += getObjectAssociationPropertyDesignerXml(property);
			})

			var xml = "";
			if (propXml !== "")
			{
				xml = '<Props>{0}</Props>'.format(propXml);
			}
			return xml;
		};

		var getObjectAssociationPropertyDesignerXml = function (property)
		{
			var propXml =
			'<Prop>' +
				'<Name>{{name}}</Name>' +
				'<Dispname>{{displayName}}</Dispname>' +
				'<Map>{{mapName}}</Map>' +
				'<MapDisplayName>{{mapDisplayName}}</MapDisplayName>' +
			'</Prop>';

			propXml = replaceTokensInTemplate(propXml, property, true);
			return propXml;
		};
	}

	SourceCode.Forms.Services.XmlHelper.SmartObject = new SmartObjectXmlHelper();

})();