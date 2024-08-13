(function ($)
{

	// Namespacing the Designer
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
	if (typeof SourceCode.Forms.Designers.View === "undefined" || SourceCode.Forms.Designers.View === null) SourceCode.Forms.Designers.View = {};

	var _ajaxCall = SourceCode.Forms.Designers.View.AJAXCall = {

		_getSmartObjectPropertiesAndMethods: function (soGuid, isListing)
		{
			var step2RightPanelTopContainer = jQuery('#vdToolboxPane');
			if (step2RightPanelTopContainer.is(':visible') && step2RightPanelTopContainer.parents(':hidden').length === 0)
			{
				step2RightPanelTopContainer.modalize(true);
				step2RightPanelTopContainer.showBusy(true);
			}

			var ViewEditorTabSelect = jQuery('#PaneContainer1');
			if (ViewEditorTabSelect.is(':visible') && ViewEditorTabSelect.parents(':hidden').length === 0)
			{
				ViewEditorTabSelect.modalize(true);
				ViewEditorTabSelect.showBusy(true);
			}

			var FieldsContainer = jQuery('#vdFieldsList');
			var MethodContainer = jQuery('#vdMethodsList');

			FieldsContainer.empty();
			MethodContainer.empty();
			_ajaxCall.View.hiddenAssociationXml = null;
			_ajaxCall.View.hiddenSmartObjectXml = null;

			_ajaxCall.View.SelectedSmartObjectGuid = soGuid;

			if (isListing)
			{
				var qs = {
					tofire: 'getSmartObjectPropertiesAndListMethods',
					soguid: soGuid,
					islisting: isListing
				};

				var options = {
					url: 'Views/AJAXCall.ashx',
					type: 'POST',
					cache: false,
					data: qs,
					async: false,
					success: _ajaxCall._getSmartObjectPropertiesAndListMethodsResult,
					error: _ajaxCall._getSmartObjectPropertiesAndMethodsFailure
				};
			}
			else
			{
				var qs = {
					tofire: 'getSmartObjectPropertiesAndMethods',
					soguid: soGuid,
					islisting: isListing
				};

				var options = {
					url: 'Views/AJAXCall.ashx',
					type: 'POST',
					cache: false,
					data: qs,
					async: false,
					success: _ajaxCall._getSmartObjectPropertiesAndMethodsResult,
					error: _ajaxCall._getSmartObjectPropertiesAndMethodsFailure
				};
			}

			jQuery.ajax(options);

			_ajaxCall.ViewDesigner._configureOptionsStep();

			step2RightPanelTopContainer.modalize(false);
			step2RightPanelTopContainer.showBusy(false);
		},

		_getSmartObjectPropertiesAndMethodsResult: function (data, textStatus)
		{
			var step2RightPanelTopContainer = jQuery('#vdToolboxPane');
			var returnVal = true;

			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				step2RightPanelTopContainer.modalize(false);
				step2RightPanelTopContainer.showBusy(false);
				SourceCode.Forms.ExceptionHandler.handleException(data);
			}
			else
			{
				var allDataXml = data;
				var propsCallData = allDataXml.selectSingleNode("/SOData/root");
				var methodsCallData = allDataXml.selectSingleNode("/SOData/methods");

				if (methodsCallData)
				{
					returnVal = _ajaxCall._getSmartObjectMethodsResult(methodsCallData.xml, textStatus);
				}

				if (propsCallData)
				{
					_ajaxCall._getSmartObjectPropertiesResult(propsCallData.xml, textStatus);
				}
			}
		},

		_clearFormsMethodOptions: function ()
		{
			// clear standard buttons options
			jQuery("#vdchkAllMethodsStandardButtons").checkbox().checkbox("uncheck");

			// clear toolbar buttons options
			jQuery("#vdchkAllMethodsToolbarButtons").checkbox().checkbox("uncheck");

			// remove method rows
			$("#MethodButtonsTable > tbody > tr:not(:first-child)").remove();
		},

		_getSmartObjectMethodsResult: function (data, textStatus)
		{
			var thisResponse = data;
			var step2RightPanelTopContainer = jQuery('#vdToolboxPane');

			if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
			{
				step2RightPanelTopContainer.modalize(false);
				step2RightPanelTopContainer.showBusy(false);
				SourceCode.Forms.ExceptionHandler.handleException(thisResponse);
			}
			else
			{
				var xmlDoc = parseXML(thisResponse);
				var methodElems = xmlDoc.selectNodes('methods/method');

				_ajaxCall._clearFormsMethodOptions();

				if (methodElems.length === 0)
				{
					return false;
				}

				var MethodButtonsTable = $("#MethodButtonsTable");

				for (var i = 0; i < methodElems.length; i++)
				{
					var methodElem = methodElems[i];
					var name = methodElem.selectSingleNode('name').text;
					var displayname = methodElem.selectSingleNode('displayname').text.htmlEncode();
					var idStandard = new String().generateGuid();
					var idToolbar = new String().generateGuid();

					var row = "<tr>";

					// Method Label
					row += "<td><label class=\"input-control icon-control smartobject-method\"><span class=\"input-control-icon\"></span>"
						+ "<span class=\"input-control-text generic-ellipsis\" title=\"" + displayname + "\">" + displayname + "</span></label></td>";

					// Method Standard Button
					row += "<td>" + SCCheckbox.html({ id: idStandard, value: name, skipCreateChecks: true }) + "</td>";

					// Method Toolbar Button
					row += "<td>" + SCCheckbox.html({ id: idToolbar, value: name, skipCreateChecks: true }) + "</td>";

					row += "</tr>";

					MethodButtonsTable.children("tbody").append(row);

					// add click event
					standardCheckBox = jQuery("#" + idStandard).checkbox();
					standardCheckBox.on("click", function ()
					{
						var selectedStandardButtons = jQuery("#MethodButtonsTable").find(".autogen-method-standard:checked");

						if (selectedStandardButtons.length === methodElems.length)
						{
							jQuery("#vdchkAllMethodsStandardButtons").checkbox("check");
						}
						else
						{
							jQuery("#vdchkAllMethodsStandardButtons").checkbox("uncheck");
						}

						_ajaxCall.ViewDesigner._configureOptionsStep(2);
					});

					toolbarCheckbox = jQuery("#" + idToolbar).checkbox();
					toolbarCheckbox.on("click", function ()
					{
						var selectedToolbarButtons = jQuery("#MethodButtonsTable").find(".autogen-method-toolbar:checked");
						if (selectedToolbarButtons.length === methodElems.length)
						{
							jQuery("#vdchkAllMethodsToolbarButtons").checkbox("check");
						}
						else
						{
							jQuery("#vdchkAllMethodsToolbarButtons").checkbox("uncheck");
						}

						_ajaxCall.ViewDesigner._configureOptionsStep(2);
					});
				}

				MethodButtonsTable.find("tbody tr:not(:first-child) td:nth-child(2) .input-control.checkbox input").addClass("autogen-method-standard");
				MethodButtonsTable.find("tbody tr:not(:first-child) td:last-child .input-control.checkbox input").addClass("autogen-method-toolbar");
			}

			return true;
		},

		_getSmartObjectPropertiesAndMethodsFailure: function (XMLHttpRequest, textStatus, errorThrown)
		{
			var step2RightPanelTopContainer = jQuery('#vdToolboxPane');
			if (step2RightPanelTopContainer.is(':visible') && step2RightPanelTopContainer.parents(':hidden').length === 0)
			{
				step2RightPanelTopContainer.modalize(false);
				step2RightPanelTopContainer.showBusy(false);
			}

			var ViewEditorTabSelect = jQuery('#PaneContainer1');
			if (ViewEditorTabSelect.is(':visible') && ViewEditorTabSelect.parents(':hidden').length === 0)
			{
				ViewEditorTabSelect.showBusy(false);
				ViewEditorTabSelect.modalize(false);
			}

			SourceCode.Forms.ExceptionHandler.handleException(errorThrown);
			_ajaxCall.View.isSmartObjectLoaded = false;
		},

		_clearDataSource: function ()
		{
			var viewType = _ajaxCall.ViewDesigner._getViewType();

			_ajaxCall.View._clearControlBindings();

			var step2RightPanelTopContainer = jQuery('#Pane2');

			_ajaxCall.View.SelectedSmartObjectGuid = null;

			var FieldsContainer = jQuery('#vdFieldsList');
			var MethodContainer = jQuery('#vdMethodsList');
			FieldsContainer.empty();
			MethodContainer.empty();
			_ajaxCall.View.hiddenAssociationXml = null;
			_ajaxCall.View.hiddenSmartObjectXml = null;
			_ajaxCall.View.SelectedSmartObjectName = '';
			_ajaxCall.View.SelectedSmartObjectPath = '';
			_ajaxCall.View.SelectedSmartObjectGuid = null;

			$("#autogenFieldsTable > tbody > tr").slice(1).remove();

			_ajaxCall.View._setListMethodStateForDetailsStep(false);

			_ajaxCall.View.ddlistmethod.dropdown("clearOptions");
			_ajaxCall.View.ddlistmethod.dropdown("refresh");

			_ajaxCall._clearFormsMethodOptions();

			_ajaxCall.ViewDesigner._configureOptionsStep(_ajaxCall.View.wizard.wizard("getStep", _ajaxCall.View.layoutStep));

			step2RightPanelTopContainer.modalize(false);
			step2RightPanelTopContainer.showBusy(false);
		},

		_getSmartObjectPropertiesAndListMethodsResult: function (data, textStatus)
		{
			var step2RightPanelTopContainer = jQuery('#vdToolboxPane');
			var returnVal = true;

			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				step2RightPanelTopContainer.modalize(false);
				step2RightPanelTopContainer.showBusy(false);
				SourceCode.Forms.ExceptionHandler.handleException(data);
			}
			else
			{
				var allDataXml = data;
				var propsCallData = allDataXml.selectSingleNode("/SOData/list/root");
				var methodsCallData = allDataXml.selectSingleNode("/SOData/list/methods");
				if (methodsCallData)
				{
					returnVal = _ajaxCall._getSmartObjectListMethodsResult(methodsCallData.xml, textStatus);

					// populate single method dropdowns
					var singleMethodsCallData = allDataXml.selectNodes("SOData/single/methods/method");

					var singleMethodsDetails = jQuery(allDataXml.selectSingleNode("SOData/single/root/method").text).find("div").filter("div[methodType!='list']");

					var addMethod = jQuery("#vdlistEditAddMethod");
					var editMethod = jQuery("#vdlistEditEditMethod");
					var removeMethod = jQuery("#vdlistEditDeleteMethod");

					addMethod.empty();
					editMethod.empty();
					removeMethod.empty();

					for (var i = 0; i < singleMethodsCallData.length; i++)
					{
						var singleMethod = singleMethodsCallData[i];

						var option = jQuery("<option></option>");
						option.attr("value", singleMethod.selectSingleNode("name").text);
						option.text(singleMethod.selectSingleNode("displayname").text);

						var methodType = singleMethodsDetails[i].getAttribute("methodType");
						if (methodType === "create")
						{
							addMethod.append(option.clone());
						}
						else if (methodType === "update")
						{
							editMethod.append(option.clone());
						}
						else if (methodType === "delete")
						{
							removeMethod.append(option.clone());
						}
					}

					addMethod.dropdown().dropdown("refresh");
					editMethod.dropdown().dropdown("refresh");
					removeMethod.dropdown().dropdown("refresh");
				}
				else
				{
					_ajaxCall._clearDataSource();

					popupManager.showError(Resources.ViewDesigner.InvalidListDatasource);

					_ajaxCall.View.noListMethods = true;
					_ajaxCall.ViewDesigner._configureOptionsStep(2);

					return;
				}

				if (propsCallData && returnVal === true)
				{
					_ajaxCall._getSmartObjectPropertiesResult(propsCallData.xml, textStatus);
				}
			}
		},

		_getSmartObjectPropertiesResult: function (data, textStatus)
		{
			var thisResponse = data;
			var ViewEditorTabSelect = jQuery('#PaneContainer1');

			// check for exception
			if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
			{
				//hide busy
				ViewEditorTabSelect.showBusy(false);
				ViewEditorTabSelect.modalize(false);
				_ajaxCall.View.isSmartObjectLoaded = false;
				SourceCode.Forms.ExceptionHandler.handleException(thisResponse);
			}
			else
			{
				var FieldsHTML = '';
				var MethodHTML = '';
				var AssociationXML = '';
				var SmartObjectXML = '';
				var xmlDoc = parseXML(thisResponse);
				var propertiesElem = xmlDoc.documentElement.selectSingleNode('properties');
				var methodElem = xmlDoc.documentElement.selectSingleNode('method');
				var soElem = xmlDoc.documentElement.selectSingleNode('soxml');
				var associationElem = xmlDoc.documentElement.selectSingleNode('association');

				FieldsHTML = propertiesElem.text;
				MethodHTML = methodElem.text;
				SmartObjectXML = soElem.text;
				AssociationXML = associationElem.text;

				var FieldsContainer = jQuery('#vdFieldsList');
				var MethodContainer = jQuery('#vdMethodsList');

				FieldsContainer.append(jQuery(FieldsHTML));
				MethodContainer.append(jQuery(MethodHTML));
				_ajaxCall.View.hiddenAssociationXml = parseXML(AssociationXML);
				_ajaxCall.View.hiddenSmartObjectXml = parseXML(SmartObjectXML);

				_ajaxCall.ViewDesigner._makeChildElementsDragable(FieldsContainer);
				_ajaxCall.ViewDesigner._makeChildElementsDragable(MethodContainer);

				_ajaxCall.ViewDesigner._generateCaptureViewOptions();
			}
		},

		_getSmartObjectListMethodsResult: function (data, textStatus)
		{
			var thisResponse = data;
			var step2RightPanelTopContainer = jQuery('#Pane2');

			if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
			{
				step2RightPanelTopContainer.modalize(false);
				step2RightPanelTopContainer.showBusy(false);
				SourceCode.Forms.ExceptionHandler.handleException(thisResponse);
			}
			else
			{
			    var listViewGetListMethod = _ajaxCall.View.ddlistmethod;
				var xmlDoc = parseXML(thisResponse);
				var methodElems = xmlDoc.selectNodes('methods/method');
				_ajaxCall.ViewDesigner.listMethods = {};
				var methodSelected = false;

				if (methodElems.length === 0 && _ajaxCall.View.wizardStep)
				{
					_ajaxCall._clearDataSource();

					jQuery("#ViewDesignerSmartObjectLookup").categorylookup("value");

					popupManager.showError(Resources.ViewDesigner.InvalidListDatasource);

					_ajaxCall.View.noListMethods = true;
					_ajaxCall.ViewDesigner._configureOptionsStep(_ajaxCall.View.LAYOUT_STEP_INDEX);

					return true;
				}
				else
				{
					_ajaxCall.View.noListMethods = null;
					_ajaxCall.ViewDesigner._configureOptionsStep(2);
				}

				listViewGetListMethod.dropdown("clearOptions");
				var methodOptionsForDropdown = [];
				var methodOption = null;
				for (var i = 0; i < methodElems.length; i++)
				{
					var methodElem = methodElems[i];
					var name = methodElem.selectSingleNode('name').text;
					var displayname = methodElem.selectSingleNode('displayname').text;
					var isdefault = methodElem.getAttribute('default');

					methodOption = {
						index: i,
						text: displayname,
						value: name,
						className: "",
						selected: (isdefault === "true")
					};
					methodOptionsForDropdown.push(methodOption);

					if (methodOption.selected)
					{
						methodSelected = true;
					}
					_ajaxCall.ViewDesigner.listMethods[name] = true;
				}
				if (!methodSelected && methodOptionsForDropdown.length > 0)
				{
					methodOptionsForDropdown[0].selected = true;
				}
				listViewGetListMethod.dropdown("option", "items", methodOptionsForDropdown);
				if (methodElems.length > 0)
				{
				    _ajaxCall.View.ddlistmethod.dropdown('enable');
				}
				else
				{
				    _ajaxCall.View.ddlistmethod.dropdown('disable');
				}

				_ajaxCall.View._setListMethodStateForDetailsStep(false);

				step2RightPanelTopContainer.modalize(false);
				step2RightPanelTopContainer.showBusy(false);

				return true;
			}
		},

		_getSOPropertiesBasic: function (soGuid, isListing)
		{
			//show busy
			var ViewEditorTabSelect = jQuery('#LayoutPaneContainer');
			ViewEditorTabSelect.modalize(true);
			ViewEditorTabSelect.showBusy(true);

			var qs = {
				tofire: 'getSmartObjectProperties',
				soguid: soGuid,
				isListing: isListing
			};

			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				cache: false,
				data: qs,
				async: false
			};

			ViewEditorTabSelect.modalize(false);
			ViewEditorTabSelect.showBusy(false);

			return jQuery.ajax(options).responseText;
		},

		_viewCheckedOutBy: function (viewId)
		{
			var qs = {
				tofire: 'viewCheckedOutBy',
				viewid: viewId
			};

			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				data: qs,
				cache: false,
				async: false
			};

			var user = jQuery.ajax(options).responseText;
			return user;
		},

		_checkOutView: function (viewId)
		{
			modalizer.show(true);

			var qs = {
				tofire: 'checkOutView',
				viewid: viewId
			};


			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				data: qs,
				dataType: "xml",
				cache: false,
				async: false,
				success: function (data, textStatus) { _ajaxCall._checkOutViewResult(data, textStatus); },
				error: function (XMLHttpRequest, textStatus, errorThrown) { _ajaxCall._checkOutViewFailure(XMLHttpRequest, textStatus, errorThrown); }
			};

			return jQuery.ajax(options).responseText;
		},

		_checkOutViewResult: function (data, textStatus)
		{
			var thisResponse = data;

			if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
			{
				//hide busy
				modalizer.hide();
				SourceCode.Forms.ExceptionHandler.handleException(thisResponse);
			}
			else
			{
				var xmlDoc = thisResponse;

				_ajaxCall.View.ViewCheckedOutStatus = xmlDoc.selectSingleNode('ViewInfo/IsCheckedOut').text;
				if (_ajaxCall.View.ViewCheckedOutStatus === 'True' || _ajaxCall.View.ViewCheckedOutStatus === 'true' || _ajaxCall.View.ViewCheckedOutStatus === true)
					_ajaxCall.View.ViewCheckedOutStatus = 1;
				else
					_ajaxCall.View.ViewCheckedOutStatus = 0;

				_ajaxCall.View.ViewCheckedOutBy = xmlDoc.selectSingleNode('ViewInfo/CheckedOutBy').text;

				if (_ajaxCall.View.ViewCheckedOutStatus === 1 && jQuery("#ViewDesignerSmartObjectLookup").is(".disabled"))
				{
					jQuery("#ViewDesignerSmartObjectLookup").categorylookup("enable");
					jQuery("#ViewDesignerCategoryLookup").categorylookup("enable");
				}

				if (_ajaxCall.View.isOnFinishStep)
				{
					showStepFinish();
				}

				modalizer.hide();
			}
		},

		_checkOutViewFailure: function (XMLHttpRequest, textStatus, errorThrown)
		{
			modalizer.hide();
			SourceCode.Forms.ExceptionHandler.handleException(errorThrown);
		},

		_getAssociationSODetails: function (smartobjectid)
		{
			if (!checkExists(_ajaxCall.View.hiddenAssociationXml))
			{
				_ajaxCall.View.hiddenAssociationXml = parseXML("<associations></associations>");
			}

			var AssociationDoc = _ajaxCall.View.hiddenAssociationXml;
			var AssociationRoot = AssociationDoc.selectSingleNode('associations');
			if ($chk(AssociationRoot) === false)
			{
				AssociationRoot = AssociationDoc.createElement('associations');
				AssociationDoc.appendChild(AssociationRoot);
			}

			var soElem = AssociationRoot.selectSingleNode('smartobjectroot[@guid="' + smartobjectid + '"]');
			if (!checkExists(soElem) && !SourceCode.Forms.ExceptionHandler.SmartObjectNotFound.check(smartobjectid))
			{
				var qs = {
					tofire: 'getSmartObjectDetail',
					soid: smartobjectid
				};

				var options = {
					url: 'Views/AJAXCall.ashx',
					type: 'POST',
					data: qs,
					async: false,
					cache: false
				};

				modalizer.hide();
				var data = jQuery.ajax(options).responseText;
				return _ajaxCall._getAssociationSODetailsResult(data, smartobjectid);
			}
		},

		_getAssociationSODetailsResult: function (data, smartobjectid)
		{
			var thisResponse = data;

			if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
			{
				SourceCode.Forms.ExceptionHandler.SmartObjectNotFound.process(data, smartobjectid);
				//SourceCode.Forms.ExceptionHandler.handleException(thisResponse);
				return thisResponse;
			}
			else
			{

				var newSODoc = parseXML(thisResponse);
				var newSOElem = newSODoc.selectSingleNode('smartobjectroot');
				var soGuid = '';
				if ($chk(newSOElem) === true)
				{
					soGuid = newSOElem.getAttribute('guid');
				}

				var AssociationDoc = _ajaxCall.View.hiddenAssociationXml;
				var AssociationRoot = AssociationDoc.selectSingleNode('associations');
				if ($chk(AssociationRoot) === false)
				{
					AssociationRoot = AssociationDoc.createElement('associations');
					AssociationDoc.appendChild(AssociationRoot);
				}

				var soElem = AssociationRoot.selectSingleNode('smartobjectroot[@guid="' + soGuid + '"]');
				if ($chk(soElem) === false)
				{
					var clonedSoEl = newSOElem.cloneNode(true);
					AssociationRoot.appendChild(clonedSoEl);
				}
				_ajaxCall.View.hiddenAssociationXml = AssociationDoc;

				return null;
			}
		},

		_getSubformsDetails: function (subformIDArray, subformFormIDArray)
		{
			//	modalizer.show(true);

			var qs = {
				tofire: 'getSubformsDetails',
				subformIDs: subformIDArray.toString(),
				subformFormIDs: subformFormIDArray.toString()
			};

			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				async: false,
				data: qs,
				dataType: "xml",
				cache: false
			};

			var data = jQuery.ajax(options).responseText;

			//	modalizer.hide();

			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				SourceCode.Forms.ExceptionHandler.handleException(data);
				return false;
			}
			else
			{
				if ($chk(data))
				{
					return data;
				}
			}
		},

		_updateControlProperties: function (controlid, controlname, updatedPropertyList, propertyList, stylelist)
		{
			var controlWrapper = jQuery('#' + controlid);

			if ($chk(stylelist) === false)
				stylelist = SourceCode.Forms.Designers.View.Styles._getStylesNode(controlid, controlname);

			var controlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlname + '"]');

			if (_ajaxCall._controlRequiresRerender(controlElem, updatedPropertyList, stylelist))
			{
				_ajaxCall._initControlProperties(controlid, controlname, propertyList, stylelist);
			}
			else
			{
				_ajaxCall._setDisplayControlProperties(controlElem, controlWrapper, controlname, updatedPropertyList, stylelist);
				_ajaxCall._setSelectedControl();
			}
		},

		_setSelectedControl: function ()
		{
			var selectedPropertySetPath = jQuery(".input-control.active").find("input").data("propertySetPath");
			var jq_selectedPropertyControl = jQuery(".propertyGridPropertyEdit,.propertyGridPropertyEditCheckBox").filter(function ()
			{
				return jQuery(_ajaxCall).data("propertySetPath") === selectedPropertySetPath;
			});
		},

		_initControlProperties: function (controlid, controlname, propertylist, stylelist, setAsSelectedControl, forceNoRender)
		{
			if ($chk(stylelist) === false)
				stylelist = SourceCode.Forms.Designers.View.Styles._getStylesNode(controlid, controlname);

			var controlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlname + '"]');
			if (!forceNoRender && _ajaxCall._controlRequiresRerender(controlElem, propertylist, stylelist))
			{
				_ajaxCall._renderControlProperties(controlid, controlname, propertylist, stylelist, setAsSelectedControl);
			}
			else
			{
				var controlHTML = jQuery(controlElem.selectSingleNode("HTML").text);
				var wrapperDiv = jQuery("<div controltype='" + controlname + "'></div>");
				if (controlname === "Table")
				{
					controlHTML = SourceCode.Forms.Controls.Web.TableBehavior.prototype.createNewTable(controlHTML, controlElem, SourceCode.Forms.Designers.View);
				}
				wrapperDiv.append(controlHTML);
				wrapperDiv.data("controlid", controlid);
				_ajaxCall._initControlPropertiesResult(controlHTML, controlid, propertylist, stylelist, setAsSelectedControl);
			}
		},

		_renderControlProperties: function (controlid, controlname, propertylist, stylelist, setAsSelectedControl)
		{
			var qs = {
				tofire: 'setControlProperties',
				controlid: controlid,
				controlname: controlname,
				properties: propertylist.xml,
				style: stylelist.xml,
				isrefreshing: 'true'
			};

			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				data: qs,
				cache: false,
				success: function (data, textStatus) { _ajaxCall._renderControlPropertiesResult(data, textStatus, propertylist, stylelist, setAsSelectedControl); },
				error: function (XMLHttpRequest, textStatus, errorThrown) { _ajaxCall._setControlPropertiesFailure(XMLHttpRequest, textStatus, errorThrown); }
			};


			jQuery.ajax(options);
		},

		_renderControlPropertiesResult: function (data, textStatus, propertylist, stylelist, setAsSelectedControl)
		{
			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				SourceCode.Forms.ExceptionHandler.handleException(data);
				return null;
			}
			else
			{
				var html = null;
				//<controldefinitions>
				//	<control id=[id]>
				//		<![CDATA] HTML of control goed here >
				//	</control>
				var xmlDoc = data;
				var control = xmlDoc.selectSingleNode('controldefinitions/control');

				if (control)
				{
					var id = control.getAttribute("ID");
					html = control.text;

					_ajaxCall._initControlPropertiesResult(jQuery(html), id, propertylist, stylelist, setAsSelectedControl);
				}
			}
		},

		_setControlPropertiesFailure: function (XMLHttpRequest, textStatus, errorThrown)
		{
			SourceCode.Forms.ExceptionHandler.handleException(errorThrown);
		},

		_getDataTypeControls: function (type)
		{
			var divChangeControl = jQuery('#divChangeControl');
			divChangeControl.modalize(true);
			divChangeControl.showBusy(true);

			var controlsPerType = _ajaxCall.View.controlsPerDataTypeXML.selectSingleNode("/ControlTypes/ControlDataType[@Name='" + type + "']");
			if (controlsPerType)
			{
				_ajaxCall.ViewDesigner.populateChangeControlList(controlsPerType.selectNodes("Control"));
				divChangeControl.modalize(false);
				divChangeControl.showBusy(false);
			} else
			{

				var qs = {
					tofire: 'getDataTypeControls',
					type: type
				};

				var options = {
					url: 'Views/AJAXCall.ashx',
					type: 'POST',
					data: qs,
					cache: false,
					success: function (data, textStatus) { _ajaxCall._getDataTypeControlsResult(data, textStatus); },
					error: function (XMLHttpRequest, textStatus, errorThrown) { _ajaxCall._getDataTypeControlsFailure(XMLHttpRequest, textStatus, errorThrown); }
				};

				jQuery.ajax(options);
			}
		},

		_getDataTypeControlsResult: function (data, textStatus)
		{
			var divChangeControl = jQuery('#divChangeControl');
			var thisResponse = data;

			if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
			{
				//hide busy
				divChangeControl.modalize(false);
				divChangeControl.showBusy(false);
				SourceCode.Forms.ExceptionHandler.handleException(thisResponse);
			}
			else
			{
				var controlList = thisResponse;
				var controlsDoc = controlList;
				var controls = controlsDoc.documentElement.selectNodes('Control');
				var clonedNode = controlsDoc.documentElement.cloneNode(true);
				_ajaxCall.View.controlsPerDataTypeXML.documentElement.appendChild(clonedNode);
				_ajaxCall.ViewDesigner.populateChangeControlList(controls);

				divChangeControl.addClass('changeControlContainer');
				divChangeControl.modalize(false);
				divChangeControl.showBusy(false);
			}
		},

		_getDataTypeControlsFailure: function (XMLHttpRequest, textStatus, errorThrown)
		{
			var divChangeControl = jQuery('#divChangeControl');
			divChangeControl.modalize(false);
			divChangeControl.showBusy(false);
			SourceCode.Forms.ExceptionHandler.handleException(thisResponse);
		},

		_initControlPropertiesResult: function (controlHTML, controlid, propertylist, stylelist, setAsSelectedControl)
		{
            var controlWrapper = jQuery('#' + controlid);

			var internals = controlHTML;
			controlWrapper.empty();
			var ControlDef = _ajaxCall.DragDrop._BuildControlWrapper(controlid);
			var uiControlResizer = ControlDef.resizeWrapper;
			controlWrapper.append(uiControlResizer);

			if (controlWrapper.attr('itemtype') === "layoutcontainer")
			{
				_ajaxCall.ViewDesigner._makeChildElementsDragable(controlWrapper);
				uiControlResizer.append(internals);
			}
			else
			{
				uiControlResizer.append(internals);

				var row = uiControlResizer.closest(".list-view-item");

				// append the overlay to the control if the control is not in a listview, or not a listview item, or not in the footer. 
				// So pretty much anything that's not a control in a column in the table body of an ELV
				if (_ajaxCall.ViewDesigner._getViewType() !== SourceCode.Forms.Designers.ViewType.ListView || row.length === 0 || row.hasClass("footer"))
				{
					_ajaxCall.DragDrop._EnsureControlOverlay(uiControlResizer);
				}

				if (_ajaxCall.View.selectedObject)
				{
					if (controlWrapper.attr('id') === _ajaxCall.View.selectedObject.attr('id'))
					{
						_ajaxCall.DragDrop._removeResizing(_ajaxCall.View.selectedObject);
						_ajaxCall.DragDrop._makeControlSizable(controlWrapper);
					}
				}

				if (setAsSelectedControl !== true)
				{
					_ajaxCall.ViewDesigner._makeElementDragable(controlWrapper);
				}
			}

			_ajaxCall.ViewDesigner._resetDesignWidthControl(controlWrapper, uiControlResizer);

			if (setAsSelectedControl)
			{
				_ajaxCall.ViewDesigner._configurePropertiesTab(controlWrapper);
				_ajaxCall.ViewDesigner._configSelectedControl(controlWrapper);
			}

			//Re-apply all local properties
			var controlType = controlWrapper.attr('controltype');
			var controlNode = _ajaxCall.Styles._getControlNode(controlid, controlType);
			if (!checkExists(stylelist))
			{
				stylelist = _ajaxCall.Styles._getStylesNode(controlid, controlType, controlNode);
			}
			if (!checkExists(propertylist))
			{
				propertylist = controlNode.selectSingleNode("Properties");
			}
			var controlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlType + '"]');
			var disallowRecursion = true;
			_ajaxCall._setDisplayControlProperties(controlElem, controlWrapper, controlType, propertylist, stylelist, disallowRecursion);

			//Hack to apply alignment styles
			var controlCategory = controlWrapper.attr('category');

			if (checkExistsNotEmpty(controlCategory))
			{
				var controlCatInt = parseInt(controlCategory, 10);

				var isInputOrListing = (controlCatInt === 0) || (controlCatInt === 1);

				if (_ajaxCall.View.SelectedViewType === 'CaptureList' && isInputOrListing)
				{
					_ajaxCall.Styles._applyControlStyles(controlWrapper);

				}
			}
			//END Hack to apply alignment styles

            SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlStyleChanged", controlWrapper);
		},

		_setDisplayControlProperties: function (controlElem, controlHTML, controlname, propertylist, styleslist, disallowRecursion)
		{
			if (!$chk(propertylist) || typeof propertylist === typeof "")
			{
				var callStack = printStackTrace(null);

				popupManager.showError({
					message: Resources.ViewDesigner.MethodArgumentException.format("propertylist", "_setDisplayControlProperties", callStack.join("<br/>")),
					width: 400,
					height: 240
				});

				return;
			}

			var defaultPropertiesXml = controlElem.selectSingleNode("DefaultProperties");

			var propertyItems = propertylist.selectNodes("Property");
			var controlSetProperties = _ajaxCall.ViewDesigner._getControlPropertiesXML(controlHTML.attr('id'));

			for (var g = 0; g < propertyItems.length; g++)
			{
				var name = propertyItems[g].selectSingleNode("Name").text;
				var value = propertyItems[g].selectSingleNode("Value").text;
				var defaultPropEl = defaultPropertiesXml.selectSingleNode("Properties/Prop[@ID='" + name + "']");
				if (defaultPropEl)
				{
					var shouldRefreshDisplay = defaultPropEl.getAttribute("refreshdisplay");
					var setFunction = defaultPropEl.getAttribute("setFunction");
					if ((shouldRefreshDisplay && shouldRefreshDisplay.toLowerCase() === 'true') && $chk(setFunction))
                    {
						var setValue = evalFunction(setFunction)(controlHTML, value, controlSetProperties, propertylist, disallowRecursion);
						if (setValue === "Exit")
							return "Exit";
						if ((name === "Width") && setValue && controlname !== 'Picture' && controlname !== "ImagePostBack" && controlname !== "Image" && controlname !== "File" && controlname !== "FilePostBack")
						{
							controlHTML[0].style.width = setValue;
							var resizeWrapper = controlHTML.find(".resizewrapper");
							if (resizeWrapper.length > 0)
								resizeWrapper[0].style.width = setValue;

							if (controlHTML.hasClass('controlwrapper'))
							{
								_ajaxCall.ViewDesigner._resetDesignWidthControl(controlHTML, controlHTML.find(".resizewrapper"));
							}
						}

					}
				}
			}

			if (styleslist)
			{
				var propNode = defaultPropertiesXml.selectSingleNode('Properties/Prop[@ID="{0}"]'.format("Styles"));
				if (propNode)
				{
					var setFunction = propNode.getAttribute('setFunction');
					if (!!setFunction)
					{
						eval(setFunction).apply(null, [controlHTML, styleslist]);
					}
					else
					{
						return false;
					}
				}
			}

			var controlWrapper = jQuery('#' + controlHTML.attr('id'));
			if (controlWrapper.length > 0)
			{
				if (_ajaxCall.View.SelectedViewType === 'CaptureList' && controlWrapper.closest("table").hasClass("editor-table") && !controlWrapper.closest("table.editor-table").hasClass("toolbar") && !controlWrapper.closest("tr").hasClass("footer") && !controlWrapper.closest("tr").hasClass("header"))
				{
					_ajaxCall.DragDrop._renderDummyData(controlWrapper);
				}
            }
		},

		_controlRequiresRerender: function (controlElem, propertylist, stylelist)
		{
			if (!$chk(propertylist) || typeof propertylist === typeof "")
			{
				var callStack = printStackTrace(null);

				popupManager.showError({
					message: Resources.ViewDesigner.MethodArgumentException.format("propertylist", "_setDisplayControlProperties", callStack.join("<br/>")),
					width: 400,
					height: 240
				});

				return;
			}

			if (typeof (controlElem) === "string")
			{
				controlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlElem + '"]');
			}

			var defaultPropertiesXml = controlElem.selectSingleNode("DefaultProperties");

			var propertyItems = propertylist.selectNodes("Property");

			for (var g = 0; g < propertyItems.length; g++)
			{
				var name = propertyItems[g].selectSingleNode("Name").text;
				var defaultPropEl = defaultPropertiesXml.selectSingleNode("Properties/Prop[@ID='" + name + "']");
				if (defaultPropEl)
				{
					var shouldRefreshDisplay = defaultPropEl.getAttribute("refreshdisplay");
					var setMethod = defaultPropEl.getAttribute("setFunction");
					if ((shouldRefreshDisplay && shouldRefreshDisplay.toLowerCase() === 'true') && !setMethod)
					{
						return true;
					}
				}
			}
			return false;
		},

		_checkViewNameExists: function (ViewName)
		{
			modalizer.show(true);

			var qs = {
				tofire: 'checkViewNameExists',
				viewname: ViewName
			};

			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				async: false,
				data: qs,
				cache: false
			};

			var data = jQuery.ajax(options).responseText;

			modalizer.hide();
			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				SourceCode.Forms.ExceptionHandler.handleException(data);
				return false;
			}
			else
			{
				if (data === 'true')
				{
					return false;
				}
				else
				{
					return true;
				}
			}
		},

		_getUniqueViewSystemName: function (ViewName)
		{
			modalizer.show(true);

			var qs = {
				tofire: 'getUniqueViewSystemName',
				viewname: ViewName
			};

			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				async: false,
				data: qs,
				cache: false
			};

			var data = jQuery.ajax(options).responseText;

			modalizer.hide();
			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				SourceCode.Forms.ExceptionHandler.handleException(data);
				return false;
			}
			else
			{
				return data;
			}
		},

		_showComplexPropertyPopup: function (e)
		{
			if (_ajaxCall.View.CheckOut._checkViewStatus())
			{
				var src = this;

				var ServerControl = src.getAttribute('ServerControl');
				var Init = src.getAttribute('InitializeServerControl');

				var divComplexProperty = jQuery('#divComplexProperty');
				divComplexProperty.html('&nbsp;');
				modalizer.show(true);

				var qs = {
					method: 'getComplexPropertyConfiguration',
					assemblyName: ServerControl,
					initFunction: Init
				};

				var options = {
					url: 'Utilities/AJAXCall.ashx',
					type: 'POST',
					data: qs,
					context: this,
					cache: false,
					success: function (data, textStatus)
					{
						_ajaxCall._showComplexPropertyPopupResult.call(this, data, textStatus, e.data.grid.valuexml, e.data.grid.controlid);
					},
					error: _ajaxCall._showComplexPropertyPopupFailure
				};

				jQuery.ajax(options);
			}
		},

		_showComplexPropertyPopupResult: function (data, textStatus, xml, controlId)
		{
			var divComplexProperty = jQuery('#divComplexProperty');
			var controlType = _ajaxCall.View._findControlFromSelectedObject().attr('controlType');
			var controlXML = _ajaxCall.ViewDesigner._getControlTypePropertyDefinition(controlType);
			var controlDefinitionXML = _ajaxCall.View.controlPropertiesXML.xml;

			// if controlXML is default properties, remove root node
			if (controlXML.tagName === "DefaultProperties")
			{
				controlXML = controlXML.selectSingleNode("Properties");
			}

			if (SourceCode.Forms.ExceptionHandler.isException(data))
			{
				//hide busy
				modalizer.hide();
				SourceCode.Forms.ExceptionHandler.handleException(data);
			}
			else
			{
				var xmlDoc = data;
				var htmlElem = xmlDoc.selectSingleNode('complexpropertypopup/html');
				divComplexProperty.append(jQuery(htmlElem.text));

				if ($chk(htmlElem.getAttribute('init')) === true)
				{
					var initFunction = htmlElem.getAttribute('init');
					var initParams = '()';

					initParams = eval(initFunction)(xml, controlXML.xml, controlDefinitionXML, controlType, SourceCode.Forms.Designers.View.ViewDesigner._closeComplexPropertyPopup, controlId);
				}
				divComplexProperty.css('display', 'block');

				//modalizer.hide();
			}
		},

		_showComplexPropertyPopupFailure: function (XMLHttpRequest, textStatus, errorThrown)
		{
			modalizer.hide();
			SourceCode.Forms.ExceptionHandler.handleException(errorThrown);
		},

		_saveView: function (checkIn, finishWizard, callback)
		{
			var viewxml = _ajaxCall.Styles.prepareStylesForSave();

			//[903859] When saving a View, _BuildViewXml() is called for validationo and it will remove toolbar layout node if it is empty.
			//Thus it will leave a orphaned toolbar cell and we need to remove it before saving the definition to the server side.
			_ajaxCall.ViewDesigner.removeOrphanedToolbarCell(viewxml);

			var qs = {
				tofire: 'saveView',
				checkin: checkIn,
				category: _ajaxCall.View.SelectedCategoryPath,
				xml: viewxml.xml
			};

			var options = {
				url: 'Views/AJAXCall.ashx',
				type: 'POST',
				data: qs,
				cache: false,
				dataType: "text",
				success: function (data, textStatus) { _ajaxCall._saveViewResult(data, textStatus, callback, finishWizard); },
				error: function (data, textStatus, errorThrown) { _ajaxCall._saveViewFailure(data, textStatus, errorThrown, callback); }
			};

			jQuery.ajax(options);
		},

		_saveViewResult: function (data, textStatus, callback, finishWizard)
		{
			var thisResponse = data;

			if (SourceCode.Forms.ExceptionHandler.isException(thisResponse))
			{
				SourceCode.Forms.ExceptionHandler.handleException(thisResponse);

				if (typeof callback === "function") callback(false);
			}
			else
			{
				_ajaxCall.View.OriginalViewName = _ajaxCall.ViewDesigner._GetViewName();
				_ajaxCall.View.IsViewEdit = true;
				//do we need to check for smo category id here ever?
				var category = jQuery("#viewcategoryId").val();
				if (typeof callback === "function") callback(true, "view", _ajaxCall.ViewDesigner._GetViewID(), category);
			}
		},

		_saveViewFailure: function (XMLHttpRequest, textStatus, errorThrown, callback)
		{
			SourceCode.Forms.ExceptionHandler.handleException(errorThrown);

			if (typeof callback === "function") callback(false);
		},

		_introSettingChanged: function (checked)
		{
			$.ajax({
				cache: false,
				data: $.param({ action: "setting", name: "DesignerIntro", value: checked }),
				dataType: "xml",
				url: "AppStudio/AJAXCall.ashx",
				type: "POST"
			});
		},

		_saveUserSettings: function ()
		{
			var viewType = _ajaxCall.ViewDesigner._getViewType();
			var viewSettingsXmlDoc = _ajaxCall.View.viewSettingsXmlDoc;
			var viewOptionsNode = viewSettingsXmlDoc.selectSingleNode("/ViewSettings/ViewOptions");

			var view = SourceCode.Forms.Designers.View;
			if (viewOptionsNode)
			{
				switch (viewType)
				{
					case "Capture":
						var captureViewSettings = viewOptionsNode.selectSingleNode("CaptureView");

						var columnsAmountEl = viewSettingsXmlDoc.createElement("ColumnsAmount");
						var rowsAmountEl = viewSettingsXmlDoc.createElement("RowsAmount");
						var labelPlacementEl = viewSettingsXmlDoc.createElement("LabelPlacement");
						var addColonsEl = viewSettingsXmlDoc.createElement("AddColons");
						var buttonPlacementEl = viewSettingsXmlDoc.createElement("ButtonPlacement");
						var generatedColumAmount = viewSettingsXmlDoc.createElement("GenerateColumnAmount");

						if (captureViewSettings !== null)
						{
							viewOptionsNode.removeChild(captureViewSettings);
						}

						captureViewSettings = viewSettingsXmlDoc.createElement("CaptureView");

						captureViewSettings.appendChild(columnsAmountEl);
						captureViewSettings.appendChild(rowsAmountEl);
						captureViewSettings.appendChild(labelPlacementEl);
						captureViewSettings.appendChild(addColonsEl);
						captureViewSettings.appendChild(buttonPlacementEl);
						captureViewSettings.appendChild(generatedColumAmount);

						viewOptionsNode.appendChild(captureViewSettings);

						columnsAmountEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.ColumnCount));
						rowsAmountEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.RowCount));
						labelPlacementEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.LabePlacementLeft ? "vdrbLabelTop" : "vdrbLabelLeft"));
						addColonsEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.AddSuffix));
						//buttonPlacementEl.appendChild(viewSettingsXmlDoc.createTextNode(jQuery("#vdrbButtonTypeStandard").is(":checked") ? "vdrbButtonTypeStandard" : "vdrbButtonTypeToolbar"));
						//generatedColumAmount.appendChild(viewSettingsXmlDoc.createTextNode(jQuery("#vdcolumnGeneration").val()));
						break;
					case "CaptureList":
						var captureListViewSettings = viewOptionsNode.selectSingleNode("CaptureListView");
						var addRowsEl = viewSettingsXmlDoc.createElement("AllowAddRows");
						var editRowsEl = viewSettingsXmlDoc.createElement("AllowEditRows");
						var removeRowsEl = viewSettingsXmlDoc.createElement("AllowRemoveRows");
						var reloadEl = viewSettingsXmlDoc.createElement("AllowListReload");
						var saveEl = viewSettingsXmlDoc.createElement("AllowListSave");
						var columnsAmountEl = viewSettingsXmlDoc.createElement("ColumnsAmount");

						if (captureListViewSettings !== null)
						{
							viewOptionsNode.removeChild(captureListViewSettings);
						}

						captureListViewSettings = viewSettingsXmlDoc.createElement("CaptureListView");
						captureListViewSettings.appendChild(addRowsEl);
						captureListViewSettings.appendChild(editRowsEl);
						captureListViewSettings.appendChild(removeRowsEl);
						captureListViewSettings.appendChild(reloadEl);
						captureListViewSettings.appendChild(saveEl);
						captureListViewSettings.appendChild(columnsAmountEl);
						viewOptionsNode.appendChild(captureListViewSettings);

						var columnsAmount = view.selectedOptions.ColumnCount;

						addRowsEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.UserAddRows === true ? "true" : "false"));
						editRowsEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.UserEditRows === true ? "true" : "false"));
						removeRowsEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.UserRemoveRows === true ? "true" : "false"));
						reloadEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.AllowUserRefresh === true ? "true" : "false"));

						columnsAmountEl.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.ColumnCount));

						// alternate rows
						if (view.selectedOptions.ShadeAlternatingRows === true)
						{
							var alternateRows = viewSettingsXmlDoc.createElement("AlternateRows");
							alternateRows.appendChild(viewSettingsXmlDoc.createTextNode("true"));
							captureListViewSettings.appendChild(alternateRows);
						}

						// bold headings
						if (view.selectedOptions.BoldHeadings === true)
						{
							var boldHeadings = viewSettingsXmlDoc.createElement("BoldHeadings");
							boldHeadings.appendChild(viewSettingsXmlDoc.createTextNode("true"));
							captureListViewSettings.appendChild(boldHeadings);
						}

						if (view.selectedOptions.EnablePaging === true && !view.selectedOptions.EnableListEditing)
						{
							var paging = viewSettingsXmlDoc.createElement("Paging");
							paging.appendChild(viewSettingsXmlDoc.createTextNode(view.selectedOptions.PagingCount));
							captureListViewSettings.appendChild(paging);
						}

						if (view.selectedOptions.EnableFiltering === true)
						{
							var showFilter = viewSettingsXmlDoc.createElement("ShowFilter");
							showFilter.appendChild(viewSettingsXmlDoc.createTextNode("true"));
							captureListViewSettings.appendChild(showFilter);
						}

						// List editing needs to be enabled
						if (view.selectedOptions.EnableListEditing === true && !view.selectedOptions.EnableAddRowLink)
						{
							var showAddRow = viewSettingsXmlDoc.createElement("HideAddRow");
							showAddRow.appendChild(viewSettingsXmlDoc.createTextNode("true"));
							captureListViewSettings.appendChild(showAddRow);
						}
						break;
					default:
						// TODO: LOG
						break;
				}
			}

			$("#hiddenViewSettings").val(viewSettingsXmlDoc.xml);

			$.ajax({
				cache: false,
				data: $.param({ action: "setting", name: "ViewSettings", value: viewSettingsXmlDoc.xml }),
				dataType: "xml",
				url: "AppStudio/AJAXCall.ashx",
				type: "POST"
			});
		}
	};
})(jQuery);
