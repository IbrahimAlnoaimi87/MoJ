function ConditionWidget()
{
    //contains the three different containers and instantiates the different widgets
    //also allows for the loading of data
}

ConditionWidget.prototype =
{
    //#region

    _isRuntime: false,

    initialize: function (parentElement)
    {
        this._isRuntime = SourceCode.Forms.Layout.isRuntime();

        if (parentElement)
        {
            var conditionWidgetPC = jQuery("<div id=\"ConditionWidgetPC\" class=\"pane-container vertical\"></div>").appendTo(parentElement);

            //TODO: TD 0001
            var metaArray = {};
            metaArray["height"] = "50%";
            metaArray["resizable"] = false;

            var conditionContainer = jQuery("<div id=\"ConditionGridDiv\" class=\"pane\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode() + "\"></div>").appendTo(conditionWidgetPC);

            metaArray = {};
            metaArray["divResize"] = "none";
            
            metaArray = {};
            metaArray["height"] = "30%";
            metaArray["resizable"] = false;

            var expressionContainer = jQuery("<div id=\"ExpressionDiv\" class=\"pane\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode() + "\"></div>").appendTo(conditionWidgetPC);

            metaArray = {};
            metaArray["divResize"] = "none";

            metaArray = {};
            metaArray["resizable"] = false;

            var previewContainer = jQuery("<div id=\"PreviewDiv\" class=\"pane\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode() + "\"></div>").appendTo(conditionWidgetPC);

            this.expressionValues = [];
            this.innerEquations = [];
            this.dropElements = [];

            this.conditionGrid = new ConditionGrid();
            this.conditionGrid.parentWidget = this;
            this.conditionGrid.initialize(conditionContainer);

            this.expressionWidget = new ExpressionWidget();
            this.expressionWidget.parentWidget = this;
            this.expressionWidget.initialize(expressionContainer);

            this.previewWidget = new PreviewWidget();
            this.previewWidget.parentWidget = this;
            this.previewWidget.initialize(previewContainer);

            this.previewText = "";

            this.expressionOperators = [{ display: Resources.CommonActions.And, value: "And", icon: "And" }, { display: Resources.CommonActions.Or, value: "Or", icon: "Or" }];

            this.equationOperators = [
            { display: Resources.CommonActions.EqualsText, value: "Equals", icon: "equals", preview: Resources.CommonActions.EqualsTextPreview, left: true, right: true },
            { display: Resources.CommonActions.NotEqualsText, value: "NotEquals", icon: "not-equals", preview: Resources.CommonActions.NotEqualsTextPreview, left: true, right: true },
            { display: Resources.CommonActions.GreaterThanText, value: "GreaterThan", icon: "greater-than", preview: Resources.CommonActions.GreaterThanTextPreview, left: true, right: true },
            { display: Resources.CommonActions.LessThanText, value: "LessThan", icon: "less-than", preview: Resources.CommonActions.LessThanTextPreview, left: true, right: true },
            { display: Resources.CommonActions.GreaterThanEqualsText, value: "GreaterThanEquals", icon: "greater-than-equals", preview: Resources.CommonActions.GreaterThanEqualsTextPreview, left: true, right: true },
            { display: Resources.CommonActions.LessThanEqualsText, value: "LessThanEquals", icon: "less-than-equals", preview: Resources.CommonActions.LessThanEqualsTextPreview, left: true, right: true },
            { display: Resources.CommonActions.ContainsText, value: "Contains", icon: "contains", preview: Resources.CommonActions.ContainsTextPreview, left: true, right: true },
            { display: Resources.CommonActions.StartsWithText, value: "StartsWith", icon: "starts-with", preview: Resources.CommonActions.StartsWithTextPreview, left: true, right: true },
            { display: Resources.CommonActions.EndsWithText, value: "EndsWith", icon: "ends-with", preview: Resources.CommonActions.EndsWithTextPreview, left: true, right: true },
            { display: Resources.CommonActions.IsEmptyText, value: "IsBlank", icon: "text-blank", preview: Resources.CommonActions.IsEmptyTextPreview, left: true, right: false },
            { display: Resources.CommonActions.IsNotEmptyText, value: "IsNotBlank", icon: "text-not-blank", preview: Resources.CommonActions.IsNotEmptyTextPreview, left: true, right: false }];

            $(parentElement).find(".pane-container").on("panecontainercreate", parentElement, function (e)
            {
                e.data.find(".pane-container").panecontainer("refresh");
                e.data.find(".grid").grid("synccolumns");
            });
        }
    },

    //load and  interpret the conditions for different instances
    load: function (sourceXml)
    {
        //#region
        if (checkExists(sourceXml) && sourceXml.length > 0)
        {
            var sourceXmlDoc = $xml(sourceXml);
            var firstChild = sourceXmlDoc.firstChild;
            var firstChildfirstChild = (firstChild) ? firstChild.firstChild : null;
            if (firstChildfirstChild)
            {
                this.sourceXml = sourceXml;
                this.innerEquations = []; //items that will be shown in the condition grid (x operator y)
                this.expressionValues = []; //items that will be shown in the expression section (equation and/or equation)
                this.equationNumber = 0;
                this.evaluateExpressionValue(firstChildfirstChild);
                if (this.innerEquations.length > 0 && this.expressionValues.length > 0)
                {
                    this.conditionGrid.load(this.innerEquations);
                    this.conditionGrid.save();
                    this.expressionWidget.load(this.expressionValues);
                    this.previewWidget.load(this.innerEquations, this.expressionValues);
                }
            }
        }
        //#endregion
    },

    //reload functionality to update the preview xml
    reload: function ()
    {
        //#region
        this.previewWidget.load(this.innerEquations, this.expressionValues);
        //#endregion
    },

    //helper function to filter and return the correct expression operator
    getExpressionOperatorItem: function (value)
    {
        //#region
        var currentExpression = this.expressionOperators.filter(function (item, index)
        {
            return item.value === value;
        });
        return currentExpression[0];
        //#endregion
    },

    //helper function to filter and return the correct equation operator
    getEquationOperatorItem: function (value)
    {
        //#region
        var currentExpression = this.equationOperators.filter(function (item, index)
        {
            return item.value === value;
        });
        return currentExpression[0];
        //#endregion
    },

    evaluateExpressionValue: function (currentNode)
    {
        //#region
        var currentEquation = null;
        //figure out whether the current node is a logical expression (and, or) or an equation (<, >, = etc)
        var currentExpression = this.getExpressionOperatorItem(currentNode.tagName);

        if (!checkExists(currentExpression))
        {
            currentEquation = this.getEquationOperatorItem(currentNode.tagName);
        }

        var LeftNode = currentNode.firstChild;
        var RightNode = currentNode.lastChild;
        var leftResult = null;
        var rightResult = null;
        if (LeftNode.tagName === "Left")
        {
            LeftNode = LeftNode.firstChild;
            RightNode = RightNode.firstChild;
        }

        if (LeftNode.parentNode.tagName === "Bracket")
        {
            this.expressionValues.push({ grouping: "(" });

            this.evaluateExpressionValue(LeftNode);

            this.expressionValues.push({ grouping: ")" });

            return;
        }

        if (LeftNode.tagName !== "Item")
        {
            this.evaluateExpressionValue(LeftNode);
        }
        else
        {
            leftResult = LeftNode;
        }

        if (checkExists(currentExpression))
        {
            this.expressionValues.push({ expression: currentExpression });
        }

        if (currentNode.childNodes.length === 1)
        {
            RightNode = null;
        }

        if (checkExists(RightNode))
        {
            if (RightNode.tagName !== "Item")
            {
                this.evaluateExpressionValue(RightNode);
            }
            else
            {
                rightResult = RightNode;
            }
        }

        if (checkExists(currentEquation))
        {
            //check if the innerEquation exists before adding it again
            var indexInArray = this._verifyExistenceInArray(this.innerEquations, { left: leftResult, operator: currentEquation, right: rightResult });
            if (indexInArray === -1)
            {
                this.equationNumber = this.equationNumber + 1;
                this.innerEquations.push({ left: leftResult, operator: currentEquation, right: rightResult, number: this.equationNumber });
                this.expressionValues.push({ number: this.equationNumber });
            }
            else
            {
                this.expressionValues.push({ number: this.innerEquations[indexInArray].number });
            }
        }
        //#endregion
    },

    //return the index of the current expression in the array (if already added)
    _verifyExistenceInArray: function (array, obj)
    {
        //#region
        var returnIndex = -1;

        var valueObj = {
            operator: obj.operator,
            left: obj.left.xml,
            right: checkExists(obj.right) ? obj.right.xml : null
        };

        for (var i = 0, l = array.length; i < l; i++)
        {
            var arrayObj = {
                operator: array[i].operator,
                left: array[i].left.xml,
                right: checkExists(array[i].right) ? array[i].right.xml : null
            };

            if ($.compare(valueObj, arrayObj))
            {
                returnIndex = i;
                break;
            }
        }
        return returnIndex;
        //#endregion
    },

    //reconstructs the expression in the format it was received
    constructXml: function (_this)
    {
        //#region
        var canContinue = true;
        var hasErrors = false;

        var expressions = _this.expressionValues;
        var equations = _this.innerEquations;

        var xmlDoc = $xml("<Conditions />");
        var entry = $sn(xmlDoc, "Conditions");

        var isContained = false;
        var stack = 0, xnode, pnode;

        for (var e = 0; e < expressions.length; e++)
        {

            var currentExpression = expressions[e];
            var innerNode;
            if (currentExpression.number)
            {
                //#region
                //get the current expression from the innerEquations
                var innerEquation = equations.filter(function (item, index)
                {
                    return item.number === currentExpression.number;
                });

                var currentEquation = innerEquation[0];
                innerNode = xmlDoc.createElement(currentEquation.operator.value);

                // Left Equation
                if (!checkExists(currentEquation.left))
                {
                    canContinue = false;
                    break;
                }

                if (!this._isRuntime && currentEquation.left.selectNodes("..//Item" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition()).length > 0)
                {
                    hasErrors = true;
                    break;
                }

                var leftEquationNode = this._formatEquationNode(currentEquation.left);

                innerNode.appendChild(leftEquationNode.cloneNode(true));

                // Right Equation
                if (!checkExists(currentEquation.right) && currentEquation.operator.right === true)
                {
                    canContinue = false;
                    break;
                }

                if (!this._isRuntime && checkExists(currentEquation.right) && currentEquation.right.selectNodes("..//Item" + SourceCode.Forms.Designers.Common.getXPathValidationStatusCondition()).length > 0)
                {
                    hasErrors = true;
                    break;
                }

                // Only attempt to save the right operand if it exists (IsBlank & IsNotBlank has no right operands)
                if (checkExists(currentEquation.right))
                {
                    var rightEquationNode = this._formatEquationNode(currentEquation.right);
                    innerNode.appendChild(rightEquationNode.cloneNode(true));
                }

                entry.appendChild(innerNode);

                if (entry.childNodes.length === 2) entry = entry.parentNode;
                //#endregion
            }
            else if (currentExpression.expression)
            {
                //#region
                if (entry.childNodes.length === 2) entry = entry.parentNode;
                xnode = entry.removeChild(entry.firstChild);
                entry = entry.appendChild(xmlDoc.createElement(currentExpression.expression.value));
                entry.appendChild(xnode);
                //#endregion
            }
            else if (currentExpression.grouping)
            {
                //#region
                switch (currentExpression.grouping)
                {
                    case "(":
                        // Bracket Node
                        stack++;
                        entry = entry.appendChild(xmlDoc.createElement("Bracket"));
                        break;
                    case ")":
                        // Closing the parenthesis, finding the appropriate entry point
                        stack--;

                        while (entry.tagName.toLowerCase() !== "bracket" && checkExists(entry.parentNode) && entry.parentNode.tagName.toLowerCase() !== "conditions")
                            entry = entry.parentNode;

                        entry = entry.parentNode;
                        break;
                }
                //#endregion
            }
        }
        if (canContinue && !hasErrors)
        {
            return { value: xmlDoc.xml, display: _this.previewText };
        }
        else
        {
            if (hasErrors)
            {
                popupManager.showError(Resources.Filtering.InvalidCondition, Resources.Filtering.InvalidCondition);
            }
            else
            {
                var options = {
                    headerText: Resources.Filtering.ConditionsValidationTitle,
                    message: Resources.Filtering.ConditionsValidationMessage
                };
                popupManager.showNotification(options);
            }
            return false;
        }
        //#endregion
    },

    /**
     * This function will take the left or right equation item xml node,
     * iterate through each item contained in the node,
     * change attributes like InstanceID to SourceInstanceID,
     * correct the sourceID attribute value and remove unnecessary attributes
     * 
     * @function
     * 
     * @param {equationNode} xmlNode The left or right equation item node
     *
     * @returns xmlNode that was changed
     */
    _formatEquationNode: function (equationNode)
    {
        var attributesToChange = ["InstanceID", "SubFormID", "SubFormInstanceID"];

        this.addPrefixToAttributesOnXmlNode(equationNode, "Source", attributesToChange);

        this.mergeSubFormInstanceID(equationNode);

        var innerItemNodes = [equationNode];

        if (equationNode.getAttribute("SourceType") === "Value" &&
            equationNode.selectNodes(".//SourceValue").length > 0)
        {
            innerItemNodes = equationNode.selectNodes("SourceValue/Item");
        }
        var i = 0;
        for (i = 0; i < innerItemNodes.length; i++)
        {
            var currentItem = innerItemNodes[i];

            this.addPrefixToAttributesOnXmlNode(currentItem, "Source", attributesToChange);

            this.mergeSubFormInstanceID(currentItem);

            // Fix for controlprops that are concatenated
            if (checkExists(currentItem.getAttribute("TargetPath")))
            {
                currentItem.removeAttribute("id");
                currentItem.removeAttribute("Name");

                var tmpSourceID = currentItem.getAttribute("SourceID").split("_");
                if (checkExists(tmpSourceID) && tmpSourceID.length === 2)
                {
                    currentItem.setAttribute("SourceID", tmpSourceID[1]);
                }
            }
        }
        return equationNode;
    },

    addPrefixToAttributesOnXmlNode: function (xmlNode, prefix, listOfAttributeNames)
    {
        if (!checkExists(xmlNode))
        {
            return;
        }

        if (!checkExists(listOfAttributeNames) ||
            listOfAttributeNames.length === 0)
        {
            return;
        }

        var i = 0;
        var attributeValue = "";
        for (i = 0; i < listOfAttributeNames.length; i++)
        {
            attributeValue = xmlNode.getAttribute(listOfAttributeNames[i]);

            if (checkExists(attributeValue))
            {
                xmlNode.setAttribute("{0}{1}".format(prefix, listOfAttributeNames[i]), attributeValue);

                xmlNode.removeAttribute(listOfAttributeNames[i]);
            }
        }
    },

    mergeSubFormInstanceID: function (xmlNode)
    {
        if (!checkExists(xmlNode))
        {
            return;
        }

        var subFormInstanceID = xmlNode.getAttribute("SourceSubFormInstanceID");
        var instanceID = xmlNode.getAttribute("SourceInstanceID");

        //TFS #820828 - instanceID = "00000000-0000-0000-0000-000000000000" and was not being catered for
        if ((!checkExistsNotEmptyGuid(instanceID) || !checkExistsNotEmpty(instanceID)) && (checkExistsNotEmptyGuid(subFormInstanceID) || checkExistsNotEmpty(subFormInstanceID)))
        {
            xmlNode.setAttribute("SourceInstanceID", subFormInstanceID);
            xmlNode.removeAttribute("SourceSubFormInstanceID");
        }
    },

    //loading saved conditions - widget style
    setConfigurationXml: function (configurationXml, targetContextContainer)
    {
        //#region
        this.targetContextContainer = targetContextContainer;
        if (configurationXml)
        {
            if (configurationXml.xml)
            {
                this.load(configurationXml.xml);
            }
            else
            {
                this.load(configurationXml);
            }
        }
        //#endregion
    },

    //returning changed conditions - widget style
    getConfigurationXML: function ()
    {
        //#region
        // First validate
        var validgroupings = this.expressionWidget._validateGroupings(this.expressionWidget);

        if (!validgroupings)
        {
            popupManager.showWarning(Resources.Filtering.UnclosedParenthesisValidationMessage);
            return false;
        }
        else
        {
            return this.constructXml(this);
        }
        //#endregion
    },

    //widget implementation
    dispose: function ()
    {
        //#region
        jQuery("#ConditionGridDiv").remove();
        jQuery("#ExpressionDiv").remove();
        jQuery("#PreviewDiv").remove();
        //#endregion
    },

    //widget implementation
    getSettings: function ()
    {
        //#region
        return { dropTolerance: 'pointer', dropElements: this.dropElements }
        //#endregion
    }

    //#endregion
}


