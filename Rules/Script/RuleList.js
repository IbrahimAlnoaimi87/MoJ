if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Designers.Form === "undefined" || SourceCode.Forms.Designers.Form === null) SourceCode.Forms.Designers.Form = {};

var _formDesigner = SourceCode.Forms.Designers.Form;

SourceCode.Forms.RuleList = new function ()
{
	this.formTypeArray = [Resources.Wizard.FormText, Resources.Wizard.ViewText, Resources.FormDesigner.Control, Resources.CommonLabels.UnboundText, Resources.CommonLabels.ExtendedText, Resources.CommonLabels.SubformText, Resources.CommonLabels.SubviewText];
	this.ruleListType = "RuleList";
	this._initialized = false;

	//Constructor
	this.init = function ()
	{
		var container = this._getRulesListContainer();
		if (container.length != 0)
		{
			var existingContent = container.find(".rules-list-content");
			if (existingContent.length == 0)
			{
				var template = "<div class='lyt-rules-list'> \
								<div class='rules-list-gutter'></div> \
								<div class='rules-list-content'> \
									<div class='scroll-wrapper'> \
										<div class='rules-list-container'></div> \
									</div> \
								</div> \
							</div> \
							";
				container.prepend($(template));
			}
		}
	}

	this._isInitialized = function ()
	{
		var container = this._getRulesListContainer();
		return container.find(".rules-list-content").length > 0;
	}

	this.getSelectedID = function (pRuleList)
	{
		var rulescontainer = this._getRulesContainer($(pRuleList));
		var element = rulescontainer.find(".radiobox > ul > li > label.radiobox-button.checked");
		var id = $(element).attr("id");
		return id;
	};
	
	//Gets the cell where the rule list will be inserted
	this._getRulesListContainer = function () {
		return $("#pgRuleList").find(".grid-content-cell-wrapper").eq(0);
	}

	//Gets the container for the lists of rule items.
	//optional parameter for container list
	this._getRulesContainer = function (jqRuleList) {
		if (!jqRuleList)
		{
			jqRuleList = $("#pgRuleList");
		}
		return jqRuleList.find(".rules-list-container").eq(0);
	}

	this.refreshRule = function (options)
	{
		var rulesListElement, definitionXml, eventID;
		var validArguments = true;

		if (checkExists(options))
		{
			if (checkExists(options.rulesListElement) && options.rulesListElement.length > 0)
			{
				rulesListElement = options.rulesListElement;
			}
			else
			{
				validArguments = false;
			}
			if (checkExists(options.definitionXml))
			{
				definitionXml = options.definitionXml;
			}
			else
			{
				validArguments = false;
			}
			if (checkExistsNotEmpty(options.eventID))
			{
				eventID = options.eventID;
			}
			else
			{
				validArguments = false;
			}
		}
		else
		{
			validArguments = false;
		}

		if (!validArguments)
		{
			return false;
		}

		var xpath = "//Events/Event[@Type='User'][@ID='{0}']".format(eventID);
		var eventNode = definitionXml.selectSingleNode(xpath);

		var contextNode = definitionXml.documentElement.selectSingleNode("/*/*/*");
		var contextNodeName = contextNode.nodeName;
		var ruleDataArray = [];

		this._getEventInfo({
			eventNode: eventNode,
			contextNodeName: contextNodeName,
			ruleDataArray: ruleDataArray
		});
		var rulescontainer = this._getRulesContainer();
		
		var label = rulescontainer.find(".radiobox > ul > li > #{0}".format(eventID));;
		var wasSelected = label.hasClass("checked");
		var radioButton = label.closest("ul");
		
		var parentSection = radioButton.closest(".categorySectionsList");
		var ruleid = "#" + parentSection.attr("id");
		this.createRadioboxButton(ruleDataArray[0], radioButton, rulescontainer, ruleid);
		
        var newLabel = rulescontainer.find(".radiobox > ul > li > #{0}".format(eventID)).filter(function () {
            // Filtering out the original radiobutton to get the newly created / refreshed one
            return $(this).get(0) !== label.get(0);
        });
		label.replaceWith(newLabel);

		if (wasSelected)
		{
			radioboxElement = newLabel.find("input[type='radio']");
			radioboxElement.radioboxbutton().radioboxbutton("check");
		}

		SourceCode.Forms.Designers.Common.applyErrorBadgesToEvent(eventNode);

		return true;
	};

	this._getFilterLookup = function (filterText)
	{
		if (!checkExistsNotEmpty(filterText))
		{
			return { all: true, extended: false };
		}
		var lowerFilterText = filterText.toLowerCase();
		var filterArray = lowerFilterText.split("|");
		var filterLookup = {};

		for (var s = 0; s < filterArray.length; s++)
		{
			var filterText = filterArray[s];
			filterLookup[filterText] = true;
		}

		if (filterArray.none)
		{
			filterLookup =  {};
		}
		else if (filterArray.all)
		{
			allFilterLookup.view = true;
			allFilterLookup.form = true;
			allFilterLookup.control = true;
			allFilterLookup.subview = true;
			allFilterLookup.subform = true;
			allFilterLookup.unbound = true;
		}
		return filterLookup;
	};

	this._matchesSearchAndFilter = function (options)
	{
		var currentContext = options.currentContext;
		var sourceType = options.sourceType;
		var isExtended = options.isExtended;
		var isReference = options.isReference;
		var isControl = options.isControl;
		var location = options.location;
		var ruleName = options.ruleName;
		var searchText = options.searchText;
		var filterLookup = options.filterLookup;

		var searchLocation = (options.sourceType !== "extended") ? options.sourceType : options.location;

		var rulenameContainsSearchValue = ruleName.contains(searchText);
		var matchesSearchAndFilter = false;

		if (rulenameContainsSearchValue)
		{
			var filterContainsCurrentLevel = (filterLookup.all || filterLookup[currentContext]);

			if (filterLookup.extended && !isExtended && isReference)
			{
				// see the following link for information on extended filtering
				// filterLookup.extended indicates we need to apply a filter to return only events that are extended
				// https://d.docs.live.net/8401cefa07c3af2f/Documents/SmartForms/SmartForms%20Wiki/Rules%20Designer.one#Events&section-id={9D73AE4D-7FC2-4C14-B2F5-5309CBD2D490}&page-id={35B8C837-242E-42C4-9BFA-804B4A129EB5}&end
				//first check extended
				matchesSearchAndFilter = false;
			}
			else if (filterLookup.all)
			{
				//if all is true everything other than extended should come through
				matchesSearchAndFilter = true;
			}
			else if (!filterContainsCurrentLevel && (searchLocation === currentContext))
			{
				matchesSearchAndFilter = false;
			}
			else if ((isControl && !filterLookup.control) ||
					(!filterLookup[searchLocation]&& (searchLocation !== currentContext || !isControl)))
			{
				matchesSearchAndFilter = false;
			}
			else
			{
				matchesSearchAndFilter = true;
			}
			//console.log("ruleName: {0} result:{1} location:{2} sourceType:{3}".format(ruleName, matchesSearchAndFilter, options.location, options.sourceType))
		}
		
		return matchesSearchAndFilter;
	};

	this._getEventInfo =function (options)
	{
		var _eventNode, _contextNodeName, _ruleData, _isView, searchText, filterLookup, _unboundArray;
		var validArguments = true;

		if (checkExists(options))
		{
			if (checkExists(options.eventNode))
			{
				_eventNode = options.eventNode;
			}
			else
			{
				validArguments = false;
			}
			if (checkExistsNotEmpty(options.contextNodeName))
			{
				_contextNodeName = options.contextNodeName;
			}
			else
			{
				validArguments = false;
			}
			if (checkExists(options.ruleDataArray))
			{
				_ruleData = options.ruleDataArray;
			}
			else
			{
				validArguments = false;
			}

			_unboundArray = (checkExists(options.unboundArray)) ? options.unboundArray : [];
			_isView = (checkExists(options.isView)) ? options.isView : false;
			searchText = (checkExists(options.searchText)) ? options.searchText : "";
			filterLookup = (checkExistsNotEmpty(options.filterLookup)) ? options.filterLookup : this._getFilterLookup();
		}
		if (!validArguments)
		{
			return false;
		}
		var _locationIcon = this.getEventContext(_eventNode, _contextNodeName);
		var _sourceType = this.getSourceType(_eventNode, _contextNodeName);
		var _sType = _eventNode.getAttribute("SourceType");
		var _isControl = false;
		var _isExtended = false;
		var _isReference = false;
		var _instanceId = _eventNode.getAttribute("InstanceID");
		var _subformId = _eventNode.getAttribute("SubFormID");
		var _sourceTypeParts = _sourceType.split("-");
		var ruleIsInvalid = false;
		var _icon = "";

		if (!checkExists(_instanceId))
		{
			_instanceId = "";
		}

		if (!checkExistsNotEmpty(_subformId))
		{
			_subformId = "";
		}

		_isExtended = this.isExtended(_eventNode);

		_isReference = _eventNode.getAttribute("IsReference");
		_isReference = (checkExists(_isReference) && _isReference.toLowerCase() === "true");

		if (_sourceTypeParts[0] === "Unbound")
		{
			_sourceType = "Unbound";
			_unboundArray.push({
				instanceid: _instanceId,
				subformid: _subformId,
				locationtype: _sourceType
			});
		}
		else if (_sourceTypeParts[0] === "Extended")
		{
			_sourceType = "Extended";
		}

		if (_sourceType === "ViewParameter")
		{
			_sourceType = "View";
		}
		else if (_sourceType === "FormParameter")
		{
			_sourceType = "Form";
		}

		if (_sType.toLowerCase() === "control")
		{
			_isControl = true;
		}
		var _propertiesNode = _eventNode.selectSingleNode('Properties');
		
		if (!!_propertiesNode)
		{
			var _ruleNameValueNode = _propertiesNode.selectSingleNode('Property[Name="RuleFriendlyName"]/Value');

			if (!checkExistsNotEmpty(_ruleNameValueNode))
			{
				_ruleNameValueNode = _propertiesNode.selectSingleNode('Property[Name="RuleName"]/Value');
			}

			var _locationValueNode = _propertiesNode.selectSingleNode('Property[Name="Location"]/Value');
			var _descriptionValueNode = _propertiesNode.selectSingleNode('Property[Name="RuleDescription"]/Value');
			var _descriptionValue = "";
			
			if (checkExistsNotEmpty(_descriptionValueNode))
			{
				_descriptionValue = _descriptionValueNode.text;
			}

			if (!checkExistsNotEmpty(_ruleNameValueNode) || !checkExistsNotEmpty(_locationValueNode))
			{
				return false;
			}

			var _selectedEventIsEnabled = _eventNode.getAttribute("IsEnabled");
			var _isEnabled = 'inactive';
			var _unboundContextValue = "";
			var _contextValue = "";
			var _sourceTypeValue = "";
			var _locationValue = "";

			if (checkExistsNotEmpty(_locationIcon))
			{
				_locationValue = _locationIcon.toLowerCase();
			}

			if (checkExistsNotEmpty(_sourceType))
			{
				_sourceTypeValue = _sourceType.toLowerCase();
			}

			if (checkExistsNotEmpty(_contextNodeName))
			{
				_contextValue = _contextNodeName.toLowerCase();
			}

			if (checkExistsNotEmpty(_sourceTypeParts[1]))
			{
				_unboundContextValue = _sourceTypeParts[1].toLowerCase();
			}

			switch (_sourceTypeValue)
			{
				case "unbound":
					if (_isExtended === true)
					{
						_icon = _sourceTypeValue + "-" + _contextValue + "-event";

					}
					else
					{
						_icon = _sourceTypeValue + "-" + _unboundContextValue + "-event";
					}
					break;
				case "extended":
					if (((_locationValue !== "subform") && (_locationValue !== "subview")) || _isView)
					{
						_icon = _contextValue + "-event";
					}
					else
					{
						_icon = _locationValue + "-event";
					}
					break;
				default:
					if (_sourceTypeValue === "control")
					{
						_icon = _locationValue + "-event";
						_isControl = true;
					}
					else if ((_isReference === false) &&
						((_contextValue === "form" && ((_sourceTypeValue === "view") || (_sourceTypeValue === "subview") || (_sourceTypeValue === "subform"))) 
						|| (_contextValue === "view" && ((_sourceTypeValue === "subview") || (_sourceTypeValue === "subform")))))
					{
						_icon = _contextValue + "-event";
					}
					else
					{
						_icon = _sourceTypeValue + "-event";
					}
			}

			ruleIsInvalid = SourceCode.Forms.Designers.Common.Rules.checkRuleValid(_eventNode);
			if (ruleIsInvalid === true)
			{
				_icon += "-error";
			}

			if (_selectedEventIsEnabled === "True" || !checkExistsNotEmpty(_selectedEventIsEnabled))
			{
				_isEnabled = '';
			}
			else
			{
				if ((ruleIsInvalid === false) || _selectedEventIsEnabled === "False")
				{
					_icon += ' disabled-rule';
				}
			}

			var _ruleNameValue = "";
			var _searchTextValue = "";

			if (checkExistsNotEmpty(_ruleNameValueNode.text))
			{
				_ruleNameValue = _ruleNameValueNode.text.toLowerCase();
			}

			if (checkExistsNotEmpty(searchText))
			{
				_searchTextValue = searchText.toLowerCase();
			}

			var matchesSearchAndFilter = this._matchesSearchAndFilter(
			{
				currentContext: _contextValue,
				sourceType: _sourceTypeValue,
				ruleName: _ruleNameValue,
				searchText: _searchTextValue,
				filterLookup: filterLookup,
				isExtended: _isExtended,
				isReference: _isReference,
				isControl: _isControl,
				location: _locationValue
			});

			if (!matchesSearchAndFilter)
			{
				return;
			}

			_eventID = _eventNode.getAttribute("ID");
			var _ruleLocation;
			if (checkExistsNotEmpty(_locationValueNode))
			{
				_ruleLocation = _locationValueNode.text;
			}
			else
			{
				_ruleLocation = "";
			}
				
			var _locationNew = _locationIcon.charAt(0).toUpperCase() + _locationIcon.substr(1).toLowerCase();

			var ruleData =
			{
				locationname: _ruleLocation,
				locationtype: _locationNew,
				rulevalue: _ruleNameValueNode.text,
				icon: _icon,
				eventid: _eventID,
				isenabled: _selectedEventIsEnabled,
				isreference: _isReference,
				descriptionvalue: _descriptionValue,
				iscontrol: _isControl,
				instanceid: _instanceId,
				subformid: _subformId,
				ruleisinvalid: ruleIsInvalid
			};

			if (_isExtended === true)
			{
				ruleData.icon = this.setExtended(ruleData.icon);
			}

			_ruleData.push(ruleData);
		}
		return true;
	};

	//refresh
	this.refresh = function (pRuleList, pDefinitionXml, pOptions, searchText, filter)
	{
		if(!this._isInitialized()) this.init();
		$("input[type=checkbox][name=RulesFilterSearchScope]").checkbox();

		var _controlID, _stateID, _viewID, _instanceID, _contextNodeName;

		var filterText = filter;

		if (checkExists(pOptions))
		{
			if (pOptions.controlID !== undefined) _controlID = pOptions.controlID;
			if (pOptions.stateID !== undefined) _stateID = pOptions.stateID;
			if (pOptions.viewID !== undefined) _viewID = pOptions.viewID;
			if (pOptions.instanceID !== undefined) _instanceID = pOptions.instanceID;
		}

		var _xPath = "Events/Event[@Type='User']";
		var _contextNode = pDefinitionXml.documentElement.selectSingleNode("/*/*/*");
		var _isView = true;

		_contextNodeName = _contextNode.nodeName;
		_contextNodeDisplayName = _contextNode.selectSingleNode("DisplayName");

		if (_contextNodeName === 'Form')
		{
			_isView = false;
			if (_stateID !== undefined)
			{
				_xPath = "States/State[@ID='" + _stateID + "']/" + _xPath;
			}
			else
			{
				_xPath = "States/State[@IsBase='True']/" + _xPath;
			}

			if (!!_instanceID && _instanceID !== null && _instanceID !== "")
			{
				_xPath += "[@InstanceID='" + _instanceID + "']";
			}
			else if (!!_controlID && _controlID !== "")
			{
				_xPath += "[@SourceID='" + _controlID + "'][@SourceType='Control'][not(@SubFormID)]";
			}
		}
		else if (_controlID !== undefined)
		{
			_xPath += "[@SourceID='" + _controlID + "'][@SourceType='Control'][not(@SubFormID)]";
		}

		var _eventNodes = _contextNode.selectNodes(_xPath);
		var i = 0;
		var _ruleData = [];
		var _unboundArray = [];
		var _locations = [];
		var _locationsSorted = [];
		var _filters = [];
		var _expandedElements = [];
		var _collapsedElements = [];
		var _eventID;
		var rulescontainer = this._getRulesContainer();
		var gridCell = this._getRulesListContainer();
		var html = "";

		var radioboxcategories = rulescontainer.find(".categorySectionsList");
		var z = 0;
		var y = 0;

		radioboxcategories.each(function (_this)
		{
			var expanded = false;
			var collapsed = false;
			var thisexpander = $(this).children(".section-expander");
			var categoryheading = $(this).children(".categorySectionsHeading");
			var categoryname = categoryheading.text();
			if (thisexpander.hasClass("expanded"))
			{
				expanded = true;
				if ($.inArray(categoryname, _expandedElements) < 0)
				{
					_expandedElements[z] = categoryname;
					z++;
				}

			}
			else if (thisexpander.hasClass("collapsed"))
			{
				collapsed = true;
				if ($.inArray(categoryname, _expandedElements) < 0)
				{
					_collapsedElements[y] = categoryname;
					y++;
				}

			}
		}, [this]);

		//remove the existing rules sections from the grid.
		rulescontainer.children().remove();

		//remove the initial "Add Rule" button provided by the grid control.
		gridCell.children(":not(.lyt-rules-list)").remove();

		var filterLookup = this._getFilterLookup(filterText);

		while (i < _eventNodes.length)
		{
			var _eventNode = _eventNodes[i];
			
			this._getEventInfo({
				eventNode:_eventNode,
				contextNodeName: _contextNodeName,
				ruleDataArray: _ruleData,
				searchText: searchText,
				filterLookup: filterLookup,
				isView: _isView,
				unboundArray: _unboundArray
			});
			i++;
		}

		var _locationData = [];
		for (var u = 0; u < _ruleData.length; u++)
		{
			var key = _ruleData[u].instanceid + "_" + _ruleData[u].subformid;
			if (_locationData.indexOf(key) === -1)
			{
				_locationData.push(key);
			}
		}
		var _locations = this.getLocationData(_ruleData, _locationData, _unboundArray);

		for (var k = 0; k < _locations.length; k++)
		{
			var cid = "RulePanelbox_Category" + k;
			var ruleid = "#" + cid;
			var typevalue = this.convertType(_locations[k].locationtype);
			var $div = $("<div></div>").attr("id", cid).addClass("categorySectionsList");
			//var textContentTemplate = "{0} ({1})";
			//var $span = $("<span></span>").addClass("categorySectionsHeading rules-section");
			var textContentTemplate = "\
				<span class='categorySectionsHeading rules-section'> \
					<span class='section-icon {2}' title='{1}'></span>\
					<span class='section-label'>{0}</span>\
				</span>";

			var textContent = textContentTemplate.format(
				_locations[k].locationname.htmlEncode(),
				typevalue,
				this._getIconClassForRulesListSection(typevalue));
			var $span = $(textContent);
			$div.append($span);
			$div.append(SCRadioboxbutton.html(
				{
					id: "",
					categoryid: cid,
					collapsed: false,
					buttonssize: "small",
					category: _locations[k].locationtype,
					name: _locations[k].locationname
				})
			);
			rulescontainer.append($div);

			if (!filterLookup.none)
			{
				var element = rulescontainer.find(ruleid + "> .radiobox > ul").radioboxbutton();

				for (var l = 0; l < _ruleData.length; l++)
				{
					if ((_locations[k].instanceid === _ruleData[l].instanceid) && (_locations[k].subformid === _ruleData[l].subformid) && (_locations[k].locationtype === _ruleData[l].locationtype))
					{
						this.createRadioboxButton(_ruleData[l], element, rulescontainer, ruleid);
					}
				}

				var radiobox = element.parent();
				var container = radiobox.parent();
				var expander = container.children(".section-expander").eq(0);
				var categoryheading = container.children(".categorySectionsHeading").eq(0);
				var categoryname = categoryheading.text();
				var controlelement = element.find(".control");
				var extendedelement = element.find(".extended");

				if ($.inArray(categoryname, _expandedElements) !== -1)
				{
					if (!expander.hasClass("expanded"))
					{
						expander.addClass("expanded");
					}
				}
				else if ($.inArray(categoryname, _collapsedElements) !== -1)
				{
					if (!expander.hasClass("collapsed"))
					{
						expander.addClass("collapsed");
					}
				}

				if (checkExistsNotEmpty(searchText))
				{
					if (!expander.hasClass("expanded"))
					{
						if (expander.hasClass("collapsed"))
						{
							expander.removeClass("collapsed");
						}

						expander.addClass("expanded");
					}
				}

				if ((_locations[k].locationtype !== "Form") && (_locations[k].locationtype !== "View"))
				{
					if (expander.hasClass("expanded"))
					{
						this.expand(expander, radiobox);
					}
					else
					{
						this.collapse(expander, radiobox);
					}
				}
				else
				{
					if (!expander.hasClass("collapsed"))
					{
						this.expand(expander, radiobox);
					}
					else
					{
						this.collapse(expander, radiobox);
					}
				}
			}
		}
		rulescontainer.append("<div id=\"rgAddRule\" class=\"rules-add-button\">" + Resources.ViewDesigner.RulesGridActionRowText + "</div>");
		this.addExpanders(rulescontainer, this);

		for (var k = 0; k < _filters.length; k++)
		{
			for (var l = k + 1; l < _filters.length;)
			{
				if (_filters[k] == _filters[l] && _filters[s] == _filters[l])
				{
					_filters.splice(l, 1);
				}
				else
				{
					l++;
				}
			}
		}

		if (searchText !== "")
		{
			rulescontainer.find("li").highlightText(searchText);
		}

		SourceCode.Forms.Designers.Common.applyErrorBadgesToEvents();
	}

	//return the icon class for a section group in the rules list.
	this._getIconClassForRulesListSection = function (sectionType) {
		var iconClass = "";
		var standardClasses = "icon icon-size16 ";
		switch (sectionType.toLowerCase()) {
			case "view": iconClass = standardClasses + "ic-view"; break;
			case "form": iconClass = standardClasses + "ic-form"; break;
			case "subform": iconClass = standardClasses + "ic-form ic-subform"; break;
			case "subview": iconClass = standardClasses + "ic-view ic-subview"; break;
		}

		return iconClass;
	}

	this.setExtended = function (_icon)
	{
		var _iconClasses = _icon.split(" ");
		if (_iconClasses[1] !== "disabled-rule")
		{
			_icon = _icon + "-extended";
		}
		else
		{
			_iconClasses[0] = _iconClasses[0] + "-extended";
			_icon = _iconClasses[0] + " " + _iconClasses[1];
		}
		return _icon;
	}

	this.createRadioboxButton = function (ruledata, element, rulescontainer, ruleid)
	{
		var ruleId = ruledata.eventid;
		var enabled = ruledata.isenabled;
		var ruledescription = ruledata.descriptionvalue;
		var iscontrol = ruledata.iscontrol;
		if (checkExistsNotEmpty(ruledata.descriptionvalue))
		{
			ruledescription = ruledata.descriptionvalue;
		}
		else
		{
			ruledescription = ruledata.rulevalue;
		}

		if (!checkExistsNotEmpty(iscontrol))
		{
			iscontrol = false;
		}

		if ((enabled === "") || (enabled === null) || (enabled === "True"))
		{
			enabled = "True";
		}
		else
		{
			enabled = "False";
		}

		element.radioboxbutton("add", {
			id: ruleId,
			rule: ruledata.rulevalue,
			description: ruledescription,
			value: ruleId,
			checked: false,
			name: "radioboxelement",
			enabled: "True",
			ruleDisabled: (enabled == "False"),
			icon: ruledata.icon,
			extended:
			ruledata.isreference,
			control: iscontrol
		});
		if (ruledata.ruleisinvalid === true)
		{
			var sectionexpander = rulescontainer.find(ruleid + "> .section-expander");
			sectionexpander.addClass("expanded");
		}
	}

	this.getLocationData = function (ruledata, locationdata, unbounditems)
	{
		var locationssorted = [];
		var locations = [];
		var locationexists = [];
		var unboundlocationexists = [];
		
		for (j = 0; j < locationdata.length; j++)
		{
			var ids = locationdata[j].split("_");
			var instance_id, subform_id;
			if (checkExistsNotEmpty(ids[0]))
			{
				instance_id = ids[0];
			}
			else
			{
				instance_id = "";
			}
			if (checkExistsNotEmpty(ids[1]))
			{
				subform_id = ids[1];
			}
			else
			{
				subform_id = "";
			}
			for (u = 0; u < ruledata.length; u++)
			{
				if ((ruledata[u].instanceid === instance_id) && (ruledata[u].subformid === subform_id))
				{
					var key = locationdata[j]; 
					if ((locationexists.indexOf(key) === -1) && (ruledata[u].locationtype !== "Unbound"))
					{
						locations.push({
							instanceid: instance_id,
							subformid: subform_id,
							locationname: ruledata[u].locationname,
							locationtype: ruledata[u].locationtype
						});
						locationexists.push(key);
					}
					else
					{
						if ((unboundlocationexists.indexOf(key) === -1) && (ruledata[u].locationtype === "Unbound"))
						{
							var unboundmatch = false;
							for (n = 0; n < unbounditems.length; n++)
							{
								if ((ruledata[u].instanceid === unbounditems[n].instanceid) && (ruledata[u].subformid === unbounditems[n].subformid))
								{
									unboundmatch = true;
									locations.push({
										instanceid: instance_id,
										subformid: subform_id,
										locationname: ruledata[u].locationname,
										locationtype: unbounditems[n].locationtype
									});
									unboundlocationexists.push(key);
									break;
								}
							}
							if (unboundmatch === false)
							{
								break;
							}
						}
						else
						{
							continue;
						}
					}
				}
			}
			
		}

		locationssorted = this.sortLocations(locations);

		return locationssorted;
	}

	this.sortLocations = function (locations)
	{
		var viewlocations = [];
		var formlocations = [];
		var subviewlocations = [];
		var subformlocations = [];
		var unboundlocations = [];
		var locationssorted = [];

		for (i = 0; i < locations.length; i++)
		{
			switch (locations[i].locationtype.toLowerCase())
			{
				case "view":
					viewlocations.push({
						instanceid: locations[i].instanceid,
						subformid: locations[i].subformid,
						locationname: locations[i].locationname,
						locationtype: locations[i].locationtype
					});
					break;
				case "form":
					formlocations.push({
						instanceid: locations[i].instanceid,
						subformid: locations[i].subformid,
						locationname: locations[i].locationname,
						locationtype: locations[i].locationtype
					});
					break;
				case "subview":
					subviewlocations.push({
						instanceid: locations[i].instanceid,
						subformid: locations[i].subformid,
						locationname: locations[i].locationname,
						locationtype: locations[i].locationtype
					});
					break;
				case "subform":
					subformlocations.push({
						instanceid: locations[i].instanceid,
						subformid: locations[i].subformid,
						locationname: locations[i].locationname,
						locationtype: locations[i].locationtype
					});
					break;
				case "unbound":
					unboundlocations.push({
						instanceid: locations[i].instanceid,
						subformid: locations[i].subformid,
						locationname: locations[i].locationname,
						locationtype: locations[i].locationtype
					});
					break;
			}
		}

		if (formlocations.length > 0)
		{
			for (var s = 0; s < formlocations.length; s++)
			{
				locationssorted.push({
					instanceid: formlocations[s].instanceid,
					subformid: formlocations[s].subformid,
					locationname: formlocations[s].locationname,
					locationtype: formlocations[s].locationtype
				});
			}
		}

		if (viewlocations.length > 0)
		{
			for (var t = 0; t < viewlocations.length; t++)
			{
				locationssorted.push({
					instanceid: viewlocations[t].instanceid,
					subformid: viewlocations[t].subformid,
					locationname: viewlocations[t].locationname,
					locationtype: viewlocations[t].locationtype
				});
			}
		}

		if (unboundlocations.length > 0)
		{
			for (var u = 0; u < unboundlocations.length; u++)
			{
				locationssorted.push({
					instanceid: unboundlocations[u].instanceid,
					subformid: unboundlocations[u].subformid,
					locationname: unboundlocations[u].locationname,
					locationtype: unboundlocations[u].locationtype
				});
			}
		}

		if (subformlocations.length > 0)
		{
			for (var v = 0; v < subformlocations.length; v++)
			{
				locationssorted.push({
					instanceid: subformlocations[v].instanceid,
					subformid: subformlocations[v].subformid,
					locationname: subformlocations[v].locationname,
					locationtype: subformlocations[v].locationtype
				});
			}
		}

		if (subviewlocations.length > 0)
		{
			for (var w = 0; w < subviewlocations.length; w++)
			{
				locationssorted.push({
					instanceid: subviewlocations[w].instanceid,
					subformid: subviewlocations[w].subformid,
					locationname: subviewlocations[w].locationname,
					locationtype: subviewlocations[w].locationtype
				});
			}
		}
		return locationssorted;
	}

	this.setRuleData = function (rData, locationname, rulevalue, locationtype, icon, eventid, isenabled, isreference, descriptionvalue, iscontrol, instanceid, subformid, ruleisinvalid)
	{
		rData.push({
			locationname: locationname,
			rulevalue: rulevalue,
			locationtype: locationtype,
			icon: icon,
			eventid: eventid,
			isenabled: isenabled,
			isreference: isreference,
			descriptionvalue: descriptionvalue,
			iscontrol: iscontrol,
			instanceid: instanceid,
			subformid: subformid,
			ruleisinvalid: ruleisinvalid
		});
	}

	this.convertType = function (type)
	{
		switch (type)
		{
			case "Form":
				type = Resources.Wizard.FormText;
				break;
			case "View":
				type = Resources.Wizard.ViewText;
				break;
			case "Control":
				type = Resources.FormDesigner.Control;
				break;
			case "Unbound":
				type = Resources.CommonLabels.UnboundText;
				break;
			case "Extended":
				type = Resources.CommonLabels.ExtendedText;
				break;
			case "Subform":
				type = Resources.CommonLabels.SubformText;
				break;
			case "Subview":
				type = Resources.CommonLabels.SubviewText;
				break;
		}

		return type;
	},

	this.addExpanders = function (rulescontainer, context)
	{
		var rulescontainer = this._getRulesContainer();
		var expanders = rulescontainer.find(".categorySectionsList .section-expander");
		var sectionHeadings = rulescontainer.find(".categorySectionsHeading");

		expanders.each(function ()
		{
			var container = $(this).parent();

			$(this).on("click", function ()
			{
				var radiobox = container.find(".radiobox");
				if ($(this).hasClass("collapsed"))
				{
					context.expand($(this), radiobox);
				}
				else
				{
					context.collapse($(this), radiobox);
				}
			});
		}, [this]);

		sectionHeadings.each(function ()
		{
			var container = $(this).parent();
			$(this).on("dblclick", function ()
			{
				var radiobox = container.find(".radiobox");
				var element = container.find(".section-expander");
				if (element.hasClass("collapsed"))
				{
					context.expand(element, radiobox);
				}
				else
				{
					context.collapse(element, radiobox);
				}
			});
		}, [this]);

	}

	this.expand = function (element, radiobox)
	{
		$(radiobox).show();
		if (element.hasClass("collapsed"))
		{
			element.removeClass("collapsed");
		}
		if (element.hasClass("expanded"))
		{
			element.removeClass("expanded");
		}
		element.addClass("expanded");
	}

	this.collapse = function (element, radiobox)
	{
		$(radiobox).hide();
		if (element.hasClass("collapsed"))
		{
			element.removeClass("collapsed");
		}
		if (element.hasClass("expanded"))
		{
			element.removeClass("expanded");
		}
		element.addClass("collapsed");
	}

	this.isExtended = function (_eventNode)
	{
		var isExtended = _eventNode.getAttribute("IsExtended");
		isExtended = (checkExists(isExtended) && isExtended.toLowerCase() === "true") ? true : false;
		var isReference = _eventNode.getAttribute("IsReference");
		isReference = (checkExists(isReference) && isReference.toLowerCase() === "true") ? true : false;
		return (isExtended && isReference)
	}

	this.isSubform = function (_eventNode, _subformGuid)
	{
		var isSubForm = _eventNode.getAttribute("IsSubForm");
		return (checkExists(isSubForm) && isSubForm.toLowerCase() === "true");
	}

	this.isSubview = function (_eventNode, _subformGuid)
	{
		var isSubView = _eventNode.getAttribute("IsSubView");
		return (checkExists(isSubView) && isSubView.toLowerCase() === "true");
	}

	this.getParentSourceType = function (context, instanceID)
	{
		var parentSourceType = context;
		if ((context === "Form") && (checkExistsNotEmpty(instanceID)))
		{
			parentSourceType = "View";
		}
		return parentSourceType;
	};

	this.getSourceType = function (_eventNode, context)
	{
		var subformGuid = _eventNode.getAttribute("SubFormID");
		var instanceID = _eventNode.getAttribute("InstanceID");

		var sourceType = _eventNode.getAttribute("SourceType");

		var checkExtended = this.isExtended(_eventNode);
		var checkSubform, checkSubview, checkExtendedUnbound = false;
		if (checkExistsNotEmpty(subformGuid))
		{
			checkSubform = this.isSubform(_eventNode, subformGuid);
			checkSubview = this.isSubview(_eventNode, subformGuid);
		}

		if (checkExtended === true)
		{
			var _propertyNode = _eventNode.selectSingleNode("Handlers/Handler/Actions/Action/Properties/Property[Name='Location']/Value");

			if (_propertyNode)
			{
				_propertyNode = _propertyNode.text;
			}
			else
			{
				_propertyNode = "";
			}
			if (sourceType !== "Rule")
			{
				return "Extended-" + _propertyNode;
			}
			else
			{
				checkExtendedUnbound = true;
			}

		}
		//else if (checkSubview)
		if (checkSubview === true)
		{
			if (checkExtended === false)
			{
				return "Subview";
			}
			else
			{
				return "Extended-Subview";
			}
		}
		else if (checkSubform === true)
		{
			if (checkExtended === false)
			{
				return "Subform";
			}
			else
			{
				return "Extended-Subform";
			}
		}
		else
		{
			if (sourceType === "Control")
			{
				sourceType = this.getParentSourceType(context, instanceID);
			}
			else if (sourceType === "Rule")
			{
				var parentSourceType = this.getParentSourceType(context, instanceID);
				sourceType = this.getUnboundType(checkExtendedUnbound, parentSourceType);
			}
			return sourceType;
		}

	},

	this.getUnboundType = function (check, context)
	{
		if (check === true)
		{
			sType = "Unbound-" + context + "-Extended";
		}
		else
		{
			sType = "Unbound-" + context;
		}
		return sType;
	},

	this.getEventContext = function (_eventNode, context)
	{
		
		var subformGuid = _eventNode.getAttribute("SubFormID");
		var isReference = _eventNode.getAttribute("IsReference");
		isReference = (checkExists(isReference)) ? isReference.toLowerCase() : "false";
		var isBase;

		if (this.ruleListType === "RuleList")
		{
			
			var checkSubform, checkSubview = false;
			if (checkExistsNotEmpty(subformGuid))
			{
				checkSubform = this.isSubform(_eventNode, subformGuid);
				checkSubview = this.isSubview(_eventNode, subformGuid);
			}

			if (checkSubview === true)
			{
				return "subview";
			}
			else if (checkSubform === true)
			{
				return "subform";
			}
		}
		if (context === "Form")
		{
			var hasInstanceID = _eventNode.getAttribute("InstanceID");
			return (hasInstanceID) ? "view" : "form";
		}
		else
		{
			return "view";
		}
	};

	//removeItem
	this.removeItem = function (pRuleList, pDefinitionXml, eventNode, callback, forceRemove)
	{
		var _this = this;
		var ruleDefinitionID;
		var _eventID = this.getSelectedID(pRuleList);

		if (!checkExists(eventNode))
		{
			eventNode = pDefinitionXml.documentElement.selectSingleNode("//Events/Event[@ID='{0}']".format(_eventID));
		}

		if (checkExists(eventNode))
		{
			ruleDefinitionID = eventNode.getAttribute("DefinitionID");
			var ruleName = getNodeValue("Properties/Property[Name='RuleFriendlyName']/Value", eventNode, "");

			//Events can have dependencies on other events (execute another event) or on extended subform rule objects.
			//SubForm/SubView dependencies should be handled in a different way (see User Story 650690)
			//If event has subform/subview dependencies:
			//Dependencies on subforms should be listed and user should be warned that they will be removed (no option for keep).
			//If there were any other dependencies (execute another rule), these dependencies should be kept and badged.
			//If event has no subform/subview dependencies:
			//Display notifier as usual and let user choose to keep or remove.

			var ruleData =
			{
				definitionId: ruleDefinitionID,
				itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Event,
				itemDisplayName: ruleName,
				callback: function(notifierContext)
				{
					_this.performItemRemoval(pRuleList, pDefinitionXml, eventNode, callback, notifierContext);
				}
			};

			if (forceRemove === true)
			{
				_this.performItemRemoval(pRuleList, pDefinitionXml, eventNode, callback);
			}
			else if (!SourceCode.Forms.Designers.hasEventDependencies(ruleData))
			{
				//No dependencies
				var options = {
					message: Resources.FormDesigner.RemoveRuleConfirmation,
					onAccept: function ()
					{
						popupManager.closeLast();
						_this.performItemRemoval(pRuleList, pDefinitionXml, eventNode, callback);
					},
					onCancel: function ()
					{
						popupManager.closeLast();
					}
				};
				popupManager.showConfirmation(options);
			}
		}
	},

	this.performItemRemoval = function (pRuleList, pDefinitionXml, eventNode, callback, notifierContext)
	{
		var eventId = this.getSelectedID(pRuleList);
		var element = $("#" + eventId).parent();
		var siblings = element.siblings();
		var categorySection = element.parent().parent().parent();

		SourceCode.Forms.Designers.Common.Rules.removeItemFromXml(eventNode, pDefinitionXml, pRuleList, notifierContext);
		SourceCode.Forms.Designers.Common.Context.resetRulesSearch();
		element.remove();

		if (siblings.length === 0)
		{
			categorySection.remove();
		}

		if (typeof callback === "function")
		{
			callback();
		}

		SourceCode.Forms.Designers.Common.applyDesignerWizardStepBadging();
	};

	this.removeDependentEventItems = function (pDefinitionXml, _eventNode, subformGuidArray)
	{
		var _eventID = _eventNode.getAttribute("ID");
		var element = $("#" + _eventID).parent();
		var siblings = element.siblings();
		var categorySection = element.parent().parent().parent();

		var subformOpenActions = _eventNode.selectNodes("Handlers/Handler/Actions/Action[((@Type='Open') or (@Type='Popup')) and (not(@IsReference) or (@IsReference!='True'))]");
		if (subformOpenActions.length > 0)
		{
			for (var a = 0; a < subformOpenActions.length; a++)
			{
				var subformAction = subformOpenActions[a];
				var subformGuid = subformAction.getAttribute("SubFormID");

				subformGuidArray.push(subformGuid);

				var newEventsNode = pDefinitionXml.selectNodes("//Event[@SubFormID='" + subformGuid + "']");
				for (var e = 0; e < newEventsNode.length; e++)
				{
					if (_eventNode.parentNode)// Remove Event
					{
						_eventNode.parentNode.removeChild(_eventNode);
						element.remove();

						if (siblings.length === 0)
						{
							categorySection.remove();
						}
					}

					var newEventNode = newEventsNode[e];
					this.removeDependentEventItems(pDefinitionXml, newEventNode, subformGuidArray);
				}
			}
		}
		if (_eventNode.parentNode)// Remove Event
		{
			_eventNode.parentNode.removeChild(_eventNode);
			element.remove();

			if (siblings.length === 0)
			{
				categorySection.remove();
			}
		}
	},

	this.removeDependentActions = function (pDefinitionXml, subformGuidArray)
	{
		for (var s = 0; s < subformGuidArray.length; s++)
		{
			var subformGuid = subformGuidArray[s];
			var actions = pDefinitionXml.selectNodes("//Action[@SubFormID='" + subformGuid + "']");

			for (var a = 0; a < actions.length; a++)
			{
				// remove action node
				var action = actions[a];
				var actionsNode = action.parentNode;

				while (actionsNode.tagName !== "Actions")
				{
					actionsNode = actionsNode.parentNode;
				}

				actionsNode.removeChild(action);
				// remove action node

				// remove actions node if there are no actions
				if (actionsNode.childNodes.length === 0)
				{
					var handlerNode = actionsNode.parentNode;

					while (handlerNode.tagName !== "Handler")
					{
						handlerNode = handlerNode.parentNode;
					}

					handlerNode.removeChild(actionsNode);

					// remove handler node if there is no actions
					if (handlerNode.selectNodes("Actions").length === 0)
					{
						var handlersNode = handlerNode.parentNode;

						while (handlersNode.tagName !== "Handlers")
						{
							handlersNode = handlersNode.parentNode;
						}

						handlersNode.removeChild(handlerNode);

						// remove handlers node if no handler was found
						if (handlersNode.selectNodes("Handler").length === 0)
						{
							var eventNode = handlersNode.parentNode;
							while (eventNode.tagName !== "Event")
							{
								eventNode = eventNode.parentNode;
							}

							// remove event node is no handlers exist
							var eventsNode = handlersNode.parentNode;
							while (eventsNode.tagName !== "Events")
							{
								eventsNode = eventsNode.parentNode;
							}

							eventsNode.removeChild(eventNode);
							// remove event node is no handlers exist
						}
					}
					// remove handler node if there is no actions
				}
				// remove actions node if there are no actions
			}
		}
	},

	this.setRuleState = function (pRuleList, pDefinitionXml, ruleState)
	{
		_eventNode = pDefinitionXml.documentElement.selectSingleNode(['//Events/Event[@ID="', '"]'].join(this.getSelectedID(pRuleList)));
		var eventGuidArray = SourceCode.Forms.Designers.Common.Rules.setEventItemStates(pDefinitionXml, _eventNode, ruleState);
	}
}
