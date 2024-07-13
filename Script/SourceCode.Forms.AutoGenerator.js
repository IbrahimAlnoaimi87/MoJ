//AutoGenerator
function AutoGenerator()
{
    ///<summary>
    ///AutoGenerator with 'Utilities/AJAXCall.ashx' and a blank pcategory
    ///</summary>
    this.ajaxSettings = {
        dataType: 'xml',
        url: 'Utilities/AJAXCall.ashx'
    };

    this.controlWriter = new ControlWriter();
    this.isSingleCat = true;
    this.formCategorySet = false;
    this["pcategory"] = {
        "id": null,
        "path": null
    };
}

//prototype
AutoGenerator.prototype = {
    //ToDo: Localize!
    //_getViewCreationOptions
    _getViewCreationOptions: function (pViewIds)
    {
        var _requestXml = parseXML("<Request/>");
        var _rootElement = _requestXml.documentElement;
        var _xnViews = _requestXml.createElement("Views");

        _rootElement.appendChild(_xnViews);

        for (var i = 0, _numViewIds = pViewIds.length; i < _numViewIds; i++)
        {
            var _xnView = _requestXml.createElement("View");

            _xnView.setAttribute("Id", pViewIds[i]);
            _xnViews.appendChild(_xnView);
        }

        var _self = this;
        var _popup = this.popup;
        _popup.find(".popup-body-content").overlay({ modal: true, icon: "loading" });

        jQuery.ajax(jQuery.extend({}, this.ajaxSettings, {
            "data": {
                "method": "getViewCreationOptions",
                "requestXml": _requestXml.xml
            },
            "success": function (pData, pTextStatus)
            {
                _popup.find(".popup-body-content").removeOverlay();

                if (SourceCode.Forms.ExceptionHandler.handleException(pData))
                {
                    _popup.find(".button-bar .button:nth-child(2)").addClass("disabled"); // Disable the OK button
                }
                else
                {
                    var _rootElement = pData.documentElement;
                    var _listView = _rootElement.getAttribute("ListView") === "T";
                    var _formListViewPair = _rootElement.getAttribute("FormListViewPair") === "T";

                    if (_listView || _formListViewPair)
                    {
                        var _jqViewLayoutSection = jQuery(document.getElementById("viewLayoutSection"));

                        if (_listView)
                            _jqViewLayoutSection.children(".list-view").checkbox("enabled");

                        if (_formListViewPair)
                            _jqViewLayoutSection.children(".formList-viewPair").checkbox("enabled");
                    }

                    if (_numViewIds > 0)
                        _self._setCategory(_rootElement.selectSingleNode("Categories"));
                }
            }.bind(_popup),
            "error": function (pXmlHttpRequest, pTextStatus, pErrorThrown)
            {
                _popup.find(".popup-body-content").removeOverlay();
                _popup["buttonbar"]["buttons"][0].disable();
                popupManager.showError([Resources.CommonPhrases.AutoGenUnableToComplete, "<br/><br/>[", pXmlHttpRequest.status, "] ", pXmlHttpRequest.statusText, " (", pTextStatus, ")"].join(''));
            }
        }));
    },

    //_getViewTypes
    _getViewTypes: function ()
    {
        var _viewTypes = this["viewTypes"];

        if (!checkExists(_viewTypes))
        {
            var _viewTypesXml = document.getElementById("supportedViewTypesXml");
            var _xdViewTypes = parseXML(_viewTypesXml.value);
            var _xnlViewType = _xdViewTypes.documentElement.selectNodes("ViewType");

            _viewTypes = [];

            for (var i = 0, _numViewTypes = _xnlViewType.length; i < _numViewTypes; i++)
            {
                var _xnViewType = _xnlViewType[i];
                var _xnDisplayName = _xnViewType.selectSingleNode("DisplayName");

                var _viewType = {
                    "name": _xnViewType.getAttribute("Name")
                };

                if (checkExists(_xnDisplayName))
                    _viewType["displayName"] = _xnDisplayName.text;

                _viewTypes[_viewTypes.length] = _viewType;
            }

            this["viewTypes"] = _viewTypes;
        }

        return _viewTypes;
    },

    //ToDo: Localize!
    //_createObject
    _createObject: function (pRequestDoc, pObjectType, pValidate)
    {
        var _requestEl;
        var _optionsEl;

        if (pValidate === undefined) pValidate = true;

        function __getRootElement()
        {
            if (_requestEl === undefined)
                _requestEl = pRequestDoc.documentElement;

            return _requestEl;
        }

        function __getOptionsElement()
        {
            if (_optionsEl === undefined)
                __getRootElement().insertBefore(_optionsEl = pRequestDoc.createElement("Options"), _requestEl.firstChild);

            return _optionsEl;
        }

        function __getOptionElement(pName, pVal)
        {
            var _optionEl = pRequestDoc.createElement(pName);

            _optionEl.setAttribute("Value", pVal);

            return _optionEl;
        }

        //FormBehaviorOptions
        var _loadFormListClick = (_loadFormListClick = document.getElementById("agLoadFormListClick")).checked && !_loadFormListClick.disabled;
        var _refreshListFormSubmit = (_refreshListFormSubmit = document.getElementById("agRefreshListFormSubmit")).checked && !_refreshListFormSubmit.disabled;
        var _refreshListFormLoad = (_refreshListFormLoad = document.getElementById("agRefreshListFormLoad")).checked && !_refreshListFormLoad.disabled;

        if (_loadFormListClick || _refreshListFormSubmit || _refreshListFormLoad)
        {
            var _formBehaviorOptionsEl = pRequestDoc.createElement("FormBehaviorOptions");

            __getOptionsElement().appendChild(_formBehaviorOptionsEl);

            if (_loadFormListClick)
                _formBehaviorOptionsEl.appendChild(__getOptionElement("FormBehaviorOption", "LoadFormListClick"));

            if (_refreshListFormSubmit)
                _formBehaviorOptionsEl.appendChild(__getOptionElement("FormBehaviorOption", "RefreshListFormSubmit"));

            if (_refreshListFormLoad)
                _formBehaviorOptionsEl.appendChild(__getOptionElement("FormBehaviorOption", "RefreshListFormLoad"));
        }

        //ViewCreationOptions
        var _formDisplayControls = document.getElementById("agFormDisplayControls");

        if (_formDisplayControls !== null && _formDisplayControls.checked && !_formDisplayControls.disabled)
        {
            var _viewCreationOptionsEl = pRequestDoc.createElement("ViewCreationOptions");

            __getOptionsElement().appendChild(_viewCreationOptionsEl);
            _viewCreationOptionsEl.appendChild(__getOptionElement("ViewCreationOption", "FormDisplayControls"));
        }

        var _self = this;
        var _popup = this.popup.find(".popup-body-content").overlay({ modal: true, icon: "loading" });

        function __ajaxCompleted()
        {
            jQuery("#autoGenerate_popup").find(".popup-body-content").removeOverlay();
        }

        jQuery.ajax(jQuery.extend({}, this.ajaxSettings, {
            "data": {
                "method": ["create", pObjectType].join(''),
                "requestXml": pRequestDoc.xml,
                "validate": pValidate
            },
            "type": "POST",
            "success": function (pData, pTextStatus)
            {
                __ajaxCompleted();

                if (!SourceCode.Forms.ExceptionHandler.handleException(pData))
                {
                    var _rootEl = pData.documentElement;

                    switch (_rootEl.nodeName)
                    {
                        case "success":

                            var viewCatId = _self["objectCategories"][0]["id"];
                            var formCatId = _self["pcategory"]["id"];

                            if (pObjectType === "Views")
                            {
                                if (this.isSingleCat)
                                {
                                    SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree("all", viewCatId, "");
                                }
                                else
                                {
                                    var cats = _self["objectCategories"];

                                    for (var i = 0; i < cats.length; i++)
                                    {
                                        SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree("all", _self["objectCategories"][i]["id"], "");
                                    }
                                }
                            }

                            if (pObjectType === "Form" || formCatId !== viewCatId)
                            {
                                SourceCode.Forms.Interfaces.AppStudio.UpdateStudioTree("all", formCatId, "");
                            }

                            var hash = jQuery.deparam(window.location.hash.substr(1));
                            if (hash.action === "list") SourceCode.Forms.Interfaces.AppStudio._performaction(hash);

                            popupManager.closeLast();

                            var action = _rootEl.getAttribute("Action");

                            if (action)
                            {
                                var formID = _rootEl.getAttribute('ID');

                                if (action === 'Edit')
                                {
                                    //SourceCode.Forms.Interfaces.AppStudio._launch('form', formID, formCatId);
                                    window.setTimeout(function ()
                                    {
                                        jQuery.history('add', jQuery.param({
                                            app: 'AppStudio',
                                            datatype: 'form',
                                            action: 'edit',
                                            guid: formID
                                        }));
                                    }, SourceCode.Forms.Browser.msie ? 250 : 0);
                                }
                                else
                                {
                                    jQuery.history('add', jQuery.param({
                                        app: 'AppStudio',
                                        datatype: 'form',
                                        action: 'run',
                                        guid: formID
                                    }));
                                }
                            }
                            break;

                        case "result":
                            // Validation Results
                            if (checkExists(pData.selectSingleNode("result/success")))
                            {
                                _self._createObject(pRequestDoc, pObjectType, false);
                            }
                            else
                            {
                                var warningNodes = pData.selectNodes("result/warning");
                                var warningMessage = "";

                                if (warningNodes.length === 1)
                                {
                                    // Single clashing item
                                    warningMessage = warningNodes[0].text;
                                }
                                else
                                {
                                    // Multiple clashing items
                                    warningMessage = Resources.MessageBox.NamesExistInTargetCategoryWarning + "<br/><br/><ul class=\"tree\">";

                                    for (var i = 0; i < warningNodes.length; i++)
                                    {
                                        warningMessage += "<li class=\"" + warningNodes[i].getAttribute("type") + "\"><a href=\"javascript:;\">" + warningNodes[i].getAttribute("name") + "</a></li>";
                                    }

                                    warningMessage += "</ul><br/>" + Resources.MessageBox.NamesExistInTargetCategoryExtendedWarning + "";
                                }

                                var popup = popupManager.showWarning({
                                    headerText: Resources.MessageBox.Warning,
                                    message: warningMessage
                                });
                                popup.removeClass("simple-message-content");
                            }

                            break;

                        case "DuplicateObject":
                            var _objectType = [_rootEl.getAttribute("Type") === "ViewObject" ? Resources.ObjectNames.SmartViewSingular : Resources.ObjectNames.SmartFormSingular].join('');

                            popupManager.showWarning(Resources.CommonPhrases.AutoGenObjectNameInUse.replace("{0}", _objectType).replace("{1}", _rootEl.selectSingleNode("Name").text).replace("{2}", _objectType));

                            break;

                        default:
                            popupManager.closeLast();
                    }

                }
            }.bind(_popup),
            "error": function (pXmlHttpRequest, pTextStatus, pErrorThrown)
            {
                __ajaxCompleted();
                popupManager.showError([Resources.CommonPhrases.AutoGenUnableToComplete, "<br/><br/>[", pXmlHttpRequest.status, "] ", pXmlHttpRequest.statusText, " (", pTextStatus, ")"].join(''));
            }
        }));
    },

    //ToDo: Localize!
    //_setFormData
    _setFormData: function (pRequestDoc, pFormEl)
    {
        var _actionAttrVal;

        if (document.getElementById("agEditForm").checked)
            _actionAttrVal = "Edit";
        else if (document.getElementById("agViewForm").checked)
            _actionAttrVal = "View";

        if (_actionAttrVal !== undefined)
            pFormEl.setAttribute("Action", _actionAttrVal);

        var _formNameVal = document.getElementById("agFormName").value.trim();

        if (_formNameVal.length === 0)
        {
            popupManager.showWarning(Resources.CommonPhrases.AutoGenProvideFormName);
            return false;
        }

        var _nameEl = pRequestDoc.createElement("Name");

        pFormEl.appendChild(_nameEl);
        _nameEl.appendChild(pRequestDoc.createCDATASection(_formNameVal));

        return true;
    },

    //ToDo: Localize!
    //_createViews
    _createViews: function (pObjectIds)
    {
        if (jQuery('#categoryDisplayPath').val().length === 0)
        {
            popupManager.showWarning(Resources.CommonPhrases.AutoGenSelectCategory);
            return;
        }

        var _requestDoc = parseXML("<Request/>");
        var _requestEl = _requestDoc.documentElement;
        var _objectsEl;
        var _objectEl;
        var _viewsEl;
        var _viewEl;
        var _nameEl;

        var _viewTypes = this["viewTypes"];
        var _numViewTypes = _viewTypes.length;

        var _appendId;
        var _createView;
        var _viewName;
        var _viewNameVal;

        for (var i = 0, _numObjects = pObjectIds.length; i < _numObjects; i++)
        {
            _viewsEl = null;

            for (var j = 0; j < _numViewTypes; j++)
            {
                _appendId = [i, j].join('_');
                _createView = document.getElementById(["agCreateView", _appendId].join(''));

                if (_createView.checked)
                {
                    _viewName = document.getElementById(["agViewName", _appendId].join(''));
                    _viewNameVal = _viewName.value.trim();

                    if (_viewNameVal.length === 0)
                    {
                        popupManager.showWarning(Resources.CommonPhrases.AutoGenProvideViewName);
                        return;
                    }

                    if (_viewsEl === null)
                        _viewsEl = _requestDoc.createElement("Views");

                    _viewsEl.appendChild(_viewEl = _requestDoc.createElement("View"));
                    _viewEl.setAttribute("Type", _viewTypes[j]["name"]);
                    _viewEl.appendChild(_nameEl = _requestDoc.createElement("Name"));
                    _nameEl.appendChild(_requestDoc.createCDATASection(_viewNameVal));
                }
            }

            if (_viewsEl !== null)
            {
                if (_objectsEl === undefined)
                    _requestEl.appendChild(_objectsEl = _requestDoc.createElement("Objects"));

                var _catEl = _requestDoc.createElement("Category");
                _catEl.appendChild(_requestDoc.createCDATASection(this["objectCategories"][i]["path"]));

                _objectsEl.appendChild(_objectEl = _requestDoc.createElement("Object"));
                _objectEl.setAttribute("Id", pObjectIds[i]);
                _objectEl.appendChild(_catEl);
                _objectEl.appendChild(_viewsEl);
            }
        }

        if (_objectsEl === undefined)
        {
            popupManager.showWarning(Resources.CommonPhrases.AutoGenSelectViewType);
            return;
        }

        if (document.getElementById("agCreateForm").checked)
        {
            var _formEl = _requestDoc.createElement("Form");

            var _catEl = _requestDoc.createElement("Category");
            _catEl.appendChild(_requestDoc.createCDATASection(this["pcategory"]["path"]));
            _formEl.appendChild(_catEl);

            _requestEl.appendChild(_formEl);

            if (this._setFormData(_requestDoc, _formEl) === false)
                return;
        }

        this._createObject(_requestDoc, "Views");
    },

    //_createForm
    _createForm: function (pViewIds)
    {
        if (jQuery('#agFormCategory').val().length === 0)
        {
            popupManager.showWarning(Resources.CommonPhrases.AutoGenSelectCategory);
            return;
        }

        var _requestDoc = parseXML("<Form/>");
        var _formEl = _requestDoc.documentElement;

        if (this._setFormData(_requestDoc, _formEl) === false)
            return;

        var _viewsEl = _requestDoc.createElement("Views");

        _formEl.appendChild(_viewsEl);

        var _catEl = _requestDoc.createElement("Category");
        _catEl.appendChild(_requestDoc.createCDATASection(this["pcategory"]["path"]));
        _formEl.appendChild(_catEl);

        var _viewEl;

        for (var i = 0, _numViews = pViewIds.length; i < _numViews; i++)
        {
            _viewsEl.appendChild(_viewEl = _requestDoc.createElement("View"));
            _viewEl.setAttribute("Id", pViewIds[i]);
        }

        this._createObject(_requestDoc, "Form");
    },

    //_renderOptionsLayout
    _renderOptionsLayout: function (pContentBase)
    {
        function __createLayoutSection(pId)
        {
            var _layoutSection = document.createElement("div");

            _layoutSection["id"] = pId;
            _layoutSection["className"] = "layoutSection";

            return _layoutSection;
        }

        var _layoutSections = {};

        pContentBase.appendChild(_layoutSections["form"] = __createLayoutSection("formLayoutSection"));
        pContentBase.appendChild(_layoutSections["view"] = __createLayoutSection("viewLayoutSection"));

        return _layoutSections;
    },

    //ToDo: Localize!
    //_renderFormCreationTitle
    _renderFormCreationTitle: function (pSectionBase)
    {
        var _controlWriter = this.controlWriter;

        pSectionBase.appendChild(_controlWriter.label(Resources.CommonLabels.AutoGenFormCreation));
        pSectionBase.appendChild(_controlWriter.lineBreak());
    },

    //ToDo: Localize!
    //_renderFormCreationOptions
    _renderFormCreationOptions: function (aSectionBase, aIsDisabled)
    {
        var _controlWriter = this.controlWriter;
        var _formField;
        var _formField2;
        var _self = this;

        var _layoutSection = document.createElement("div");

        _layoutSection["id"] = "formNameOptions";
        _layoutSection["className"] = "layoutSection";

        aSectionBase.appendChild(_layoutSection);

        _layoutSection.appendChild(_formField2 = _controlWriter.formField({
            forid: 'agFormCategory',
            label: Resources.CommonLabels.CommonFormLabel.replace("{0}", Resources.CommonLabels.Category)
        })[0]);

        _layoutSection.appendChild(_formField = _controlWriter.formField({
            forid: 'agFormName',
            label: Resources.CommonLabels.CommonFormLabel.replace("{0}", Resources.CommonLabels.FormName),
            required: true
        })[0]);

        _layoutSection.appendChild(_controlWriter.lineBreak());

        var _optionslayoutSection = document.createElement("div");

        _optionslayoutSection["id"] = "formCreationOptions";
        _optionslayoutSection["className"] = "layoutSection";

        aSectionBase.appendChild(_optionslayoutSection);

        var _radioBtnGrp = _controlWriter.radioButtonGroup().appendTo(_optionslayoutSection);

        _radioBtnGrp.radiobuttongroup('add', {
            disabled: aIsDisabled,
            checked: true,
            id: 'agSaveForm',
            label: Resources.CommonLabels.SaveForm,
            name: 'agFormAction'
        });

        _radioBtnGrp.radiobuttongroup('add', {
            disabled: aIsDisabled,
            id: 'agEditForm',
            label: Resources.CommonLabels.SaveAndEditForm,
            name: 'agFormAction'
        });

        _radioBtnGrp.radiobuttongroup('add', {
            disabled: aIsDisabled,
            id: 'agViewForm',
            label: Resources.CommonLabels.SaveAndViewForm,
            name: 'agFormAction'
        });

        _radioBtnGrp.find('label.input-control.radio').radiobutton();

        _formField.firstChild.nextSibling.appendChild(_controlWriter.textBox({
            id: 'agFormName',
            watermark: Resources.CommonPhrases.AutoGenFormNameWatermark
        })[0]);

        _formField2.firstChild.nextSibling.appendChild(_controlWriter.categoryLookup({
            "id": "agFormCategory",
            "objType": "category"
        }, function (ev, value)
        {
            if (value.catid && value.catname)
            {
                if (value.catid === 1 || value.catname.length === 0)
                {
                    delete _self["pcategory"];
                }
                else
                {
                    _self["pcategory"] = {
                        "id": value.catid,
                        "path": value.path
                    };

                    _self.formCategorySet = true;
                }
            }
        })[0]);

        var _txtBox = document.getElementById('agFormName');
        var _jqTxtBox = jQuery(_txtBox).textbox();

        if (aIsDisabled)
        {
            jQuery(_formField2).find('.lookup-box').addClass("disabled");
            _jqTxtBox.textbox('disable');
        }

        return [_txtBox, _formField2];
    },

    //ToDo: Localize!
    //_renderViewCreationOptions
    _renderViewCreationOptions: function (pSectionBase, pObjectCount)
    {
        var _controlWriter = this.controlWriter;

        pSectionBase.appendChild(_controlWriter.label(Resources.CommonLabels.AutoGenViewCreation));
        pSectionBase.appendChild(_controlWriter.lineBreak());
        pSectionBase.appendChild(_controlWriter.checkBox({
            "disabled": true,
            "id": "agFormDisplayControls",
            "label": Resources.CommonPhrases.AutoGenCreateItemUsingDisplayControls.replace("{0}", pObjectCount === 1 ? Resources.ObjectNames.SmartViewSingular : Resources.ObjectNames.SmartViewPlural)
        })[0]);
    },

    //ToDo: Localize!
    //ToDo: Set 'disabled: true' and only enable if at least one object is selected
    //_renderGeneralOptions
    _renderGeneralOptions: function (pSectionBase, pIsDisabled)
    {
        //		var _controlWriter = this.controlWriter;

        //		pSectionBase.appendChild(_controlWriter.label("General"));
        //		pSectionBase.appendChild(_controlWriter.lineBreak());

        //		pSectionBase.appendChild(_controlWriter.checkBox({
        //			"disabled": pIsDisabled,
        //			"id": "agRegenerateExistingEntities",
        //			"label": "Regenerate existing entities"
        //		})[0]);

        //		pSectionBase.appendChild(_controlWriter.lineBreak());
    },

    //ToDo: Localize!
    //_renderFormBehaviorOptions
    _renderFormBehaviorOptions: function (pSectionBase, pObjectCount)
    {
        var _controlWriter = this.controlWriter;

        pSectionBase.appendChild(_controlWriter.label(Resources.CommonLabels.AutoGenFormBehaviour));
        pSectionBase.appendChild(_controlWriter.lineBreak());

        var _singleObject = pObjectCount === 1;

        pSectionBase.appendChild(_controlWriter.checkBox({
            "checked": true,
            "disabled": true,
            "id": "agLoadFormListClick",
            "label": Resources.CommonPhrases.AutoGenLoadItemAssocListClick.replace("{0}", _singleObject ? Resources.ObjectNames.SmartViewSingular : Resources.ObjectNames.SmartViewPlural)
        }).addClass("formList-viewPair")[0]);

        pSectionBase.appendChild(_controlWriter.checkBox({
            "checked": true,
            "disabled": true,
            "id": "agRefreshListFormSubmit",
            "label": Resources.CommonPhrases.AutoGenRefreshListAssocListSubmit.replace("{0}", _singleObject ? Resources.ObjectNames.SmartViewSingular : Resources.ObjectNames.SmartViewPlural)
        }).addClass("formList-viewPair")[0]);

        pSectionBase.appendChild(_controlWriter.checkBox({
            "disabled": true,
            "checked": true,
            "id": "agRefreshListFormLoad",
            "label": Resources.CommonPhrases.AutoGenRefreshListFormLoad.replace("{0}", _singleObject ? Resources.ObjectNames.SmartViewSingular : Resources.ObjectNames.SmartViewPlural)
        }).addClass("list-view")[0]);
    },

    //ToDo: Localize!
    //_renderCategoryOptions
    _renderCategoryOptions: function ()
    {
        var _content = document.createElement("div");
        var _controlWriter = this.controlWriter;
        var _formField;
        var _panel;
        var _self = this;

        _content.appendChild(_panel = _controlWriter.panel({
            "header": Resources.ObjectNames.SmartViewPlural
        })[0]);

        _panel.firstChild.nextSibling.appendChild(_formField = _controlWriter.formField({
            "label": Resources.CommonLabels.CommonFormLabel.replace("{0}", Resources.CommonLabels.Category)
        })[0]);

        _formField.firstChild.nextSibling.appendChild(_controlWriter.categoryLookup({
            "id": "categoryDisplayPath",
            "objType": "category"
        }, function (ev, value)
        {
            var _displayPathVal;
            if (value.catid && value.catname)
            {
                if (value.catid === 1 || value.catname.length === 0)
                {
                    _displayPathVal = ["(", Resources.CommonPhrases.AutoGenUseSmoCat, ")"].join('');

                    _self.isSingleCat = false;
                }
                else
                {
                    var categories = _self["objectCategories"];

                    for (var i = 0; i < categories.length; i++)
                    {
                        categories[i] = {
                            "id": value.catid,
                            "path": value.path
                        };
                    }
                    _displayPathVal = value.path;

                    _self.isSingleCat = true;

                    if (!_self.formCategorySet)
                    {
                        _self["pcategory"] = {
                            "id": value.catid,
                            "path": value.path
                        };
                        document.getElementById("agFormCategory").value = _displayPathVal;
                    }
                }
            }
        })[0]);

        return _content;
    },

    //_toArray
    _toArray: function (pObject)
    {
        return typeof pObject === "string" ? [pObject] : pObject;
    },

    //_isViewChecked
    _isViewChecked: function (pType)
    {
        return this.popup.find(".popup-body").find(["input.", pType, ":checked"].join('')).length !== 0;
    },

    //_isViewIntegrationPairChecked
    _isViewIntegrationPairChecked: function ()
    {
        var _jqInputs = this.popup.find(".popup-body").find("input[class~=Capture],[class~=List]");
        var _numInputs = _jqInputs.length;

        for (var i = 0; i < _numInputs; i += 2)
            if (_jqInputs.eq(i).is(":checked") && _jqInputs.eq(i + 1).is(":checked"))
                return true;

        return false;
    },

    //_isCaptureViewChecked
    _isCaptureViewChecked: function ()
    {
        return this._isViewChecked("Capture");
    },

    //_isListViewChecked
    _isListViewChecked: function ()
    {
        return this._isViewChecked("List");
    },

    //_setCategory
    _setCategory: function (pEl)
    {
        var _categories = pEl.selectNodes("Category");

        this["objectCategories"] = [];

        if (_categories.length > 0)
        {
            this.isSingleCat = true;

            var initialCat = _categories[0].getAttribute("Id");
            var formCatFullPath = _categories[0].selectSingleNode("FullPath").text;
            var viewCatFullPath = formCatFullPath;
            var formCatPath = _categories[0].selectSingleNode("Path").text;

            for (var i = 0; i < _categories.length; i++)
            {
                var catId = _categories[i].getAttribute("Id");

                if (this.isSingleCat && catId !== initialCat)
                {
                    this.isSingleCat = false;
                }

                this["objectCategories"][i] = { "id": catId, "path": _categories[i].selectSingleNode("Path").text };
            }

            if (!this.isSingleCat)
            {
                jQuery("#categoryDisplayPath").val(["(", Resources.CommonPhrases.AutoGenUseSmoCat, ")"].join('')).closest(".input-control.icon-control").addClass("category");
            }
            else
            {
                jQuery("#categoryDisplayPath_base").categorylookup("value", { catid: catId }).closest(".input-control.icon-control").addClass("category");
            }
            jQuery("#agFormCategory_base").categorylookup("value", { catid: initialCat }).closest(".input-control.icon-control").addClass("category");
            this["pcategory"] = {
                "id": initialCat,
                "path": formCatPath
            };
        }
    },

    //_setObjectInfo
    _setObjectInfo: function (pEl, objectIds, viewTypes)
    {
        var _objects = pEl.selectNodes("Object");

        var _objectInfo = [];

        if (_objects.length > 0)
        {
            for (var i = 0; i < _objects.length; i++)
            {
                var hasListMethods = _objects[i].getAttribute("HasListMethods");
                var hasScalarMethods = _objects[i].getAttribute("HasScalarMethods");

                _objectInfo[i] =
				{
				    "id": _objects[i].getAttribute("Id"),
				    "hasListMethods": hasListMethods ? true : false,
				    "hasScalarMethods": hasScalarMethods ? true : false
				};

                this._checkSupportedViewType(objectIds, viewTypes, _objectInfo);
            }
        }
    },

    //_isPopupClosed
    _isPopupClosed: function ()
    {
        return document.getElementById("autoGenerate_popup") === null;
    },

    //_getObjectCategory
    _getObjectCategory: function (pObjectIds)
    {
        var _self = this;
        var _jqCategoryDisplayPath = jQuery(document.getElementById("categoryDisplayPath_base")).modalize(true);
        var _jqPopupButtonOK = jQuery(document.getElementById("popupButton_Ok")).modalize(true);

        var pObjectIdsString = "";

        for (var i = 0; i < pObjectIds.length; i++)
        {
            if (i > 0) pObjectIdsString += "|";

            pObjectIdsString += pObjectIds[i];
        }

        function __ajaxCompleted()
        {
            _jqCategoryDisplayPath.modalize(false);
            _jqPopupButtonOK.modalize(false);
        }

        jQuery.ajax(jQuery.extend({}, this.ajaxSettings, {
            "data": {
                "method": "getObjectCategories",
                "objectIds": pObjectIdsString
            },
            "success": function (pData, pTextStatus)
            {

                if (!SourceCode.Forms.ExceptionHandler.handleException(pData))
                    _self._setCategory(pData.documentElement);

                if (_self._isPopupClosed())
                    return;

                __ajaxCompleted();

            },
            "error": function (pXmlHttpRequest, pTextStatus, pErrorThrown)
            {
                if (_self._isPopupClosed())
                    return;

                __ajaxCompleted();
                popupManager.showError([Resources.CommonPhrases.AutoGenUnableToGetSmoCat, "<br/><br/>[", pXmlHttpRequest.status, "] ", pXmlHttpRequest.statusText, " (", pTextStatus, ")"].join(''));
            }
        }));
    },

    _getObjectInfo: function (pObjectIds, viewTypes)
    {
        var _self = this;
        var _jqPopupButtonOK = jQuery(document.getElementById("popupButton_Ok")).modalize(true);

        var pObjectIdsString = "";

        for (var i = 0; i < pObjectIds.length; i++)
        {
            if (i > 0) pObjectIdsString += "|";

            pObjectIdsString += pObjectIds[i];
        }

        function __ajaxCompleted()
        {
            _jqPopupButtonOK.modalize(false);
        }

        jQuery.ajax(jQuery.extend({}, this.ajaxSettings, {
            "data": {
                "method": "getObjectInfo",
                "objectIds": pObjectIdsString
            },
            "success": function (pData, pTextStatus)
            {

                if (!SourceCode.Forms.ExceptionHandler.handleException(pData))
                {
                    _self._setObjectInfo(pData.documentElement, pObjectIds, viewTypes);
                }

                if (_self._isPopupClosed())
                    return;

                __ajaxCompleted();

            },
            "error": function (pXmlHttpRequest, pTextStatus, pErrorThrown)
            {
                if (_self._isPopupClosed())
                    return;

                __ajaxCompleted();
                popupManager.showError([Resources.CommonPhrases.AutoGenUnableToGetSmoCat, "<br/><br/>[", pXmlHttpRequest.status, "] ", pXmlHttpRequest.statusText, " (", pTextStatus, ")"].join(''));
            }
        }));
    },

    //createForm
    createForm: function (pViewIds, pViewName)
    {
        this.formCategorySet = false;

        var _viewIds = this._toArray(pViewIds);
        var _numViews = _viewIds.length;
        var _panel = this.controlWriter.panel();
        var _wrapper = _panel.children(".panel-body").find(".panel-body-wrapper > .scroll-wrapper, .panel-body-wrapper > .wrapper").eq(0)[0];
        var _layoutSections = this._renderOptionsLayout(_wrapper);
        var _formLayoutSection = _layoutSections["form"];

        this._renderFormCreationTitle(_formLayoutSection);

        var _viewLayoutSection = _layoutSections["view"];

        this._renderGeneralOptions(_viewLayoutSection);
        this._renderFormBehaviorOptions(_viewLayoutSection, _numViews);

        var _self = this;

        this.popup = popupManager.showPopup({
            "removeContent": true,
            "id": "autoGenerate_popup",
            "buttons":
			[
				{
				    type: "help",
				    click: function () { HelpHelper.runHelp(7043); }
				},
				{
				    "text": Resources.WizardButtons.OKButtonText,
				    "click": function ()
				    {
				        if (!$(this).hasClass("disabled"))
				        {
				            _self._createForm(_viewIds);
				        }
				    }
				},
				{
				    "id": "popupButton_Cancel",
				    "text": Resources.WizardButtons.CancelButtonText
				}
			],
            "closeWith": "popupButton_Cancel",
            "headerText": Resources.CommonActions.GenerateObjectTextSmartFormSingular,
            "content": _panel[0],
            "width": 900,
            "height": 271,
            "draggable": true
        });

        var _formName = this._renderFormCreationOptions(_formLayoutSection, false)[0];

        if (_numViews === 1)
            _formName.value = pViewName;

        this._getViewCreationOptions(_viewIds);

        _formName.focus();
    },

    _checkSupportedViewType: function (objectIds, viewTypes, objectInfo)
    {
        var _objectCount = objectIds.length;
        var _viewTypeCount = viewTypes.length;

        for (i = 0; i < _objectCount; i++)
        {
            for (var j = 0; j < _viewTypeCount; j++)
            {
                if (objectInfo)
                {
                    for (k = 0; k < objectInfo.length; k++)
                    {
                        if (objectInfo[k].id === objectIds[i])
                        {
                            if (viewTypes[j].name === "Capture")
                            {
                                if (!objectInfo[k].hasScalarMethods)
                                    jQuery("#agCreateView".concat(i, '_', j)).checkbox('disabled');
                            }
                            else if (viewTypes[j].name === "List")
                            {
                                if (!objectInfo[k].hasListMethods)
                                    jQuery("#agCreateView".concat(i, '_', j)).checkbox('disabled');
                            }
                            else
                            {
                                jQuery("#agCreateView".concat(i, '_', j)).checkbox('disabled');
                            }
                        }
                    }
                }
            }
        }
    },

    //createViews
    createViews: function (objectIds, objectNames)
    {
        this.formCategorySet = false;

        var _objectIds = this._toArray(objectIds);
        var _objectCount = _objectIds.length;
        this._getObjectCategory(_objectIds);
        var _content = this._renderCategoryOptions();
        var _popupWidth = 900;
        var _this = this;
        var rtl = document.documentElement.getAttribute("dir") === "rtl" || false;

        this.popup = popupManager.showPopup({
            buttons: [
				{
				    type: "help",
				    click: function () { HelpHelper.runHelp(7028); }
				},
				{
				    click: function ()
				    {
				        if (!$(this).hasClass("disabled"))
				        {
				            _this._createViews(_objectIds);
				        }
				    },
				    id: 'popupButton_Ok',
				    text: Resources.WizardButtons.OKButtonText
				}, {
				    id: 'popupButton_Cancel',
				    text: Resources.WizardButtons.CancelButtonText
				}],
            closeWith: 'popupButton_Cancel',
            content: _content,
            draggable: true,
            headerText: Resources.CommonActions.GenerateObjectTextOptionsPlural,
            height: (formDesignerEnabled) ? 533 : 297,
            id: 'autoGenerate_popup',
            removeContent: true,
            width: _popupWidth
        });

        var _columns = [{
            hidden: true
        }, {
            display: 'SmartObject',
            modulus: true,
            width: "1px",
            resizable: false
        }];

        var _viewTypes = this._getViewTypes();
        var _viewTypeCount = _viewTypes.length;
        var _columnWidth = Math.floor((_popupWidth - 150) / _viewTypeCount);

        for (var i = 0; i < _viewTypeCount; i++)
            _columns.push({
                display: _viewTypes[i].displayName,
                width: _columnWidth + "px",
                resizable: false
            });

        var $grid = jQuery(SCGrid.html({
            columns: _columns,
            fullsize: true
        })).grid({
            multiline: false
        });

        _content.appendChild($grid.height(169).get(0));

        var _controlWriter = this.controlWriter;
        var _objectNames = this._toArray(objectNames);

        for (i = 0; i < _objectCount; i++)
        {
            var _rowData = [_objectIds[i], {
                icon: 'smartobject',
                display: _objectNames[i].htmlEncode()
            }];

            for (var j = 0; j < _viewTypeCount; j++)
            {
                var $checkBox = _controlWriter.checkBox({
                    id: 'agCreateView'.concat(i, '_', j)
                }).css('float', rtl ? 'right' : 'left');

                $checkBox.find('input').addClass(_viewTypes[j].name);

                var $textBox = _controlWriter.textBox({
                    id: 'agViewName'.concat(i, '_', j)
                }).css('float', rtl ? 'right' : 'left').css('width', (_columnWidth - 23) + 'px');

                _rowData.push({
                    html: jQuery(document.createElement('div')).append($checkBox).append($textBox).html(),
                    cellclass: 'edit-mode'
                });
            }

            $grid.grid('add', 'row', _rowData, false);
        }

        this._getObjectInfo(_objectIds, _viewTypes);

        $grid.grid('synccolumns').find('.text-input').textbox().textbox('disable');

        var _panel = _controlWriter.panel({
            "header": Resources.ObjectNames.SmartFormSingular
        });

        _content.appendChild(_panel[0]);

        var _wrapper = _panel.children(".panel-body").find(".panel-body-wrapper > .scroll-wrapper, .panel-body-wrapper > .wrapper").eq(0)[0];
        jQuery(_panel.children(".panel-body")).css({ "height": "152px" });

        var _layoutSections = this._renderOptionsLayout(_wrapper);
        var _formLayoutSection = _layoutSections.form;

        var checkbox;

        _formLayoutSection.appendChild(checkbox = _controlWriter.checkBox({
            id: 'agCreateForm',
            label: 'Generate Form'
        }).get(0));

        _formLayoutSection.appendChild(_controlWriter.lineBreak());

        var _formCreation = this._renderFormCreationOptions(_formLayoutSection, true, _objectCount);
        var _formNameEl = _formCreation[0];
        var _formCatEl = _formCreation[1];
        var _viewLayoutSection = _layoutSections.view;

        this._renderGeneralOptions(_viewLayoutSection, false); //DEBUG: Set to 'true'
        this._renderFormBehaviorOptions(_viewLayoutSection, _objectCount);

        $(_viewLayoutSection).css({ "margin-top": "2px" }); // overwrite to maintain text alignment with _formLayoutSection
        _viewLayoutSection.appendChild(_controlWriter.lineBreak());

        this._renderViewCreationOptions(_viewLayoutSection, _objectCount);

        $grid.find('.checkbox').on('click', function ()
        {
            var $createViewControl = jQuery(this);
            var $createView = $createViewControl.find('input');
            var _isChecked = $createView.is(':checked');

            if ($createView.is('.Capture'))
            {
                var $formDisplayControls = jQuery(document.getElementById('agFormDisplayControls_base'));

                if (_isChecked)
                    $formDisplayControls.checkbox('enabled');
                else if (!_this._isCaptureViewChecked())
                    $formDisplayControls.checkbox('disabled');
            }

            var _createForm = jQuery(document.getElementById('agCreateForm')).is(':checked');

            if ($createView.is('.List'))
            {
                var $refreshListFormLoad = jQuery(document.getElementById('agRefreshListFormLoad_base'));

                if (_isChecked && _createForm)
                    $refreshListFormLoad.checkbox('enabled');
                else if (!_this._isListViewChecked())
                    $refreshListFormLoad.checkbox('disabled');
            }

            var $viewNameControl = $createViewControl.next().textbox(_isChecked ? 'enable' : 'disable');

            if (_isChecked)
            {
                $viewNameControl.find('input').trigger("focus");

                if (_this._isViewIntegrationPairChecked() && _createForm)
                    jQuery([document.getElementById('agLoadFormListClick_base'), document.getElementById('agRefreshListFormSubmit_base')]).checkbox('enabled');
            }
            else if (!_this._isCaptureViewChecked() || !_this._isListViewChecked() || !_createForm || !_this._isViewIntegrationPairChecked())
                jQuery([document.getElementById('agLoadFormListClick_base'), document.getElementById('agRefreshListFormSubmit_base')]).checkbox('disabled');
        });

        jQuery('#agCreateForm').on('click', function ()
        {
            var _isChecked = jQuery(this).is(':checked');

            jQuery([document.getElementById('agSaveForm_base'), document.getElementById('agEditForm_base'), document.getElementById('agViewForm_base')]).radiobutton(_isChecked ? 'enabled' : 'disabled');

            jQuery(_formCatEl).find('.lookup-box').removeClass("disabled");

            var $formName = jQuery(_formNameEl).textbox(_isChecked ? 'enable' : 'disable');
            jQuery(_formNameEl).textbox(_isChecked ? 'enable' : 'disable');

            if (_isChecked)
            {
                $formName.trigger("focus");

                if (_this._isListViewChecked())
                {
                    jQuery(document.getElementById('agRefreshListFormLoad_base')).checkbox('enabled');

                    if (_this._isViewIntegrationPairChecked())
                        jQuery([document.getElementById('agLoadFormListClick_base'), document.getElementById('agRefreshListFormSubmit_base')]).checkbox('enabled');
                }

            }
            else
            {
                jQuery([document.getElementById('agRefreshListFormLoad_base'), document.getElementById('agLoadFormListClick_base'), document.getElementById('agRefreshListFormSubmit_base')]).checkbox('disabled');
                jQuery(document.getElementById("selectFormCategory")).off('click');
            }
        });

        for (i = 0; i < _objectCount; i++)
            for (j = 0; j < _viewTypeCount; j++)
            {
                var name = (checkExists(_objectNames[i])) ? _objectNames[i] : "";
                document.getElementById('agViewName'.concat(i, '_', j)).value = name.concat(' ', _viewTypes[j].displayName);
            }

        if (_objectCount === 1)
        {
            _formNameEl.value = _objectNames[0];
            jQuery(_formNameEl).textbox().trigger("focus");
        }

        if (!(formDesignerEnabled))
        {
            _panel.hide();
        }
    }
};