function ConditionGrid()
{
    //Condition grid will contain the single comparison values to be used in conditional expression
}

ConditionGrid.prototype =
{
    //#region
    _isRuntime: false,

    initialize: function (parentElement)
    {
        this._isRuntime = SourceCode.Forms.Layout.isRuntime();
        var _this = this;
        this.allowMultipleItems = (this.parentWidget.options && this.parentWidget.options.allowMultipleItems) ? this.parentWidget.options.allowMultipleItems : false;
        var headingText = Resources.CommonLabels.ConditionsText;
        if (_this.Heading) headingText = _this.Heading;

        var gridHtml = SCGrid.html(
        {
            id: "ConditionGrid",
            header: headingText,
            fullsize: true,
            toolbars: 1,
            scrolling: true,
            resources: { emptygrid: Resources.CommonPhrases.EmptyGridMessageText },
            columns:
            [{ display: Resources.CommonLabels.RowNumberLabelText, name: "numberColumn", width: "30px", sortable: false, align: "center", datatype: "number" },
                { display: Resources.CommonLabels.LeftLabelText, name: "leftColumn", width: "150px", sortable: false, align: "left", datatype: "text" },
                { display: Resources.CommonLabels.OperatorLabelText, name: "operatorColumn", width: "190px", sortable: false, align: "left", datatype: "text" },
                { display: Resources.CommonLabels.RightLabelText, name: "rightColumn", width: "150px", sortable: false, align: "left", datatype: "text", modulus: true }]
        });

        var element = jQuery(gridHtml).appendTo(parentElement);
        _this._grid = jQuery(element).grid();

        var gridBehaviour =
                    {
                        rowselect: _this._rowSelected.bind(_this)
                    }
        _this._grid.grid("option", gridBehaviour);

        _this.leftDropboxes = [];
        _this.rightDropboxes = [];

        var tb = jQuery(element).grid("fetch", "toolbars").toolbargroup("fetch", "toolbars").eq(0).toolbar()
        tb.toolbar("add", "button", { id: "addButton_ConditionWidget", icon: "add", text: Resources.CommonActions.AddText, description: Resources.Filtering.AddConditionTooltip });
        tb.toolbar("add", "button", { id: "deleteButton_ConditionWidget", icon: "delete", text: Resources.CommonActions.RemoveText, description: Resources.Filtering.RemoveConditionTooltip, disabled: true });

        tb.find('.toolbar-button').each(function (i) {

            switch ($(this).attr('id')) {
                case 'addButton_ConditionWidget':
                    $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-add" /></svg>');
                    break;
                case 'deleteButton_ConditionWidget':
                    $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-delete" /></svg>');
                    break;
            }

            $(this).addClass('style-aware');

        });

        var toolbarItems = tb.toolbar("fetch", "buttons");
        jQuery(toolbarItems[0]).on("click", _this, _this.addCondition);
        jQuery(toolbarItems[1]).on("click", _this, _this.deleteCondition);
        return element;
    },

    _rowSelected: function (selectedRow)
    {
        $("#deleteButton_ConditionWidget").removeClass("disabled");
    },

    //loading the condition grid from the equations specified
    load: function (innerEquations)
    {
        //#region
        if (this._grid.grid("fetch", "rows").length > 0)
        {
            this._grid.grid("clear");
            this.leftDropboxes = [];
            this.rightDropboxes = [];
        }

        var noOfExpressions = innerEquations.length;

        for (var i = 0; i < noOfExpressions; i++)
        {
            var currentExpression = innerEquations[i];
            this.addRow(this, currentExpression.number, currentExpression);
        }
        if (this.parentWidget.targetContextContainer)
        {
            this.parentWidget.targetContextContainer.targetContextCanvas("add", "dropElements", this.parentWidget.dropElements);
            this.parentWidget.targetContextContainer.targetContextCanvas("addDragDrop");
        }
        //hack for chrome
        setTimeout(
                    function ()
                    {
                        this._grid.grid("synccolumns");
                        if (SourceCode.Forms.Browser.webkit)
                        {
                            this._grid.hide();
                            setTimeout(
                                    function ()
                                    {
                                        this._grid.show();
                                    }.bind(this), 0)
                        }
                    }.bind(this), 0);
        //end hack for chrome
        //#endregion
    },

    //clicking on the button to add a condition
    addCondition: function (e)
    {
        //#region
        var _this = this;
        if (e && e.data)
        {
            _this = e.data;
        }
        _this.addRow(_this);
        if (checkExists(_this.parentWidget.expressionWidget))
        {
            $("#addButton_ExpressionWidget").removeClass("disabled");
            _this.parentWidget.expressionWidget.addExpression();
        }
        //#endregion
    },

    //adding a row  - with or without values
    addRow: function (widget, counter, values)
    {
        //#region
        var conditionGrid = widget._grid;

        if (!checkExists(counter) || !parseInt(counter))
        {
            counter = jQuery(conditionGrid).grid("fetch", "rows").length + 1;
        }
        var controlRow = [];

        var txtLeft = (SCTextbox.html({ id: "txtLeft" + counter })); 		//must change to droptextbox after initial tests
        var txtRight = (SCTextbox.html({ id: "txtRight" + counter })); //must change to droptextbox after initial tests
        var selOperator = "<select id='selOperator" + counter + "' class='input-control icon-control'></select>";

        controlRow.push({ display: counter, value: counter });
        controlRow.push({ cellclass: "edit-mode", html: txtLeft });
        controlRow.push({ cellclass: "edit-mode", html: selOperator });
        controlRow.push({ cellclass: "edit-mode", html: txtRight });

        jQuery(conditionGrid).grid("add", "row", controlRow);

        selOperator = jQuery("#selOperator" + counter);

        //add operators
        var equationOperators = widget.parentWidget.equationOperators;
        for (var c = 0; c < equationOperators.length; c++)
        {
            var opt = document.createElement('option');
            opt.innerHTML = equationOperators[c].display;
            opt.value = equationOperators[c].value;
            opt.className = equationOperators[c].icon;
            jQuery(selOperator)[0].appendChild(opt);
        }
        txtLeft = jQuery("#txtLeft" + counter);
        txtRight = jQuery("#txtRight" + counter);

        txtLeft = new DropTextBox(
        {
            existingElement: txtLeft.parent("div.input-control-wrapper").parent(),
            watermarkText: Resources.CommonActions.DropOrTypeHereText,
            //allowMultipleItems: this.allowMultipleItems,
            onChangedDelegate: function ()
            {
                widget.save();
            }
        });

        txtRight = new DropTextBox(
        {
            existingElement: txtRight.parent("div.input-control-wrapper").parent(),
            watermarkText: Resources.CommonActions.DropOrTypeHereText,
            allowMultipleItems: this.allowMultipleItems,
            onChangedDelegate: function ()
            {
                widget.save();
            }
        });

        widget.leftDropboxes.push(txtLeft);
        widget.rightDropboxes.push(txtRight);

        widget.parentWidget.dropElements.push(txtLeft);
        widget.parentWidget.dropElements.push(txtRight);

        if (checkExists(values))
        {
            widget._deconstructItemXml(txtLeft, values.left);
            selOperator[0].value = values.operator.value;
            if (values.operator.right === true)
            {
                widget._deconstructItemXml(txtRight, values.right);
            }
            else
            {
                txtRight.clear();
                txtRight.disable();
            }
        }
        else
        {
            //not loaded (each instance where a row is added singularly)
            if (widget.parentWidget.targetContextContainer)
            {
                widget.parentWidget.targetContextContainer.targetContextCanvas("add", "dropElements", widget.parentWidget.dropElements);
                widget.parentWidget.targetContextContainer.targetContextCanvas("addDragDrop");
            }
            widget.save();
        }
        jQuery(selOperator).on("change", { control: selOperator, widget: widget, right: txtRight }, widget._changeOperator).dropdown();
        jQuery(selOperator).dropdown("refresh");

        //add active styling to dropboxes
        this._bindActiveEvents(txtLeft.element.find("input"));
        this._bindActiveEvents(txtRight.element.find("input"));
        //#endregion
    },

    //add active styling
    _bindActiveEvents: function (element)
    {
        element.on("focus", function ()
        {
            jQuery(this).closest('.text-input').addClass('active');
        });

        element.on("focusout", function ()
        {
            jQuery(this).closest('.text-input').removeClass('active');
        });
    },

    //change operator dropdown - verify if the right textbox should be cleared/disabled if relevant
    _changeOperator: function (e)
    {
        //#region
        var _this = this;
        if (e && e.data)
        {
            _this = e.data;
        }
        var control = _this.control;
        var widget = _this.widget;
        var selectedValue = control[0].value;
        var equationOperator = widget.parentWidget.getEquationOperatorItem(selectedValue);
        var rightTextbox = _this.right;
        var isEnabled = rightTextbox.isEnabled();
        if (equationOperator.right === false && isEnabled)
        {
            rightTextbox.clear();
            rightTextbox.disable();
        }
        else if (equationOperator.right === true && !isEnabled)
        {
            rightTextbox.enable();
        }
        widget.save();
        //#endregion
    },

    //prompt for confirmation to delete a condition completely
    deleteCondition: function (e)
    {
        //#region
        var _this = this;
        if (e && e.data)
        {
            _this = e.data;
        }
        if (!$("#deleteButton_ConditionWidget").hasClass("disabled"))
        {
            var conditionGrid = _this._grid;
            //get selected row
            var currentSelection = conditionGrid.grid("fetch", "selected-rows");
            if (currentSelection.length > 0)
            {
                //ask if this condition must be deleted
                var options = {
                    headerText: Resources.Filtering.ConditionWidgetRemoveNotificationHeader,
                    message: Resources.Filtering.ConditionWidgetRemoveNotificationText,
                    onAccept: function () { _this._removeConditionCompletely(_this); }.bind(_this)
                };
                popupManager.showConfirmation(options);
            }
            $("#deleteButton_ConditionWidget").addClass("disabled");
        }
    },

    //removes the condition from all the places it is used (together with the corresponding expression etc.)	
    _removeConditionCompletely: function (widget)
    {
        //#region
        popupManager.closeLast();
        var currentSelection = widget._grid.grid("fetch", "selected-rows");
        var conditionNumber = currentSelection[0].rowIndex + 1;
        //update the inner equations and reload the grid with correct numbering and removed items
        var innerEquations = widget.parentWidget.innerEquations;
        innerEquations = innerEquations.filter(function (item, index)
        {
            return item.number !== conditionNumber;
        });
        for (var i = 0; i < innerEquations.length; i++)
        {
            if (innerEquations[i].number > conditionNumber)
            {
                innerEquations[i].number--;
            }
        }
        widget.load(innerEquations);
        widget.parentWidget.innerEquations = innerEquations;
        widget.parentWidget.expressionWidget.removeExpressionInstance(conditionNumber);
        widget.parentWidget.reload();
        //#endregion
    },

    //take the value from the droptextbox and construct the xml so that it can be translated in runtime (backwards compatible)
    _constructItemXml: function (control)
    {
        //#region
        //backwards compatibility
        //SourceId = Guid
        //ItemType=ItemType / SourceType
        //DataType = SubType

        var returnValue = null;
        var xmlDoc = $xml("<Item/>");
        var itemNode = xmlDoc.documentElement;

        if (control.containsText && checkExists(control.text) && control.text.length > 0)
        {
            itemNode.setAttribute("SourceType", "Value");
            itemNode.setAttribute("DataType", "Text");
            var sourceValueNode = xmlDoc.createElement("SourceValue");
            itemNode.appendChild(sourceValueNode);
            var textValue = xmlDoc.createTextNode(control.text);
            sourceValueNode.appendChild(textValue);
            returnValue = itemNode;

            return returnValue;
        }

        var dropObjects = [];

        if (control.multipleValues && control.dropObjects.length > 0)
        {
            dropObjects = control.dropObjects;
            dropObjects = dropObjects.filter(item => item); //When dragging a date return property into the advanced filter field and when multipleValues is true, the dropObjects array contains 3 values, two empty values and then the date value. This causes issues in the filter comparison.
        }
        else if (checkExists(control.dropObject))
        {
            if (Array.isArray(control.dropObject))
            {
                dropObjects = control.dropObject;
            }
            else
            {
                dropObjects.push(control.dropObject);
            }
        }
        else
        {
            return null;
        }

        itemNode.setAttribute("SourceType", "Value");

        var sourceValue = xmlDoc.createElement("SourceValue");

        for (var d = 0; d < dropObjects.length; d++)
        {
            var source = xmlDoc.createElement("Item");
            var currentDropObject = dropObjects[d];
            if (currentDropObject.data)
            {
                jQuery.each(currentDropObject.data, function (name, value)
                {
                    source.setAttribute(name, value);
                });

                //Set SourceType
                var sourceType = source.getAttribute("ItemType");
                if (sourceType)
                {
                    switch (sourceType.toLowerCase())
                    {
                        case "methodreturnedproperty":
                            sourceType = "ObjectProperty";
                            break;
                    }
                }
                source.setAttribute("SourceType", sourceType);

                //Set SourceID
                var sourceID = null;

                if (sourceType === "ViewParameter" || sourceType === "FormParameter")
                {
                    //need to cater for new saved and loaded from the simple filter
                    sourceID = source.getAttribute("Name");
                }

                //set the source name and displayname
                var existingValue = source.getAttribute("SourceName")
                var sourceName = source.getAttribute("Name");
                if (sourceName === null)
                {
                    sourceName = currentDropObject.value;
                }

                if (checkExistsNotEmpty(sourceName) && existingValue != sourceName)
                {
                    source.setAttribute("SourceName", sourceName);
                }
                existingValue = source.getAttribute("SourceDisplayName")
                var sourceDisplayName = source.getAttribute("DisplayName");
                if (sourceDisplayName === null)
                {
                    sourceDisplayName = currentDropObject.display;
                }

                if (checkExistsNotEmpty(sourceDisplayName) && existingValue != sourceDisplayName)
                {
                    source.setAttribute("SourceDisplayName", sourceDisplayName);
                }

                if (!checkExists(sourceID))
                {
                    sourceID = source.getAttribute("Guid");
                    if (!checkExists(sourceID))
                    {
                        sourceID = source.getAttribute("Name");
                    }

                    if (!this._isRuntime && !checkExists(sourceID) && SourceCode.Forms.DependencyHelper.hasValidationStatusError(source))
                    {
                        var validationMsg = source.getAttribute("ValidationMessages");
                        if (checkExists(validationMsg))
                        {
                            var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
                            var validationList = resourceSvc.parseValidationMessage(validationMsg);
                            if (checkExists(validationList[0]) && checkExists(validationList[0].guid))
                            {
                                sourceID = validationList[0].guid;
                            }
                        }
                    }
                }

                source.setAttribute("SourceID", sourceID || "");

                //Set DataType
                var datatype = "text";
                var subType = source.getAttribute("DataType") ? source.getAttribute("DataType") : source.getAttribute("SubType");
                if (subType)
                {
                    switch (subType.toLowerCase())
                    {
                        case "autonumber":
                        case "number":
                        case "decimal":
                            datatype = "number";
                            break;
                        case "datetime":
                            datatype = "datetime";
                            break;
                        case "yesno":
                        case "boolean":
                            datatype = "boolean";
                            break;
                        case "guid":
                        case "autoguid":
                            datatype = "guid";
                            break;
                    }
                }
                source.setAttribute("DataType", datatype);

                if (dropObjects.length == 1)
                {
                    returnValue = source;
                }
                else
                {
                    sourceValue.appendChild(source);
                }
            }
            else if (currentDropObject.length > 0)
            {
                source.setAttribute("DataType", "Text");
                source.setAttribute("SourceType", "Value");
                source.appendChild(xmlDoc.createTextNode(currentDropObject));
                sourceValue.appendChild(source);
            }
        }

        if (sourceValue.childNodes.length > 0)
        {
            itemNode.appendChild(sourceValue);
            returnValue = itemNode;
        }

        return returnValue;
        //#endregion
    },

    //take the value from the item's xml and retrieve the value(s) that should be shown in the droptextbox
    _deconstructItemXml: function (control, itemNode)
    {
        //#region
        if ($chk(itemNode))
        {
            //helper function to return objects from deconstructed xml 
            var _describeDeconstructItemXml = function (_this, collectionObjects, sourceItem)
            {
                //Add SubFormID, InstanceID and SubFormInstanceID to the Search object based on being an Advanced Conditon or Advanced Filter
                var addConditionalSubFormAndInstanceAndSubFormInstanceIDsToSearchObject = function (searchObj, SubFormID, InstanceID, sourceItem)
                {
                    if (checkExistsNotEmpty(SubFormID) && SubFormID !== "00000000-0000-0000-0000-000000000000")
                    {
                        searchObj.SubFormID = SubFormID;

                        if (checkExistsNotEmpty(InstanceID) && InstanceID !== "00000000-0000-0000-0000-000000000000")
                        {
                            //Search for Advanced Filter
                            if (checkExists(sourceItem.getAttribute("SourceSubFormInstanceID")))
                            {
                                //For SFID feature, Context tree uses SubFormInstanceID and Advanced filter does not use SubFormInstanceID yet,
                                //thus we need to populate it from the InstanceID when creating the search object
                                searchObj.SubFormInstanceID = InstanceID;
                            }
                        }
                    }
                    else if (checkExistsNotEmpty(InstanceID) && InstanceID !== "00000000-0000-0000-0000-000000000000")
                    {
                        searchObj.InstanceID = InstanceID;
                    }
                    return searchObj;
                }


                if (!$chk(sourceItem))
                {
                    return;
                }
                var itemType = sourceItem.getAttribute("SourceType");

                var searchCriteria = {};

                if (!_this._isRuntime && SourceCode.Forms.DependencyHelper.hasValidationStatusError(sourceItem))
                {
                    if (sourceItem.getAttribute("SourceID") === null)
                    {
                        return;
                    }
                    else
                    {
                        var errorNode = _this._buildDraggingNodeForErrorItem(sourceItem);
                        collectionObjects.push(errorNode);
                    }
                }
                else if (itemType !== "Value")
                {
                    var contextId = sourceItem.getAttribute("SourceID");
                    var sourceID = contextId;

                    if ((itemType === "ViewParameter" || itemType === "FormParameter") && (!checkExistsNotEmpty(contextId) || contextId.isValidGuid()))
                    {
                        //need to cater for new saved and loaded from the simple filter
                        var sourceName = sourceItem.getAttribute("Name");
                        if (checkExists(sourceName))
                        {
                            contextId = sourceName;
                        }
                    }
                    var SubFormID = (sourceItem.getAttribute("SourceSubFormID")) ? sourceItem.getAttribute("SourceSubFormID") : null;
                    var InstanceID = (sourceItem.getAttribute("SourceInstanceID")) ? sourceItem.getAttribute("SourceInstanceID") : null;

                    var searchObj =
                    {
                        id: contextId
                    };

                    searchObj = addConditionalSubFormAndInstanceAndSubFormInstanceIDsToSearchObject(searchObj, SubFormID, InstanceID, sourceItem)

                    var itemdraggingNode = _this.parentWidget.targetContextContainer.targetContextCanvas("getDraggingNode", searchObj);

                    if (checkExists(itemdraggingNode))
                    {
                        collectionObjects.push(itemdraggingNode);
                    }
                    else
                    {
                        var sourcePath = (sourceItem.getAttribute("SourcePath")) ? sourceItem.getAttribute("SourcePath") : null;
                        if (checkExists(sourceItem.getAttribute("SourceID")))
                        {
                            if (checkExists(SubFormID) && SubFormID !== "00000000-0000-0000-0000-000000000000")
                            {
                                searchCriteria.SubFormID = SubFormID;

                                if (checkExists(InstanceID) && InstanceID !== "00000000-0000-0000-0000-000000000000")
                                {
                                    //For SFID feature, Context tree uses SubFormInstanceID and Advanced filter does not use SubFormInstanceID yet,
                                    //thus we need to populate it from the InstanceID when creating the search object
                                    searchCriteria.SubFormInstanceID = InstanceID;
                                }
                            }
                            else if (checkExists(InstanceID) && InstanceID !== "00000000-0000-0000-0000-000000000000")
                            {
                                searchCriteria.InstanceID = InstanceID;
                            }

                            if (sourceID.isValidGuid()) searchCriteria.Guid = sourceID;
                            searchCriteria.id = sourceID;
                            searchCriteria.ItemType = itemType;
                        }
                        
                        var parentMetadata = searchCriteria;
                        var childMetadata =
                        {
                            id: contextId,
                            SourceID: sourceID,
                            SourcePath: sourcePath
                        };

                        childMetadata = addConditionalSubFormAndInstanceAndSubFormInstanceIDsToSearchObject(childMetadata, SubFormID, InstanceID, sourceItem)

                        itemdraggingNode = _this.parentWidget.targetContextContainer.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);

                        if (!itemdraggingNode)
                        {
                            if (checkExists(sourceItem.getAttribute("Name")))
                            {
                                itemdraggingNode = _this.parentWidget.targetContextContainer.targetContextCanvas("getElementInContextTree", sourceItem.getAttribute("Name"), true);
                            }
                        }

                        // Items that need to be partially loaded
                        if (!itemdraggingNode)
                        {
                            if (itemType === "ControlProperty" || itemType === "ControlField")
                            {
                                contextId = (sourceItem.getAttribute("id")) ? sourceItem.getAttribute("id") : sourceItem.getAttribute("Name");
                                searchCriteria.id = sourceItem.getAttribute("SourcePath");
                                searchCriteria.ItemType = "Control";

                                if (!checkExists(SubFormID) || SubFormID === "00000000-0000-0000-0000-000000000000")
                                {
                                    searchCriteria.SubFormID = null;
                                    searchCriteria.SubFormInstanceID = null;
                                }

                                if (!checkExists(InstanceID) || InstanceID === "00000000-0000-0000-0000-000000000000")
                                {
                                    searchCriteria.InstanceID = null;
                                }

                                parentMetadata = searchCriteria;
                                childMetadata =
                                {
                                    id: contextId,
                                    SourceID: sourceID,
                                    SourcePath: sourcePath
                                };

                                childMetadata = addConditionalSubFormAndInstanceAndSubFormInstanceIDsToSearchObject(childMetadata, SubFormID, InstanceID, sourceItem)

                                itemdraggingNode = _this.parentWidget.targetContextContainer.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);
                            }
                        }

                        if (checkExists(itemdraggingNode))
                        {
                            collectionObjects.push(itemdraggingNode);
                        }
                    }
                }
                else
                {
                    collectionObjects.push(sourceItem.text);
                }

                return collectionObjects;
            };

            //actual code
            var itemType = itemNode.getAttribute("SourceType");

            //Item has a validation error:
            if (!this._isRuntime && itemType !== "Value" && SourceCode.Forms.DependencyHelper.hasValidationStatusError(itemNode))
            {
                if (itemNode.getAttribute("SourceID") === null)
                {
                    return;
                }
                else
                {
                    var errorNode = this._buildDraggingNodeForErrorItem(itemNode);
                    control.setValue(errorNode);
                    return;
                }
            }

            if (itemType === "Value")
            {
                //Handle multiple values
                var sources = itemNode.selectNodes("SourceValue/Item");

                if (sources && sources.length > 0)
                {
                    var collectionObjects = [];
                    for (var s = 0; s < sources.length; s++)
                    {
                        var sourceItem = sources[s];
                        _describeDeconstructItemXml(this, collectionObjects, sourceItem);
                    }

                    if (collectionObjects.length > 0)
                    {
                        control.setValue(collectionObjects);
                    }
                }
                else
                {
                    //Is just a single value
                    if (checkExists($sn(itemNode, "SourceValue")))
                    {
                        control.setValue($sn(itemNode, "SourceValue").text);
                    }
                }
            }
            else
            {
                var collectionObjects = [];
                _describeDeconstructItemXml(this, collectionObjects, itemNode);

                if (collectionObjects.length > 0)
                {
                    control.setValue(collectionObjects);
                }
            }

        }
        //#endregion
    },

    // Designtime only.
    _buildDraggingNodeForErrorItem: function (itemNode)
    {
        var draggingNode = {};
        var validationStatus = itemNode.getAttribute("ValidationStatus");
        var validationMessages = itemNode.getAttribute("ValidationMessages");
        var resourceSvc = SourceCode.Forms.Services.AnalyzerResourcesService();
        var sourceType = itemNode.getAttribute("SourceType");
        var sourceId = itemNode.getAttribute("SourceID");
        var sourceSubformId = itemNode.getAttribute("SourceSubFormID");
        var sourceInstanceId = itemNode.getAttribute("SourceInstanceID");
        var dataType = itemNode.getAttribute("DataType");

        draggingNode.value = (itemNode.selectSingleNode("Display") !== null) ? itemNode.selectSingleNode("Display").text : "";

        if (draggingNode.value === "")
        {
            draggingNode.value = SourceCode.Forms.Designers.Common.getItemDisplayName(itemNode);
        }
        draggingNode.display = draggingNode.value;
        draggingNode.tooltip = draggingNode.value;
        draggingNode.text = draggingNode.value;
        draggingNode.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(sourceType, "") + " error";

        //Set data for node (used in populating preview text)
        draggingNode.data = {};
        draggingNode.data.tooltip = draggingNode.tooltip;
        draggingNode.data.icon = draggingNode.icon;

        if (checkExists(dataType))
        {
            draggingNode.data.DataType = dataType;
        }

        if (checkExists(sourceId))
        {
            draggingNode.data.Guid = sourceId;
            draggingNode.data.id = sourceId;
        }

        if (checkExistsNotEmpty(sourceSubformId))
        {
            draggingNode.data.SubFormID = sourceSubformId;

            if (checkExistsNotEmpty(sourceInstanceId))
            {
                draggingNode.data.SubFormInstanceID = sourceInstanceId;
            }
        }
        else if (checkExistsNotEmpty(sourceInstanceId))
        {
            draggingNode.data.InstanceID = sourceInstanceId;
        }

        if (checkExists(sourceType))
        {
            draggingNode.data.ItemType = sourceType;
        }

        // Validation Status Handling
        draggingNode.status = SourceCode.Forms.DependencyHelper.getMainValidationStatus(validationStatus);
        draggingNode.data.ValidationStatus = validationStatus;
        if (checkExists(resourceSvc) && checkExistsNotEmpty(validationMessages))
        {
            draggingNode.tooltip = resourceSvc.getValidationMessages(validationMessages).join("\n");
            draggingNode.data.ValidationMessages = validationMessages;
            draggingNode.data.tooltip = draggingNode.tooltip;

            var msgObj = resourceSvc.parseValidationMessage(validationMessages)[0];

            draggingNode.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(sourceType, msgObj.subType) + " error";
            draggingNode.data.icon = draggingNode.icon;
        }

        return draggingNode;
    },

    //returns the value from the widget in the same way that it was loaded
    save: function ()
    {
        //#region
        var counter = this._grid.grid("fetch", "rows").length;
        var conditions = [];
        for (var c = 1; c <= counter; c++)
        {
            var left = this.leftDropboxes[c - 1];
            var operator = jQuery("#selOperator" + c);
            var right = this.rightDropboxes[c - 1];

            if (checkExists(left) && checkExists(operator) && checkExists(right))
            {
                var equationValue = this.parentWidget.getEquationOperatorItem(operator[0].value);
                conditions.push({ number: c, left: this._constructItemXml(left), operator: equationValue, right: this._constructItemXml(right) });
            }
        }
        this.parentWidget.innerEquations = conditions;
        this.parentWidget.reload();
        //#endregion
    }

    //#endregion
}

