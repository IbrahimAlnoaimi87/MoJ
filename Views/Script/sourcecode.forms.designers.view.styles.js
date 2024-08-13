(function ($)
{

    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};
    if (typeof SourceCode.Forms.Designers.View === "undefined" || SourceCode.Forms.Designers.View === null) SourceCode.Forms.Designers.View = {};

    var _styles = SourceCode.Forms.Designers.View.Styles =
    {
        _exclusiveClassStyles: {
            "textalign": "align-left align-right align-center",
            "verticalalign" : "align-top align-middle align-bottom"
        },

        //applies a class for a style, rather than an inline style. uses format ".align-middle" or ".format-color"
        _applyExclusiveClassesForKey: function (jqElement, classesKey, value)
        {
            var key = classesKey.toLowerCase();
            var removeClasses = this._exclusiveClassStyles[key];
            jqElement.removeClass(removeClasses);
            var strClassPrefix = (key.indexOf('align') > 0) ? "align" : "format";
            jqElement.addClass(strClassPrefix + "-" + value.toLowerCase());
        },


        _showEditConditionalStyles: function (options)
        {
            _styles.complexOptions = options;
            jQuery("body").showBusyModal(true);
            setTimeout(_styles._showEditConditionalStylesInternal, 40);
        },

        _showEditConditionalStylesInternal: function ()
        {
            //required to add the control correctly to the conditions screen
            _styles.ViewDesigner._BuildViewXML();
            var control = _styles._getSelectedControl();

            if ($chk(control) === false) return;
            var controlToModalize = jQuery("body")

            var viewControl = _styles._getViewControlObject(control);

            //BEGIN this is required to popup the StyleBuilder later
            var availableStylesCollection = _styles._getControlDefinitionAvailableStyles(viewControl.controltype);
            var defaultStylesCollection = _styles._getControlDefinitionDefaultStyles(viewControl.controltype);
            var customStylesCollection = _styles._getStylesNode(viewControl.controlid, viewControl.controltype, null, viewControl.propertyType);

            var customStyleNode = null;
            var availableStyleNode = null;
            var defaultStyleNode = null;

            if (defaultStylesCollection)
                defaultStyleNode = SCStyleHelper.getPrimaryStyleNode(defaultStylesCollection);

            if (customStylesCollection)
                customStyleNode = SCStyleHelper.getPrimaryStyleNode(customStylesCollection);

            if (availableStylesCollection)
                availableStyleNode = SCStyleHelper.getPrimaryStyleNode(availableStylesCollection);

            _styles.defaultStylesCollection = defaultStylesCollection;
            //END this is required to popup the StyleBuilder later


            //find the ConditionalStyles
            var conditionalStylesNode = _styles._getConditionalStylesNode(viewControl.controlid)
            if (!conditionalStylesNode)
                conditionalStylesNode = SCStyleHelper.tempXml().createElement("ConditionalStyles");
            else
                conditionalStylesNode = conditionalStylesNode.cloneNode(true);

            //add the control styles node as control style that has no conditions
            var unconditionalStylesNode = conditionalStylesNode.ownerDocument.createElement("ConditionalStyle");
            var nameNode = conditionalStylesNode.ownerDocument.createElement("Name");
            unconditionalStylesNode.appendChild(nameNode);
            if (customStylesCollection)
                unconditionalStylesNode.appendChild(customStylesCollection.cloneNode(true));
            conditionalStylesNode.appendChild(unconditionalStylesNode);

            var options =
            {
                viewControl: viewControl,
                availableStylesCollection: availableStylesCollection,
                availableStylesNode: availableStyleNode,
                defaultStylesCollection: defaultStylesCollection,
                defaultStyleNode: defaultStyleNode,
                conditionalStylesNode: conditionalStylesNode,
                onWidgetReturned: _styles._conditionalFormattingReturned.bind(_styles),
                modalizedControl: controlToModalize
            }
            SCConditionalFormatting.load(options);
            SCConditionalFormatting.showDialog();
        },

        _showEditStyles: function (options)
        {
            _styles.complexOptions = options;
            jQuery("body").showBusyModal(true);
            setTimeout(_styles._showEditStylesInternal, 40);
        },

        _showEditStylesInternal: function ()
        {
            var control = _styles._getSelectedControl();
            if ($chk(control) === false) return;
            var controlToModalize = jQuery("body");
            controlToModalize.showBusyModal(true);

            var viewControl = _styles._getViewControlObject(control);

            var availableStylesCollection = _styles._getControlDefinitionAvailableStyles(viewControl.controltype);
            var defaultStylesCollection = _styles._getControlDefinitionDefaultStyles(viewControl.controltype);
            var customStylesCollection = _styles._getStylesNode(viewControl.controlid, viewControl.controltype, null, viewControl.propertyType).cloneNode(true);

            _styles.defaultStylesCollection = defaultStylesCollection;

            var customStyleNode = null;
            var availableStyleNode = null;
            var defaultStyleNode = null;
            //find the default style
            //in future will find a style node by name

            if (defaultStylesCollection)
                defaultStyleNode = SCStyleHelper.getPrimaryStyleNode(defaultStylesCollection);

            if (customStylesCollection)
                customStyleNode = SCStyleHelper.getPrimaryStyleNode(customStylesCollection);

            if (availableStylesCollection)
                availableStyleNode = SCStyleHelper.getPrimaryStyleNode(availableStylesCollection);

            var options =
            {
                viewControl: viewControl,
                availableStylesNode: availableStyleNode,
                defaultStyleNode: defaultStyleNode,
                customStylesXml: customStylesCollection,
                customStyleNode: customStyleNode,
                onWidgetReturned: _styles._styleBuilderReturned.bind(_styles),
                modalizedControl: controlToModalize
            }

            SCStyleBuilder.load(options);
            SCStyleBuilder.showDialog();
        },

        _styleBuilderReturned: function (notCancelled, mergedStyles)
        {
            if (notCancelled)
            {
                var control = _styles._getSelectedControl();
                var viewControl = _styles._getViewControlObject(control);
                var controlNode = this._getControlNode(viewControl.controlid);

                var customStylesCollection = _styles._getStylesNode(viewControl.controlid, viewControl.controltype, null, viewControl.propertyType);
                if (customStylesCollection)
                    customStyleNode = SCStyleHelper.getPrimaryStyleNode(customStylesCollection);
                if (customStyleNode)
                    customStylesCollection.removeChild(customStyleNode);

                customStylesCollection.appendChild(mergedStyles);

                //re-render the control with the new styles
                var styles = customStylesCollection;
                //var properties = controlNode.selectSingleNode("Properties");

                //properties hack
                var propertyGridXml = parseXML(_styles.View.propertyGrid.valuexml);
                var propertyGridControlNode = propertyGridXml.selectSingleNode("Controls/Control[@ID='{0}']".format(viewControl.controlid));
                var properties = propertyGridControlNode.selectSingleNode("Properties");
                var propertyGridCustomStylesCollection = _styles._getStylesNode(viewControl.controlid, viewControl.controltype, propertyGridControlNode);
                var propertyGridCustomStyleNode = SCStyleHelper.getPrimaryStyleNode(propertyGridCustomStylesCollection);
                if (propertyGridCustomStyleNode)
                    propertyGridCustomStylesCollection.removeChild(propertyGridCustomStyleNode);
                propertyGridCustomStylesCollection.appendChild(mergedStyles.cloneNode(true));
                _styles.View.propertyGrid.valuexml = propertyGridXml.xml;
                //properties hack

                switch (viewControl.controltype)
                {
                    case "Column":
                        var cellIndex = control[0].cellIndex;
                        _styles.populateColumnControlStyle(cellIndex, SCStyleHelper.getPrimaryStyleNode(styles));
                        break;
                    case "Cell":
                        SFCTable.setCellStyles(viewControl.control, styles);
                        break;
                    case "Table":
                        SFCTable.setStyles(viewControl.control, styles);
                        break;
                    default:
                        if (checkExists(SourceCode.Forms.Designers.View.ContructDataTypeSet))
                            SourceCode.Forms.Designers.View.ContructDataTypeSet[viewControl.controlid] = null;
                        _styles.AJAXCall._initControlProperties(viewControl.controlid, viewControl.controltype, properties, styles);
                        break;
                }

                if (control.closest("td").is(".header"))
                {
                    _styles.populateListHeadingControlStyle(control, SCStyleHelper.getPrimaryStyleNode(styles));

                }

                if (checkExists(_styles.complexOptions))
                {
                    var isDefault = _styles._isDefaultStyleInternal(_styles.defaultStylesCollection, styles);

                    var lookupInput = $(_styles.complexOptions.propertySelector.format("styles", " input"))
                    if (isDefault)
                        lookupInput.val(Resources.Filtering.DefaultStyleName);
                    else
                        lookupInput.val(Resources.CommonLabels.CustomStyleLabel);
                }

                SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlStyleChanged", control);
            }            
        },

        _conditionalFormattingReturned: function (notCancelled, xml)
        {
            if (notCancelled)
            {
                var control = _styles._getSelectedControl();
                var viewControl = _styles._getViewControlObject(control);

                var condtionalStyles = xml.selectSingleNode("ConditionalStyles");
                if (checkExists(condtionalStyles))
                {
                    var conditionInvalid = condtionalStyles.selectSingleNode(".//Condition[@Resolved]");
                    if (checkExists(conditionInvalid) && $chk(condtionalStyles) === true)
                    {
                        popupManager.showError(Resources.Designers.InvalidConditionalStyles);
                        return false;
                    } else
                    {
                        //begin pull out default style and save as normal style
                        var defaultConditionalStyleElem = condtionalStyles.selectSingleNode('ConditionalStyle[Name=""]');
                        var conditionStyleCollection = defaultConditionalStyleElem.selectSingleNode("Styles");

                        var customStylesCollection = _styles._getStylesNode(viewControl.controlid, viewControl.controltype);
                        var parent = customStylesCollection.parentNode;
                        parent.removeChild(customStylesCollection);

                        var newStylesCollection = conditionStyleCollection.cloneNode(true);
                        parent.appendChild(newStylesCollection);

                        this._styleBuilderReturned(true, SCStyleHelper.getPrimaryStyleNode(newStylesCollection));

                        condtionalStyles.removeChild(defaultConditionalStyleElem);
                        //end pull out default style and save as normal style

                        //save styles to xml container
                        var controlNode = this._getControlNode(viewControl.controlid);
                        var existingConditionalStyles = controlNode.selectSingleNode('ConditionalStyles');

                        if (existingConditionalStyles)
                            controlNode.removeChild(existingConditionalStyles);

                        controlNode.appendChild(condtionalStyles.cloneNode(true));

                        SourceCode.Forms.DependencyHelper.removeInvalidConditionalStylesAnnotationForControl(controlNode);

                        SourceCode.Forms.Designers.Common.refreshBadgeForControls([controlNode.getAttribute("ID")]);

                        //properties hack
                        var propertyGridXml = parseXML(_styles.View.propertyGrid.valuexml);
                        var propertyGridControlNode = propertyGridXml.selectSingleNode("Controls/Control[@ID='{0}']".format(viewControl.controlid));
                        var properties = propertyGridControlNode.selectSingleNode("Properties");
                        var propertyGridExistingConditionalStyles = propertyGridControlNode.selectSingleNode('ConditionalStyles');
                        if (propertyGridExistingConditionalStyles)
                            propertyGridControlNode.removeChild(propertyGridExistingConditionalStyles);
                        propertyGridControlNode.appendChild(condtionalStyles.cloneNode(true));
                        _styles.View.propertyGrid.valuexml = propertyGridXml.xml;
                        //properties hack

                        //Refresh the property grid so the error badges get re-drawn
                        _styles.ViewDesigner._showControlProperties(true);
                    }
                }

                var isDefault = this._isDefaultConditionInternal(condtionalStyles);
                var lookupInput = $(_styles.complexOptions.propertySelector.format("conditionalstyles", " input"));
                if (isDefault)
                    lookupInput.val(Resources.Filtering.DefaultStyleName);
                else
                    lookupInput.val(Resources.CommonLabels.CustomStyleLabel);
                popupManager.closeLast({ cancelOnClose: true });

            }
        },

        //Form / View specific
        isDefaultStyle: function ()
        {
            var control = _styles._getSelectedControl();

            var viewControl = _styles._getViewControlObject(control);

            var defaultStylesCollection = _styles._getControlDefinitionDefaultStyles(viewControl.controltype);
            var customStylesCollection = _styles._getStylesNode(viewControl.controlid, viewControl.controltype, null, viewControl.propertyType);

            return _styles._isDefaultStyleInternal(defaultStylesCollection, customStylesCollection);
        },

        //shared
        _isDefaultStyleInternal: function (defaultStylesCollection, mergedStyles)
        {
            if (!checkExists(defaultStylesCollection) && !checkExists(mergedStyles))
            {
                return true;
            }
            var customStyleCollection = SCStyleHelper.getStylesDelta(defaultStylesCollection, mergedStyles);
            return (!checkExists(customStyleCollection) || customStyleCollection.selectNodes('Style/*').length === 0);
        },

        //Form / View specific
        isDefaultCondition: function ()
        {
            var control = _styles._getSelectedControl();
            var viewControl = _styles._getViewControlObject(control);
            var conditionalStyleXml = _styles._getConditionalStylesNode(viewControl.controlid);
            return _styles._isDefaultConditionInternal(conditionalStyleXml);
        },

        //shared
        _isDefaultConditionInternal: function (conditionalStyleXml)
        {
            return ((conditionalStyleXml) ? (conditionalStyleXml.selectNodes('ConditionalStyle/*').length === 0) : true);
        },

        //returns the xpath required in this context to get to the controls collection
        //Form / View specific
        _getControlsXpath: function ()
        {
            if (!_styles.controlXpath)
            {
                _styles.controlXpath = "{0}/Controls/Control".format(_styles.View.viewXPath);
            }
            return _styles.controlXpath
        },

        //returns an xmldocument for this context's definition
        //Form / View specific
        _getDefinitionXml: function ()
        {
            return _styles.View.viewDefinitionXML;
        },

        //returns an object containing all the required details to apply styling
        //returned object details:
        //	control: the jquery version of the control html that requires styles 
        //	fullName: the full name of the control server side object
        //	controltype: the ControlType for this control
        //	controlid: the guid of this control
        //	controlText: the text that this control has been set to (used for formatting)
        //	setText: a function used to set the control text in js without requiring a ajax call
        //	setStyle: a function used to set the control style in js without requiring a ajax call
        //	setCondtionalStyle: a function used to set the control conditional style in js without requiring a ajax call (Not used atm)
        //Form / View specific
        _getViewControlObject: function (control)
        {
            var setText = null;
            var setStyle = null;
            var setCondtionalStyle = null;
            var fullName = null;
            var controlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
            var controltype = control.attr('controltype');
            var controlid = control.attr('id');
            var propertyType = control.attr('propertytype');
            if (controltype === "Cell")
            {
                var toolbarSection = control.closest("#toolbarSection");
                var isElementUnderToolbarSection = toolbarSection.length === 1;

                if (_styles.ViewDesigner._getViewType() === "CaptureList" && !isElementUnderToolbarSection)
                {
                    //hack to get column control id
                    var cellIndex = _styles.View.selectedObject[0].cellIndex;
                    var columns = _styles.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Canvas/Sections/Section/Control/Columns/Column")
                    if (columns.length > cellIndex)
                    {
                        controltype = "Column";
                        controlid = columns[cellIndex].getAttribute("ID");
                    }
                    //end hack
                }
            }

            var controlNode = controlsDoc.selectSingleNode('Controls/Control[Name = "' + controltype + '"]');
            fullName = controlNode.selectSingleNode("FullName").text;

            var propertiesXML = controlNode.selectSingleNode("DefaultProperties");
            var setPropertyNode = propertiesXML.selectSingleNode("Properties/Prop[@ID='Styles']".format());
            if (setPropertyNode)
                setStyle = setPropertyNode.getAttribute("setFunction");
            setPropertyNode = propertiesXML.selectSingleNode("Properties/Prop[@ID='ConditionalStyles']");
            if (setPropertyNode)
                setCondtionalStyle = setPropertyNode.getAttribute("setFunction");
            setPropertyNode = propertiesXML.selectSingleNode("Properties/Prop[@ID='Text']");
            if (setPropertyNode)
                setText = setPropertyNode.getAttribute("setFunction");

            if (control.is("td") && //header or body
                !_styles.ViewDesigner._isTableCellControl(control)) 
            {
                var newControl = jQuery("<div></div>");
                var childControl = jQuery("<div id='{0}' controltype='{1}'>{2}</div>".format(controlid, controltype, control.text()));
                newControl.append(childControl);
                control = childControl;
            }

            var controlDefinitionHtml = controlNode.selectSingleNode('HTML').text;
            if (controlDefinitionHtml === "")
                controlDefinitionHtml = control.html();
            var controlText = this._getControlText(controlid);
            var viewControl =
            {
                controlDefinitionHtml: controlDefinitionHtml,
                control: control,
                fullName: fullName,
                controltype: controltype,
                controlid: controlid,
                controlText: controlText,
                setText: setText,
                setStyle: setStyle,
                setCondtionalStyle: setCondtionalStyle,
                propertyType: propertyType,
                isFormControl: false
            }
            return viewControl;
        },

        //gets the xml node for this control from the definition xmldocument
        //shared
        _getControlNode: function (controlid)
        {
            var controlNode = _styles._getDefinitionXml().selectSingleNode(_styles._getControlsXpath() + "[@ID='{0}']".format(controlid));
            return controlNode;
        },

        //gets the styles node for this control from the definition xmldocument
        //form / view specific
        _getStylesNode: function (controlid, controltype, controlNode, propertyType)
        {
            if (!controlNode)
                controlNode = this._getControlNode(controlid);
            var savedStylesElem = null;
            if (controlNode)
            {
                savedStylesElem = controlNode.selectSingleNode('Styles');
            }
            if (!checkExists(savedStylesElem) && checkExists(controltype))
            {
                savedStylesElem = this._getControlDefinitionDefaultStyles(controltype, propertyType).cloneNode(true);
                if (controlNode)
                    controlNode.appendChild(savedStylesElem);
            }
            return savedStylesElem
        },

        //gets the text that this control has been set to show
        _getControlText: function (controlid)
        {
            var controlNode = this._getControlNode(controlid);
            var savedTextElem = null;
            if (controlNode)
                savedStylesElem = controlNode.selectSingleNode('Properties/Property/Name');
            if (savedTextElem)
                return savedTextElem.text;
            else
                return null;
        },

        //gets the Conditional Styles Node for this control from the definition xmldocument
        _getConditionalStylesNode: function (controlid)
        {
            var controlNode = this._getControlNode(controlid);
            var savedStylesElem = null;
            if (controlNode)
                savedStylesElem = controlNode.selectSingleNode('ConditionalStyles');
            return savedStylesElem
        },

        //form / view specific
        _getStyles: function (controlid, controltype, propertyType)
        {
            var retVal;

            var savedStylesElem = this._getStylesNode(controlid, controltype, null, propertyType);
            if (savedStylesElem)
            {
                retVal = savedStylesElem;
            }
            else
            {
                retVal = SCStyleHelper.tempXml().createElement("Styles");
            }

            return retVal;
        },

        //shared
        _getControlDefinitionAvailableStyles: function (controltype)
        {
            var controlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
            var controlStylesElem = controlsDoc.selectSingleNode('Controls/Control[Name = "' + controltype + '"]/AvailableStyles');
            return controlStylesElem;
        },

        //form / view specific
        _getControlDefinitionDefaultStyles: function (controlType, propertyType)
        {
            var clonedNode = _styles._getControlDefinitionDefaultStylesInternal(controlType).cloneNode(true);
            SCStyleHelper.tempXml().documentElement.appendChild(clonedNode);
            if (checkExists(propertyType))
            {
                var propertyTypeStyles = SCStyleHelper.PropertyTypeStyles()
                if (checkExists(propertyTypeStyles))
                {
                    var propertyTypeXpath = "PropertyTypes/PropertyType[Name='{0}']/Properties/Property[Name='Styles']/Value/Styles".format(propertyType);
                    var propertyTypeNode = propertyTypeStyles.selectSingleNode(propertyTypeXpath);
                    SCStyleHelper.getMergedStyle(propertyTypeNode, clonedNode);
                }
            }
            return clonedNode;

        },
        //view specific
        _getControlDefinitionDefaultStylesInternal: function (controlType)
        {
            var controlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
            var controlStylesElem = controlsDoc.selectSingleNode('Controls/Control[Name = "' + controlType + '"]/Styles');
            return controlStylesElem;
        },

        //removes all default xml from conditions and styles allowing minimal xml to be saved
        //this is required as the default may change and all controls using it will need to be adjusted
        //shared
        prepareStylesForSave: function ()
        {
            var newDefintion = _styles._getDefinitionXml().documentElement.cloneNode(true);
            SCStyleHelper.getStylesDeltas(newDefintion, _styles._getControlsXpath());
            return newDefintion;
        },

        //adds all default xml for conditions and styles
        //this is required as the default may change and all controls using it will need to be adjusted
        //shared
        prepareStylesForLoad: function ()
        {
            SCStyleHelper.getMergedStyles(_styles._getDefinitionXml(), _styles._getControlsXpath());
        },

        //Form / View specific
        _getSelectedControl: function ()
        {
            return _styles.View._findControlFromSelectedObject();
        },

        //*************Methods below this comment are all View specific ******************

        populateListHeadingControlStyle: function (controlHTML, styleNode)
        {
            //hack together a special method that splits sytle and applies to each particular part
            var jqControl = controlHTML.closest("td");

            var labelSpan = controlHTML.find("span");

            if (labelSpan.length === 1)
            {
                controlHTML = labelSpan;

                var options =
                {
                    jqControl: labelSpan,
                    styleNode: styleNode,
                    currentData: "header",
                    overrideData: "column",
                    debug: false
                }
                options.styleArray = ["Font", "Style"]
                this._applyControlStyle(options);

                options.styleArray = ["Font", "Weight"]
                this._applyControlStyle(options);

                options.jqControl = jqControl;
                options.styleArray = ["Text", "Align"]
                this._applyControlStyle(options);


            }
        },

        populateColumnControlStyle: function (cellIndex, styleNode, rowSelector)
        {
            var selector = "";
            if (checkExists(rowSelector))
            {

                selector = "#bodySection table.editor-table>tbody>tr.editor-row{0}>td:nth-child({1})".format(rowSelector, cellIndex + 1)
            }
            else
            {
                selector = "#bodySection table.editor-table>tbody>tr.editor-row>td:nth-child({0})".format(cellIndex + 1)
            }
            var _this = this;
            var debugColor = "".randomColor();
            jQuery(selector)
            .each(function ()
            {
                //hack together a special method that splits sytle and applies to each particular part
                var jqControl = $(this);
                //Don't style the placeholder-footer
                if (jqControl.closest("tr").is(".placeholder-footer"))
                    return true;

                var options =
                {
                    jqControl: jqControl,
                    styleNode: styleNode,
                    currentData: "column",
                    cannotOverrideData: "header",
                    debug: false,
                    debugColor: debugColor
                }
                options.styleArray = ["Font", "Style"]
                _this._applyControlStyle(options);

                options.styleArray = ["Font", "Weight"]
                _this._applyControlStyle(options);

                options.styleArray = ["Text", "Align"]
                _this._applyControlStyle(options);
            });
        },

        populateCanvasControlStyles: function ()
        {
            //find columns and apply styles to each cell
            var columns = _styles.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Controls/Control[@Type='Column']");
            for (var i = 0; i < columns.length; i++)
            {
                controlNode = columns[i];
                var id = controlNode.getAttribute("ID");
                var type = controlNode.getAttribute("Type");
                var styleNode = SCStyleHelper.getPrimaryStyleNode(_styles._getStylesNode(id, type));
                if (styleNode)
                {
                    var control = $("#" + id);
                    _styles.populateColumnControlStyle(i, styleNode);
                }
            }


            //find cells and apply styles
            var controls = _styles.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Controls/Control[@Type='Cell']")
            for (var i = 0; i < controls.length; i++)
            {
                controlNode = controls[i];
                var id = controlNode.getAttribute("ID");
                var type = controlNode.getAttribute("Type");
                var styleNode = SCStyleHelper.getPrimaryStyleNode(_styles._getStylesNode(id, type));
                if (styleNode)
                {
                    var control = $("#" + id);
                    _styles._applyControlStyles(control, styleNode);
                }
            }

            //find listHeading and apply styles
            var canvasListHeadingRowControl = _styles.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[Properties[Property[Name='Template' and Value='Header']] and @Type='Row']");
            if (checkExists(canvasListHeadingRowControl))
            {
                var canvasListHeadingRowID = canvasListHeadingRowControl.getAttribute("ID");
                if (checkExists(canvasListHeadingRowID))
                {
                    var canvasListHeadingsXpath = "SourceCode.Forms/Views/View/Canvas/Sections/Section[@Type='Body']/Control[@LayoutType='Grid']/Rows/Row[@ID='{0}']/Cells/Cell/Control".format(canvasListHeadingRowID);
                    var canvasListHeadings = _styles.View.viewDefinitionXML.selectNodes(canvasListHeadingsXpath);
                    for (var i = 0; i < canvasListHeadings.length; i++)
                    {
                        var controlID = canvasListHeadings[i].getAttribute("ID");
                        if (checkExists(controlID))
                        {
                            controlNode = _styles.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Controls/Control[@ID='{0}']".format(controlID));
                            if (checkExists(controlNode))
                            {
                                var id = controlNode.getAttribute("ID");
                                var type = controlNode.getAttribute("Type");
                                var styleNode = SCStyleHelper.getPrimaryStyleNode(_styles._getStylesNode(id, type));
                                if (styleNode)
                                {
                                    var control = $("#" + id);
                                    _styles.populateListHeadingControlStyle(control, styleNode);
                                }
                            }
                        }
                    }
                }
            }

            //find aggregation controls and apply styles
            var controls = _styles.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Controls/Control[@Type='Label' or @Type='DataLabel']")
            for (var i = 0; i < controls.length; i++)
            {
                controlNode = controls[i];
                var id = controlNode.getAttribute("ID");
                var type = controlNode.getAttribute("Type");
                var styleNode = SCStyleHelper.getPrimaryStyleNode(_styles._getStylesNode(id, type));
                if (styleNode)
                {
                    var control = $("#" + id);
                    _styles._applyControlStyles(control, styleNode);
                }
            }


        },

        _applyControlStyles: function (control, styleNode, useClasses)
        {
            if (!$chk(control))
                return;

            var jqControl = jQuery(control);

            if (!checkExistsNotEmpty(jqControl.attr("ID")))
            {
                return;
            }

            //find the styleNode if it wasn't passed in
            if (!styleNode)
            {
                styleNode = SCStyleHelper.getPrimaryStyleNode(_styles._getStylesNode(jqControl.attr("ID"), jqControl.attr("controltype")));
                if (!checkExists(styleNode))
                {
                    return;
                }
            }

            var options =
            {
                jqControl: jqControl,
                styleNode: styleNode,
                currentData: "header",
                overrideData: "column",
                debug: false
            };
            options.styleArray = ["Font", "Style"];
            this._applyControlStyle(options);

            options.styleArray = ["Font", "Weight"];
            this._applyControlStyle(options);

            options.styleArray = ["Text", "Align"];
            this._applyControlStyle(options, useClasses);

            options.jqControl = jqControl;
            options.styleArray = ["VerticalAlign"];
            this._applyControlStyle(options, useClasses);

            options.styleArray = ["BackgroundColor"];
            this._applyControlStyle(options);

            StyleHelper.setPaddingStyles(jqControl, styleNode);
        },

        //_applyControlStyle: function (options)
        //
        //apply a style to a control
        //options
        //required
        //jqControl -- the control to style
        //styleNode -- the xml node containing the style
        //styleArray -- the names of the style in order of path
        //
        //optional
        //currentData -- an identifier for the data variable of this node
        //overrideData -- an identifier for the data variable that could already exist on this node
        //cannotOverrideData -- an identifier for the data variable that could already exist on this node that will prevent styling
        //nativeStyleObjectProperty -- the native javasript property in uielement.style.property this is built up from the style array if not specified
        //debug -- enable debug background coloring
        //
        //useClass -- for styles that shouldn't be applied using inline styling, apply css classes instead
        _applyControlStyle: function (options, useClasses)
        {
            var o = options; //shorthand

            //check required properties
            if (!o.jqControl || !o.styleNode || !o.styleArray)
                return;

            var xpath = o.styleArray.join("/");
            var nativeProperty = null;
            if (!o.nativeStyleObjectProperty)
            {
                for (var i = 0; i < o.styleArray.length; i++)
                {
                    if (i === 0)
                        nativeProperty = o.styleArray[0].charAt(0).toLowerCase() + o.styleArray[0].substring(1);
                    else
                        nativeProperty += o.styleArray[i];
                }
            }
            else
            {
                nativeProperty = o.nativeStyleObjectProperty;
            }
            if (!nativeProperty)
                return;

            var currentData = null;
            var overrideData = null;
            var cannotOverrideData = null;

            if (o.currentData)
                currentData = this._getStyleDataName(o.styleArray, o.currentData);

            if (o.overrideData)
                overrideData = this._getStyleDataName(o.styleArray, o.overrideData);

            if (o.cannotOverrideData)
                cannotOverrideData = this._getStyleDataName(o.styleArray, o.cannotOverrideData);

            var style = $sn(o.styleNode, xpath);
            if (checkExists(style))
            {
                //ifcannotOverrideData is not specified or if specified if the data is null
                if (!cannotOverrideData || !o.jqControl.data(cannotOverrideData))
                {
                    if (useClasses)
                    {
                        //will apply "align-middle" or "align-top" or "align-left" etc
                        this._applyExclusiveClassesForKey(o.jqControl, nativeProperty, style.text);
                    }
                    else
                    {
                        o.jqControl[0].style[nativeProperty] = style.text.toLowerCase();
                    }
                    if (currentData)
                        o.jqControl.data(currentData, style.text.toLowerCase());
                    if (o.debug)
                        o.jqControl[0].style.backgroundColor = (o.debugColor) ? o.debugColor : "".randomColor();
                }
                if (currentData)
                {
                    o.jqControl.data(currentData, style.text.toLowerCase());
                }
            }
            else
            {
                if (currentData)
                {
                    o.jqControl.data(currentData, null);
                }

                if (overrideData && o.jqControl.data(overrideData))
                {
                    if (useClasses)
                    {
                        //will apply "align-middle" or "align-top" or "align-left" etc
                        this._applyExclusiveClassesForKey(o.jqControl, nativeProperty, o.jqControl.data(overrideData));
                    }
                    else
                    {
                        o.jqControl[0].style[nativeProperty] = o.jqControl.data(overrideData);
                    }
                }
                else
                {
                    o.jqControl[0].style[nativeProperty] = "";
                }
            }
        },

        // Re-applies ALL styles in the current view
        _applyStyles: function ()
        {
            // apply styling to all relevant controls
            var controls = _viewDesigner.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Controls/Control");
            for (var i = 0; i < controls.length; i++)
            {
                var controlNode = controls[i];
                var id = controlNode.getAttribute("id");
                var type = controlNode.getAttribute("Type");
                var styleNode = SCStyleHelper.getPrimaryStyleNode(_styles._getStylesNode(id, type, controlXml));
                if (checkExists(styleNode))
                {
                    var jqControl = jQuery("#" + controlNode.getAttribute("id"));
                    _styles._applyControlStyles(jqControl, styleNode);
                }
            }
        },

        _getStyleDataName: function (array, begin, end)
        {
            var result = null;
            if (begin)
                array.unshift(begin);
            if (end)
                array.push(end);
            result = array.join("-").toLowerCase();
            if (begin)
                array.shift();
            if (end)
                array.pop();
            return result;
        },

        //#region Public Methods

        setTextAlignment: function (styleNode, alignment)
        {
            _styles._setTextAlignment(styleNode, alignment);
        },

        setVerticalAlignment: function (styleNode, alignment)
        {
            _styles._setVerticalAlignment(styleNode, alignment);
        },

        copyStylesToOtherControl: function (styleNodeFrom, styleNodeTo)
        {
            return _styles._copyStylesToOtherControl(styleNodeFrom, styleNodeTo);
        },
        //#endregion

        //returns updated stylenodeto
        _copyStylesToOtherControl: function (styleNodeFrom, styleNodeTo)
        {
            var parentNode = styleNodeTo.parentNode; 
            var newStylesNode = styleNodeFrom.cloneNode(true);
            newStylesNode = parentNode.insertBefore(newStylesNode, styleNodeTo);
            parentNode.removeChild(styleNodeTo);
            return newStylesNode;
        },


        _setVerticalAlignment: function (styleNode, alignment)
        {
            var verticalAlign = styleNode.selectSingleNode("VerticalAlign");
            if (!checkExists(verticalAlign))
            {
                verticalAlign = styleNode.ownerDocument.createElement("VerticalAlign");
                styleNode.appendChild(verticalAlign);
            }

            if (checkExists(verticalAlign.firstChild))
            {
                verticalAlign.removeChild(verticalAlign.firstChild);
            }

            verticalAlign.appendChild(styleNode.ownerDocument.createTextNode(alignment));
        },

        _setTextAlignment: function (styleNode, alignment)
        {
            var text = styleNode.selectSingleNode("Text");
            if (!checkExists(text))
            {
                text = styleNode.ownerDocument.createElement("Text");
                styleNode.appendChild(text);
            }

            var align = text.selectSingleNode("Align");
            if (!checkExists(align))
            {
                align = styleNode.ownerDocument.createElement("Align");
                align.appendChild(styleNode.ownerDocument.createTextNode(alignment));
                text.appendChild(align);
            }
            else
            {
                while (checkExists(align.firstChild))
                    align.removeChild(align.firstChild);
                align.appendChild(styleNode.ownerDocument.createTextNode(alignment));
            }
        },

        _setFontWeight: function (styleNode, weight)
        {
            var font = styleNode.selectSingleNode("Font");
            if (!checkExists(font))
            {
                font = styleNode.ownerDocument.createElement("Font");
                styleNode.appendChild(font);
            }

            var fontWeight = font.selectSingleNode("Weight");
            if (!checkExists(fontWeight))
            {
                fontWeight = styleNode.ownerDocument.createElement("Weight");
                fontWeight.appendChild(styleNode.ownerDocument.createTextNode(weight));
                font.appendChild(fontWeight);
            }
            else
            {
                while (checkExists(fontWeight.firstChild))
                    fontWeight.removeChild(fontWeight.firstChild);
                fontWeight.appendChild(styleNode.ownerDocument.createTextNode(weight));
            }
        }
    }
})(jQuery);