function ExpressionWidget()
{
    //Expression widget will contain the setup of clauses for expressions
}

ExpressionWidget.prototype =
{
    //#region	
    initialize: function (parentElement)
    {
        //#region
        var headingText = Resources.CommonLabels.ExpressionsText;
        if (this.Heading) headingText = this.Heading;
        var contentHTML = "<div id=\"watermarkDivs\" class=\"panel-watermark\">" + Resources.CommonPhrases.NoItemsToDisplay + "</div>";
        var panelHtml = SCPanel.html({ id: "ExpressionPanel", header: headingText, fullsize: true, toolbars: 1, scrolling: true, content: contentHTML });
        var element = jQuery(panelHtml).appendTo(parentElement);
        this._panel = jQuery(element).panel().panel("fetch", "body");
        var tb = jQuery(element).panel("fetch", "toolbars").eq(0);
        if (checkExists(tb) && tb.hasClass("toolbar-wrapper"))
        {
            tb = tb.closest(".toolbar");
        }
        tb.toolbar();
        tb.toolbar("add", "button", { id: "addButton_ExpressionWidget", icon: "add", text: Resources.CommonActions.AddText, description: Resources.Filtering.AddExpressionTooltip, disabled: true });
        tb.toolbar("add", "button", { id: "deleteButton_ExpressionWidget", icon: "delete", text: Resources.CommonActions.RemoveText, description: Resources.Filtering.RemoveExpressionTooltip, disabled: true });

        tb.find('.toolbar-button').each(function (i) {

            switch ($(this).attr('id')) {
                case 'addButton_ExpressionWidget':
                    $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-add" /></svg>');
                    break;
                case 'deleteButton_ExpressionWidget':
                    $(this).find('.button-text').before('<svg width="16" height="16"><use xlink:href="#svg-icon-delete" /></svg>');
                    break;
            }

            $(this).addClass('style-aware');

        });

        var toolbarItems = tb.toolbar("fetch", "buttons");
        jQuery(toolbarItems[0]).on("click", this, this.addExtraExpression);
        jQuery(toolbarItems[1]).on("click", this, this._removeLastExpression);
        return element;
        //#endregion
    },

    //load existing expressionvalues
    load: function (expressionValues)
    {
        //#region
        var currentPanel = this._panel;

        this._panel
            .children()
                .each(function ()
                {
                    var jqThis = $(this);
                    if (!jqThis.is("#watermarkDivs"))
                    {
                        jqThis.remove();
                    }
                });

        var noOfExpressions = expressionValues.length;

        for (var i = 0; i < noOfExpressions; i++)
        {
            var currentExpression = expressionValues[i];
            $("#addButton_ExpressionWidget").removeClass("disabled");
            this.addExpression(currentExpression);
        }

        if (noOfExpressions === 0)
        {
            $("#watermarkDivs").show();
        }

        //#endregion
    },

    //add an expression to the panel
    addExpression: function (currentExpression)
    {
        //#region
        var count = this.parentWidget.conditionGrid._grid.grid("fetch", "rows").length;
        var currentPanel = this._panel;
        if (!$("#addButton_ExpressionWidget").hasClass("disabled"))
        {
            if (checkExists(currentExpression) && currentExpression.grouping)
            {
                //add the current grouping
                var character = currentExpression.grouping;
                var currentGroupingButton;
                if (character === "(")
                {
                    if (currentPanel.children(".grouping-button").length === 0 && count > 0)
                    {
                        this._addGroupingButton(this);
                    }
                    currentGroupingButton = this._addGroupingButton(this);
                }
                else
                {
                    currentGroupingButton = currentPanel.children(".grouping-button").last();
                }

                this._updateGroupingButtonDisplay(currentGroupingButton, character, this);

                if (character === ")")
                {
                    this._addGroupingButton(this);
                }
            }
            else
            {

                if (currentPanel.children(".grouping-button").length === 0 && count > 0)
                {
                    this._addGroupingButton(this);
                }

                if (checkExists(currentExpression))
                {
                    //loaded values
                    //#region
                    if (currentExpression.number)
                    {
                        var selExpression = this._addDropdown(this, "expression-number");
                        this._updateExpressionSelectorDropdown(selExpression, count, currentExpression.number);

                    }
                    else if (currentExpression.expression)
                    {
                        var selExpression = this._addDropdown(this, "expression-operator");
                        this._updateExpressionOperatorDropdown(selExpression, currentExpression.expression.value);
                    }
                    //#endregion
                }
                else
                {
                    //new addition
                    //#region
                    if (currentPanel.children(".grouping-button").length > 1 && count > 0)
                    {
                        var selExpression = this._addDropdown(this, "expression-operator");
                        this._updateExpressionOperatorDropdown(selExpression);
                        this._addGroupingButton(this);
                    }

                    var selExpressionCounter = this._addDropdown(this, "expression-number");
                    this._updateExpressionSelectorDropdown(selExpressionCounter, count, count);
                    selExpressionCounter.appendTo(currentPanel);

                    this._updateExpressionSelectorCounts(currentPanel, count);
                    //#endregion
                }

                if (count > 0)
                {
                    this._addGroupingButton(this);
                }
                if (!currentExpression)
                {
                    this.save();
                }
            }
            if (currentPanel.children(".grouping-button").length > 2)
            {
                $("#deleteButton_ExpressionWidget").removeClass("disabled");
            }

            var watermarks = currentPanel.find("#watermarkDivs");
            for (var d = 0; d < watermarks.length; d++)
            {
                jQuery(watermarks[d]).hide();
            }
        }
        //#endregion
    },

    //remove the last expression from the expression widget
    _removeLastExpression: function (e)
    {
        //#region
        var _this = this;
        if (e && e.data)
        {
            _this = e.data;
        }
        //contains similar code to removeExpressionInstance - maybe check to unite 
        var expressionValues = _this.parentWidget.expressionValues; //array previously saved/loaded
        var e = expressionValues.length - 1;

        var currentValue = null;
        for (var z = e; z > 0; z--)
        {
            if (expressionValues[z].number)
            {
                currentValue = expressionValues[z];
                e = z;
                break;
            }
        }
        //remove this from array
        expressionValues.remove(currentValue);
        //remove the relevant clause in front or behind depending on position
        if (e < expressionValues.length && expressionValues[e].expression)
        {
            expressionValues.remove(expressionValues[e]);
            e = e - 2;
        }
        else if (expressionValues[e - 1].expression)
        {
            expressionValues.remove(expressionValues[e - 1]);
            e = e - 2;
        }
        else
        {
            e--;
        }

        if (e >= 0 && (e + 1) < expressionValues.length && expressionValues[e].grouping && expressionValues[e + 1].grouping)
        {
            var firstGrouping = expressionValues[e + 1].grouping;
            var lastGrouping = expressionValues[e].grouping;
            if (firstGrouping !== lastGrouping)
            {
                expressionValues.remove(expressionValues[e + 1]);
                expressionValues.remove(expressionValues[e]);

                //if removed, remove previous/following expression value
                if (e < expressionValues.length && expressionValues[e].expression)
                {
                    expressionValues.remove(expressionValues[e]);
                }
                else if (e > 0 && expressionValues[e - 1].expression)
                {
                    expressionValues.remove(expressionValues[e - 1]);
                }
            }
        }
        _this.parentWidget.expressionValues = expressionValues;
        _this.load(expressionValues);
        _this.parentWidget.reload();

        //#endregion
    },

    //update the operator dropdown with the relevant values from expressionOperators
    _updateExpressionOperatorDropdown: function (dropdown, value)
    {
        //#region
        var expressionOperators = this.parentWidget.expressionOperators;
        for (var c = 0; c < expressionOperators.length; c++)
        {
            var opt = document.createElement('option');
            opt.innerHTML = expressionOperators[c].display;
            opt.value = expressionOperators[c].value;
            opt.className = expressionOperators[c].icon;
            jQuery(dropdown)[0].appendChild(opt);
        }
        if (checkExists(value))
        {
            jQuery(dropdown)[0].value = value;
        }
        jQuery(dropdown).dropdown("refresh");
        //#endregion
    },

    //update the expression selector dropdown with the list of available conditions
    _updateExpressionSelectorDropdown: function (dropdown, maxCount, value)
    {
        //#region

        for (var c = 1; c <= maxCount; c++)
        {
            var opt = document.createElement('option');
            opt.innerHTML = c;
            opt.value = c;
            jQuery(dropdown)[0].appendChild(opt);
        }
        if (checkExists(value))
        {
            jQuery(dropdown)[0].value = value;
        }
        jQuery(dropdown).dropdown("refresh");
        //#endregion
    },

    //update all the expression selectors with the maximum counts (to be updated to minimize as well - when deleting)
    _updateExpressionSelectorCounts: function (panel, maxCount)
    {
        //#region
        var dropdowns = panel.find(".expression-number");
        for (var d = 0; d < dropdowns.length; d++)
        {
            var dropdown = dropdowns[d];
            if (dropdown.length === maxCount)
            {
                break;
            }
            var starterCount = dropdown.length + 1;
            for (var c = starterCount; c <= maxCount; c++)
            {
                var opt = document.createElement('option');
                opt.innerHTML = c;
                opt.value = c;
                jQuery(dropdown)[0].appendChild(opt);
            }
            jQuery(dropdown).dropdown("refresh");
        }

        //#endregion
    },

    //add a grouping button to the expression panel 
    _addGroupingButton: function (widget, position, control)
    {
        //#region
        var groupingButton = jQuery("<a href='javascript:void(0);' class=\"grouping-button expression-wrapper\"></a>");

        if (checkExists(position) && checkExists(control))
        {
            if (position === "after")
            {
                groupingButton.insertAfter(control);
            }
            else
            {
                groupingButton.insertBefore(control);
            }
        }
        else
        {
            groupingButton.appendTo(widget._panel);
        }
        groupingButton.on("click", { widget: widget }, widget._changeGroupingButton);
        return groupingButton;
        //#endregion
    },

    _updateGroupingButtonDisplay: function (control, character, widget)
    {
        //#region
        switch (character)
        {
            case "(":
                control.addClass("open-grouping");
                break;
            case ")":
                control.addClass("close-grouping");
                break;
        }
        control[0].innerHTML = character;
        //set current control classes
        control.addClass("changed-grouping").removeClass("available-grouping");
        control.off("click").on("click", { widget: widget, control: control, character: character }, widget._resetGroupingButton);
        //#endregion
    },

    //handles the grouping of expressions
    _changeGroupingButton: function (e)
    {
        //#region
        var widget = e.data.widget;
        var _this = this;

        var previousSiblings = jQuery(_this).prevAll(".expression-wrapper");
        var nextSiblings = jQuery(_this).nextAll(".expression-wrapper");
        //determining the character:
        var groupCharacter = '';
        var position = null;

        var leftResult = widget._checkSiblingsForPositioning(previousSiblings, nextSiblings, "left");
        if (leftResult)
        {
            groupCharacter = "(";
            position = "before";
        }
        else
        {
            var rightResult = widget._checkSiblingsForPositioning(previousSiblings, nextSiblings, "right");
            if (rightResult)
            {
                groupCharacter = ")";
                position = "after";
            }
        }

        if (checkExists(position))
        {
            widget._addGroupingButton(widget, position, _this);
            widget._updateGroupingButtonDisplay(jQuery(_this), groupCharacter, widget);
            widget._determineClickableOptions(widget, _this, groupCharacter);
            widget.save();
        }

        //#endregion
    },

    //unified function to check clickability of siblings, depending on the direction of the character 
    _checkSiblingsForPositioning: function (previousSiblings, nextSiblings, direction)
    {
        //#region
        var result = false;
        if (direction === "left")
        {
            if (previousSiblings.length === 0)//first grouping button
            {
                result = true;
            }
            else if (jQuery(previousSiblings[0]).hasClass("expression-operator") || jQuery(nextSiblings[0]).hasClass("expression-number") || jQuery(nextSiblings[0]).children("select").hasClass("expression-number") || jQuery(previousSiblings[0]).children("select").hasClass("expression-operator"))//between operator and number
            {
                result = true;
            }
            else if (jQuery(nextSiblings[0]).hasClass("changed-grouping"))// after a ( must be the same
            {
                result = true;
            }
        }
        else if (direction === "right")
        {
            if (nextSiblings.length === 0)//last grouping button
            {
                result = true;
            }
            else if (jQuery(previousSiblings[0]).hasClass("expression-number") || jQuery(nextSiblings[0]).hasClass("expression-operator") || jQuery(previousSiblings[0]).children("select").hasClass("expression-number") || jQuery(nextSiblings[0]).children("select").hasClass("expression-operator"))//between number and operator
            {
                result = true;
            }
            else if (jQuery(previousSiblings[0]).hasClass("changed-grouping"))// in front of  ) must be the same
            {
                result = true;
            }
        }
        return result;
        //#endregion
    },

    //determine clickable options depending on which character and the positions of possible closing/opening characters
    _determineClickableOptions: function (widget, control, character)
    {
        //#region
        //determining clickable options:
        var nextSiblingButtons = jQuery(control).find("~ .grouping-button:not(.changed-grouping)"); //items to highlight
        var previousSiblingButtons = jQuery(control).prevAll(".grouping-button:not(.changed-grouping)");

        //find all the possible ending points and highlight
        switch (character)
        {
            case "(":
                for (var n = 0; n < nextSiblingButtons.length; n++)
                {
                    //#region
                    var loopButton = nextSiblingButtons[n];
                    var enableButton = false;
                    var previousSiblings = jQuery(loopButton).prevAll(".expression-wrapper");
                    var nextSiblings = jQuery(loopButton).nextAll(".expression-wrapper");
                    var result = widget._checkSiblingsForPositioning(previousSiblings, nextSiblings, "right");
                    if (result)
                    {
                        jQuery(loopButton).addClass("available-grouping").removeClass("unavailable-grouping");
                        jQuery(loopButton).off("click").on("click", { widget: widget }, widget._changeGroupingButton);
                    }
                    else
                    {
                        jQuery(loopButton).addClass("unavailable-grouping").removeClass("available-grouping");
                        jQuery(loopButton).off("click");
                    }
                    //#endregion
                }
                break;
            case ")":
                for (var p = 0; p < previousSiblingButtons.length; p++)
                {
                    //#region
                    var loopButton = previousSiblingButtons[p];
                    var enableButton = false;
                    var previousSiblings = jQuery(loopButton).prevAll(".expression-wrapper");
                    var nextSiblings = jQuery(loopButton).nextAll(".expression-wrapper");
                    var result = widget._checkSiblingsForPositioning(previousSiblings, nextSiblings, "left");
                    if (result)
                    {
                        jQuery(loopButton).addClass("available-grouping").removeClass("unavailable-grouping");
                        jQuery(loopButton).off("click").on("click", { widget: widget }, widget._changeGroupingButton);
                    }
                    else
                    {
                        jQuery(loopButton).addClass("unavailable-grouping").removeClass("available-grouping");
                        jQuery(loopButton).off("click");
                    }
                    //#endregion
                }
                break;
        }

        if (widget.groupingCompleted === false)
        {
            widget.groupingCompleted = true;
        }
        else
        {
            widget.groupingCompleted = false;
        }

        if (widget.groupingCompleted)
        {
            widget._resetSiblingClickables(control, widget);
        }
        //#endregion
    },

    //remove the current grouping buttons & highlight relevant options to remove if applicable
    _resetGroupingButton: function (e)
    {
        //#region
        var widget = e.data.widget;
        var control = e.data.control;
        var character = e.data.character;

        //reset the values if the control was previously changed
        //reset the values if this option was made available by another grouping button's click
        if (jQuery(control).hasClass("changed-grouping") || jQuery(control).hasClass("available-grouping"))
        {
            widget.groupingCompleted = true;
            widget._resetSiblingClickables(control, widget);
        }

        var canContinue = widget._validateGroupings(widget); //check if the numbers still add up
        if (canContinue)
        {
            switch (character)
            {
                case "(":
                    //find following closing siblings
                    var nextSiblings = jQuery(control).nextAll(".close-grouping");
                    nextSiblings.addClass("available-grouping");
                    break;
                case ")":
                    //find preceding opening siblings
                    var previousSiblings = jQuery(control).prevAll(".open-grouping");
                    previousSiblings.addClass("available-grouping");
                    break;
            }
        }
        jQuery(control).remove();
        widget.save();
        //#endregion
    },

    //shared functiono that resets sibling clickables when the grouping is completed
    _resetSiblingClickables: function (control, widget)
    {
        //#region
        var allSiblings = jQuery(control).siblings(".grouping-button");
        allSiblings.addClass("all-grouping").removeClass("available-grouping").removeClass("unavailable-grouping");
        jQuery(control).siblings(".grouping-button:not(.changed-grouping)").off("click").on("click", { widget: widget }, widget._changeGroupingButton);
        //#endregion
    },

    //add a dropdown to the expression panel
    _addDropdown: function (widget, extraClass)
    {
        //#region
        var container = jQuery("<div></div>").appendTo(widget._panel);
        container.addClass("expression-dropdown-container").addClass("expression-wrapper");
        var selExpression = jQuery("<select></select>").appendTo(container).dropdown();
        selExpression.addClass(extraClass);
        jQuery(selExpression).on("change", function () { widget.save(); });
        return selExpression;
        //#endregion
    },

    //called when the add was clicked on the expression panel
    addExtraExpression: function (e)
    {
        //#region
        var _this = this;
        if (e && e.data)
        {
            _this = e.data;
        }
        if (!$("#addButton_ExpressionWidget").hasClass("disabled"))
        {
            _this.addExpression();
        }
        //#endregion
    },

    //when a condition is deleted, remove the specific number and relevant clauses from the expressions
    removeExpressionInstance: function (expressionNumber)
    {
        var expressionValues = this.parentWidget.expressionValues; //array previously saved/loaded
        for (var e = 0; e < expressionValues.length; e++)
        {
            var currentValue = expressionValues[e];
            if (checkExists(currentValue) && currentValue.number)
            {
                if (expressionNumber < currentValue.number)
                {
                    //subtract all following condition numbers by one 
                    currentValue.number = expressionValues[e].number - 1;
                }
                else if (expressionNumber === currentValue.number)
                {
                    //remove this from array
                    expressionValues.remove(currentValue);
                    //remove the relevant clause in front or behind depending on position
                    if (expressionValues.length > 0)
                    {
                        if (e < expressionValues.length && expressionValues[e].expression)
                        {
                            expressionValues.remove(expressionValues[e]);
                            e = e - 2;
                        }
                        else if (expressionValues[e - 1].expression)
                        {
                            expressionValues.remove(expressionValues[e - 1]);
                            e = e - 2;
                        }
                        else
                        {
                            e--;
                        }

                        //remove the grouping (if only grouping in here)
                        if (e >= 0 && (e + 1) < expressionValues.length && expressionValues[e].grouping && expressionValues[e + 1].grouping)
                        {
                            var firstGrouping = expressionValues[e + 1].grouping;
                            var lastGrouping = expressionValues[e].grouping;
                            if (firstGrouping !== lastGrouping)
                            {
                                expressionValues.remove(expressionValues[e + 1]);
                                expressionValues.remove(expressionValues[e]);

                                //if removed, remove previous/following expression value
                                if (e < expressionValues.length && expressionValues[e].expression)
                                {
                                    expressionValues.remove(expressionValues[e]);
                                    e--;
                                }
                                else if (expressionValues[e - 1].expression)
                                {
                                    expressionValues.remove(expressionValues[e - 1]);
                                    e--;
                                }
                                e = e - 2;
                            }
                        }
                    }
                }
            }
        }

        if (expressionValues.length === 0)
        {
            $("#deleteButton_ExpressionWidget").addClass("disabled");
            if (this.parentWidget.innerEquations.length === 0) $("#addButton_ExpressionWidget").addClass("disabled");
        }
        if (expressionValues.length === 1)
        {
            $("#deleteButton_ExpressionWidget").addClass("disabled");
            $("#addButton_ExpressionWidget").removeClass("disabled");
        }
        this.parentWidget.expressionValues = expressionValues;
        this.load(expressionValues);
        this.parentWidget.reload();
    },

    //validate the groupings - check that all the opening tags have closing tags etc.
    _validateGroupings: function (widget)
    {
        //#region
        var items = widget._panel.find(".expression-wrapper.changed-grouping");
        var outstandingCount = 0;
        for (var i = 0; i < items.length; i++)
        {
            var item = jQuery(items[i]);
            if (item.hasClass("open-grouping"))
            {
                outstandingCount++;
            }
            else if (item.hasClass("close-grouping"))
            {
                outstandingCount--;
            }
        }
        //simple check -> if not zero the openening and closing parentheses do not match (this will ensure that the collections and preview will not be updated)
        if (outstandingCount !== 0)
        {
            return false;
        }
        else
        {
            return true;
        }
        //#endregion
    },

    //returns the value from the widget in the same way that it was loaded
    save: function ()
    {
        //#region
        var canContinue = this._validateGroupings(this);
        if (canContinue)
        {
            var items = this._panel.find(".expression-wrapper");
            var expressionValues = [];
            for (var i = 0; i < items.length; i++)
            {
                var currentItem = jQuery(items[i]);
                if (currentItem.hasClass("changed-grouping"))
                {
                    expressionValues.push({ grouping: currentItem[0].innerHTML });
                }
                else //try to find the select
                {
                    var selectBox = currentItem.children("select");
                    if (selectBox.length === 0)
                    {
                        selectBox = currentItem.next("select");
                    }
                    if (selectBox.length > 0)
                    {
                        if (selectBox.hasClass("expression-number"))
                        {
                            expressionValues.push({ number: parseInt(selectBox[0].value, 10) });
                        }
                        else if (selectBox.hasClass("expression-operator"))
                        {
                            var expressionValue = this.parentWidget.getExpressionOperatorItem(selectBox[0].value);
                            expressionValues.push({ expression: expressionValue });
                        }
                    }
                }
            }
            this.parentWidget.expressionValues = expressionValues;
            this.parentWidget.reload();
        }
        //#endregion
    }
    //#endregion
}


function PreviewWidget()
{
    //Preview widget will contain the combination of the clauses for the expression and the value of the different items written out like normal text
}

PreviewWidget.prototype =
{
    //#region
    _isRuntime: false,

    initialize: function (parentElement)
    {
        this._isRuntime = SourceCode.Forms.Layout.isRuntime();
        var headingText = Resources.CommonLabels.PreviewText;
        if (this.Heading) headingText = this.Heading;
        var contentHTML = "<div id=\"previewWatermarkDivs\" class=\"panel-watermark\">" + Resources.CommonPhrases.NoItemsToDisplay + "</div>";
        var panelHtml = SCPanel.html({ id: "previewWidget", header: headingText, fullsize: true, toolbars: 0, scrolling: true, content: contentHTML });
        var element = jQuery(panelHtml).appendTo(parentElement);
        jQuery(element).panel();
        this.panel = jQuery("#previewWidget").panel("fetch", "body");
        return element;
    },

    //load the information to be previewed from the equations and expressions specified from the parent widget
    load: function (equations, expressions)
    {
        //#region
        this.panel
            .children()
                .each(function ()
                {
                    var jqThis = $(this);
                    if (!jqThis.is("#previewWatermarkDivs"))
                    {
                        jqThis.remove();
                    }
                });
        this.parentWidget.previewText = "";
        var expressionLength = expressions.length;
        for (var e = 0; e < expressionLength; e++)
        {
            if (expressions[e].number)
            {
                this._constructEquationText(equations[(expressions[e].number - 1)]);
            }
            else if (expressions[e].expression)
            {
                this._constructExpressionText(expressions[e].expression);
            }
            else if (expressions[e].grouping)
            {
                this._constructGroupingText(expressions[e].grouping);
            }
        }

        if (expressionLength === 0)
        {
            $("#previewWatermarkDivs").show();
            $("#deleteButton_ExpressionWidget").addClass("disabled");
            if (this.parentWidget.innerEquations.length === 0) $("#addButton_ExpressionWidget").addClass("disabled");
        }
        else if (expressionLength === 1)
        {
            $("#deleteButton_ExpressionWidget").addClass("disabled");
            $("#addButton_ExpressionWidget").removeClass("disabled");
            $("#previewWatermarkDivs").hide();
        }
        else
        {
            $("#previewWatermarkDivs").hide();
        }
        //#endregion
    },

    //construct the text from the equation that should be shown in the preview section
    _constructEquationText: function (equation)
    {
        //#region
        var leftValue = this._deconstructEquationItemXml(equation.left);
        var rightValue = this._deconstructEquationItemXml(equation.right);
        var equationDiv = jQuery("<span>" + leftValue.htmlEncode() + "&nbsp;" + equation.operator.preview + "&nbsp;" + rightValue.htmlEncode() + "</span>");
        equationDiv.addClass("previewText");
        this.parentWidget.previewText += leftValue + " " + equation.operator.preview + " " + rightValue;
        equationDiv.appendTo(this.panel);
        //#endregion
    },

    //construct the text for the expresion display (and/or)
    _constructExpressionText: function (expression)
    {
        //#region
        var expressionDiv = jQuery("<span>&nbsp;" + expression.display + "&nbsp;</span>");
        this.parentWidget.previewText += " " + expression.display + " ";
        expressionDiv.appendTo(this.panel);
        //#endregion
    },

    //construct the text from the grouping that should be shown in the preview section
    _constructGroupingText: function (grouping)
    {
        //#region
        var groupingDiv = jQuery("<span>" + grouping + "</span>");
        this.parentWidget.previewText += grouping;
        groupingDiv.appendTo(this.panel);
        //#endregion
    },

    //shared function to return the equation itemnode's text
    _deconstructEquationItemXml: function (itemNode)
    {
        var result = "";

        if (!checkExists(itemNode))
        {
            return result;
        }

        if (itemNode.getAttribute("SourceType") === "Value")
        {
            var itemNodes = itemNode.selectNodes("SourceValue/Item");
            if (itemNodes.length > 0)
            {
                for (var i = 0; i < itemNodes.length; i++)
                {
                    result += this._describeDeconstructEquationItemXml(itemNodes[i]);
                }
            }
            else
            {
                result += this._describeDeconstructEquationItemXml(itemNode);
            }
        }
        else
        {
            result += this._describeDeconstructEquationItemXml(itemNode);
        }

        return result;		
    },

    //helper function to construct item xml - reusable between simple and nested situations
    _describeDeconstructEquationItemXml: function (item)
    {
        var result = "";
        if (!checkExists(item))
        {
            return result;
        }
        var sourceType = item.getAttribute("SourceType");
        if (sourceType === "Value" && checkExistsNotEmpty(item.text))
        {
            result += item.text;
        }
        else if (sourceType === "ViewParameter" || sourceType === "FormParameter")
        {
            result += item.getAttribute("SourceID");
        }
        else
        {
            if (this._isRuntime)
            {
                if (item.getAttribute("SourceDisplayName") !== null)
                {
                    result += item.getAttribute("SourceDisplayName");
                }
                else if (item.getAttribute("DisplayName") !== null)
                {
                    result += item.getAttribute("DisplayName");
                }
                else if (item.getAttribute("SourceName") !== null)
                {
                    result += item.getAttribute("SourceName");
                }
            }
            else
            {
                result += SourceCode.Forms.Designers.Common.getItemDisplayName(item);
            }

        }
        return result;
    }

    //#endregion
}
