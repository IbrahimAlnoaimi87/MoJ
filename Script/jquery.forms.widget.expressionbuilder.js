/* global applicationRoot: false */
/* global SourceCode: true */
/* global Resources: true */
/* global HelpHelper: false */
/* global checkExists: false */
/* global popupManager: false */
/* global parseXML: false */
/* global tryParseXML: false */
/* global $chk: false */
/* global SCExpressionBuilder: true */
/* global XslTransform: false */
/* global ConfigurationWidget: false */

(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    var css = {
        comma: "comma",
        wrapper: "sub-expression-wrapper",
        extra: "add-extra-term",
        container: "operator-container",
        operator: "operator",
        fn: "function",
        textbox: "textbox-container",
        bracket: "bracket",
        leftbracket: "left-bracket",
        rightbracket: "right-bracket",
        collapsemargin: "collapsed-margin"
    };

    SourceCode.Forms.Widget.ExpressionBuilder =
    {
        //#region
        contentWrapper: null,
        expressionPanel: null,
        contextPanel: null,
        partialPageContent: null,
        previewPanel: null,
        previewText: null,
        operatorData: null,
        transformer: null,
        resourceService: null,

        css: css,

        extradropoptions: {
            accept: ".ui-draggable:not(.{0}, .{1}, .{2}, .{3})".format("operator", css.bracket, css.fn, css.textbox),
            activeClass: "hover",
            tolerance: "pointer"
        },

        tokenboxoptions: { accept: ".ui-draggable:not(.{0}, .{1}, .{2}, .{3})".format("operator", css.bracket, css.fn, css.textbox) },

        _addDropAreas: function (ev, ui, dragstarted)
        {
            if (dragstarted < 1)
            {
                var target = $(ev.target);

                if (target.is(".left-bracket"))
                {
                    this._addLeftBracketDropAreas();
                }
                else if (target.is(".right-bracket"))
                {
                    this._addRightBracketDropAreas();
                }
                else if (target.is(".function"))
                {
                    this._addFunctionDropAreas(target.parent().metadata());
                }
                else if (target.is(".operator"))
                {
                    this._addOperatorDropAreas();
                }
            }
        },

        _addTokenBox: function (element, value, insertOption)
        {
            //TODO: TD 0001
            var metaArray = { watermark: Resources.ExpressionBuilder.TokenboxWatermarkText };

            var input = $(this.html.textbox.format("<input type=\"text\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode() + "\" />"));

            switch (insertOption)
            {
                case "after":
                    element.after(input);
                    break;
                case "before":
                    element.before(input);
                    break;
                case "append":
                    element.append(input);
                    break;
                case "replace":
                    element.find("input[type=text]").tokenbox("destroy");
                    element.replaceWith(input);
                    break;
            }

            input.find("input[type=text]").tokenbox(this.tokenboxoptions);

            if (value !== undefined && value !== null)
            {
                input.find("input[type=text]").tokenbox("value", value);
            }

            this._update();

            return input;
        },

        _addTokenBoxToWrapper: function (element, value)
        {
            return this._addTokenBox(element, value, "append");
        },

        //add the dropping areas for operators
        _addFunctionDropAreas: function ()
        {
            //#region
            var self = this;

            // Place dropareas before tokenbox, functions, & left-brackets
            this.expressionPanel.find(".{0}, .{1}, .{2}".format(this.css.textbox, this.css.fn, this.css.leftbracket)).filter(function ()
            {
                if ($(this).is("." + self.css.leftbracket))
                {
                    return $(this).prev("." + self.css.fn + ", ." + self.css.container).length === 0;
                }

                return true;

            }).before($(self.html.container));

            // Identify existing operators (in order to replace them if new operator is dropped on them)
            this.expressionPanel.find("." + this.css.fn).addClass("existing-operator");

            // Make dropareas & existing operators droppable
            this.expressionPanel.find(".{0}, .existing-operator".format(this.css.container)).droppable({
                tolerance: "pointer",
                hoverClass: "hover",
                drop: this._dropFunction.bind(this),
                over: function (e, ui)
                {
                    ui.helper.addClass('valid');
                },
                out: function (e, ui)
                {
                    ui.helper.removeClass('valid');
                },
                addClasses: false,
                accept: ".function"
            });
            //#endregion
        },

        _addExtraArgument: function (element, value)
        {
            var jqComma = $(this.html.comma);
            element.before(jqComma);
            var newWrapper = $(this.html.wrapper);
            jqComma.after(newWrapper);
            return this._addTokenBoxToWrapper(newWrapper, value);
        },

        _addExtraDrop: function (e, ui)
        {
            var item = ui.draggable.parent("li");
            this._addExtraArgument($(e.target), [{ type: "context", text: item.children("a").text(), data: item.metadata() }]);
        },

        _addFunctionHotSpots: function (func, leftBracket, rightBracket)
        {
            var _this = this;

            if (!rightBracket)
            {
                rightBracket = this.expressionPanel.find("." + this.css.rightbracket).filter(function ()
                {
                    return ($(this).data("match") !== undefined && $(this).data("match")[0] === leftBracket[0]);
                }).eq(0);
            }

            if (!leftBracket)
            {
                leftBracket = this.expressionPanel.find("." + this.css.leftbracket).filter(function ()
                {
                    return ($(this).data("match") !== undefined && $(this).data("match")[0] === rightBracket[0]);
                }).eq(0);
            }

            if (rightBracket.length === 0 || leftBracket.length === 0) { return; }

            var functionElement = (func !== undefined && func !== null) ? func : leftBracket.prev("." + this.css.fn);
            if (functionElement.length === 0) { return; }

            var funcData = func.data("funcdata");

            var hotspots = funcData.selectNodes("Parameters/Parameter").length;
            var isvariadic = (checkExists(funcData.getAttribute("IsVariadic")) && funcData.getAttribute("IsVariadic").toLowerCase() === "true") ? true : false;

            var expressionWrapper = leftBracket.next("." + this.css.wrapper);

            var currentPosition, jqComma, newWrapper, extra;

            if (expressionWrapper.length === 0)
            {
                //find and remove all contents into a new wrapper
                var spanWrapper = $(this.html.wrapper);
                var rightBracketFound = false;
                currentPosition = leftBracket.nextAll().each(function ()
                {
                    var jqThis = $(this);
                    if (jqThis.is("." + _this.css.rightbracket) && jqThis.data("match")[0] === leftBracket[0])
                    {
                        return false;
                    }
                    jqThis.appendTo(spanWrapper);
                });
                leftBracket.after(spanWrapper);
                currentPosition = spanWrapper;
                if (hotspots > 1)
                {
                    for (var i = 1; i < hotspots; i++)
                    {
                        jqComma = $(this.html.comma);
                        currentPosition.after(jqComma);
                        newWrapper = $(this.html.wrapper);
                        jqComma.after(newWrapper);
                        this._addTokenBoxToWrapper(newWrapper);
                        currentPosition = newWrapper;
                    }
                }

                if (isvariadic)
                {
                    extra = $(this.html.extra);
                    currentPosition.after(extra);
                    extra.droppable(this.extradropoptions);
                    extra.droppable("option", "drop", this._addExtraDrop.bind(this));
                    extra.on("click", function (ev)
                    {
                        _this._addExtraArgument($(ev.target));
                        _this._update();
                    });
                }
            }
            else
            {
                //sync up
                //does are there enough commas? if not add/remove them
                var contents = $();
                leftBracket.nextAll().each(function ()
                {
                    var jqThis = $(this);
                    if (jqThis.is("." + _this.css.rightbracket) && jqThis.data("match") === leftBracket[0])
                    {
                        return false;
                    }
                    contents = contents.add(jqThis);
                });
                var commas = contents.filter("." + this.css.comma).length;
                var extraTerm = contents.filter("." + this.css.extra);
                if (hotspots > 0)
                {
                    extraTerm.remove();
                    if (commas > hotspots - 1)
                    {
                        //remove extras
                        var commaCount = 0;
                        contents.each(function ()
                        {
                            var jqThis = $(this);
                            if (jqThis.is("." + _this.css.comma))
                            {
                                commaCount++;
                            }
                            if (commaCount > hotspots - 1)
                            {
                                jqThis.remove();
                            }
                        });
                    }
                    else if (commas < hotspots - 1)
                    {
                        currentPosition = contents.filter(":not(." + this.css.extra + ")").last();
                        for (var i = 0; i < hotspots - commas - 1; i++)
                        {
                            jqComma = $(this.html.comma);
                            currentPosition.after(jqComma);
                            newWrapper = $(this.html.wrapper);
                            jqComma.after(newWrapper);
                            this._addTokenBoxToWrapper(newWrapper);
                            currentPosition = newWrapper;
                        }
                    }
                }
                else
                {
                    //we don't care if its N but ensure the add-extra-term is there
                    if (extraTerm.length === 0)
                    {
                        extra = $(this.html.extra);
                        contents.last().after(extra);
                        extra.droppable(this.extradropoptions);
                        extra.droppable("option", "drop", this._addExtraDrop.bind(this));
                        extra.on("click", function (ev)
                        {
                            _this._addExtraArgument($(ev.target));
                            _this._update();
                        });
                    }
                }
            }
        },

        //add the dropping areas for operators
        _addLeftBracketDropAreas: function ()
        {
            //#region
            var _this = this;

            // Do not add drop areas if there exist more left-brackets than
            if (this.expressionPanel.find("." + this.css.leftbracket).length > this.expressionPanel.find("." + this.css.rightbracket).length)
            {
                return;
            }

            // Placing a drop area in front of any tokenbox
            this.expressionPanel.find("." + this.css.textbox).before($(this.html.container));

            // Finding functions & other left-brackets, placing dropareas in front of those applicable
            this.expressionPanel.find(".{0}, .{1}".format(this.css.fn, this.css.leftbracket)).filter(function ()
            {
                if ($(this).is(".{0}".format(_this.css.leftbracket)))
                {
                    return $(this).prev(".{0}".format(_this.css.fn)).length === 0;
                }
                else
                {
                    return true;
                }

            }).each(function ()
            {
                var jqThis = $(this);
                if (jqThis.prev("." + _this.css.operator).length === 0)
                {
                    jqThis.before($(_this.html.container));
                }
            });

            // Apply droppable event handlers
            this.expressionPanel.find("." + this.css.container).droppable({
                tolerance: 'pointer',
                hoverClass: "hover",
                drop: this._dropLeftBracket.bind(this),
                over: function (e, ui)
                {
                    ui.helper.addClass('valid');
                },
                out: function (e, ui)
                {
                    ui.helper.removeClass('valid');
                },
                addClasses: false,
                accept: ".ui-draggable"
            });
            //#endregion
        },

        //add the dropping areas for operators
        _addOperatorDropAreas: function ()
        {
            //#region
            var self = this;

            // Place a drop area after each tokenbox and right-bracket
            this.expressionPanel.find(".{0}, .{1}".format(this.css.textbox, this.css.rightbracket)).after($(this.html.container));

            // Place a drop area before each tokenbox, function & left-bracket not preceeded by an operator
            this.expressionPanel.find(".{0}, .{1}, .{2}".format(this.css.textbox, this.css.fn, this.css.leftbracket)).filter(function ()
            {
                if ($(this).is("." + self.css.leftbracket))
                {
                    return $(this).prev("." + self.css.fn).length === 0;
                }
                else
                {
                    return $(this).prev("." + self.css.operator).length === 0;
                }
            }).before($(this.html.container));

            // Identify existing operators (in order to replace them if new operator is dropped on them)
            this.expressionPanel.find("." + this.css.operator).addClass("existing-operator");

            // Making dropareas & existing operators droppable
            this.expressionPanel.find("." + this.css.container + ", .existing-operator").droppable({
                tolerance: 'pointer',
                hoverClass: "hover",
                drop: this._dropOperatorItem.bind(this),
                over: function (e, ui)
                {
                    ui.helper.addClass('valid');
                },
                out: function (e, ui)
                {
                    ui.helper.removeClass('valid');
                },
                addClasses: false,
                accept: ".operator"
            });
            //#endregion
        },

        //add the Right Bracket DropAreas for operators
        _addRightBracketDropAreas: function ()
        {
            //#region
            var _this = this;
            var leftBrackets = this.expressionPanel.find("." + this.css.leftbracket);
            if (leftBrackets.length <= this.expressionPanel.find("." + this.css.rightbracket).length)
            {
                return;
            }

            leftBrackets
                .each(function ()
                {
                    var jqthis = $(this);
                    var match = jqthis.data("match");
                    var found = false;
                    jqthis.nextAll("." + _this.css.rightbracket)
                        .each(function ()
                        {
                            found = ($(this).data("match") === match);
                            if (found)
                            {
                                return false;
                            }
                        });
                    if (!found)
                    {
                        jqthis.nextAll(".{0}, .{1}".format(_this.css.textbox, _this.css.rightbracket))
                            .each(function ()
                            {
                                if ($(this).next("." + _this.css.container).length === 0)
                                {
                                    var dropArea = $(_this.html.container);
                                    dropArea.data("match", match);
                                    $(this).after(dropArea);
                                }
                            });
                    }
                });

            this.expressionPanel.find("." + this.css.container).droppable({
                tolerance: 'pointer',
                hoverClass: "hover",
                drop: this._dropRightBracket.bind(this),
                over: function (e, ui)
                {
                    ui.helper.addClass('valid');
                },
                out: function (e, ui)
                {
                    ui.helper.removeClass('valid');
                },
                addClasses: false,
                accept: ".ui-draggable"
            });
            //#endregion
        },

        // Generate the definition XML of the expression or part thereof (recursive)
        _buildExpressionForNodes: function (nodes, doc, entry)
        {
            var stack = [], node, tagname, xnode, vnode, pnode;

            for (var i = 0, l = nodes.length; i < l; i++)
            {
                node = nodes.eq(i);

                if (node.is("." + this.css.leftbracket))
                {
                    // Opening bracket node
                    stack.push("(");
                    if (node.prev("." + this.css.fn).length === 0)
                    {
                        entry = entry.appendChild(doc.createElement("Bracket"));
                    }
                }
                else if (node.is("." + this.css.rightbracket))
                {
                    // Closing bracket node
                    stack.pop();
                    if (node.data("match").prev("." + this.css.fn).length === 0)
                    {
                        while (entry !== null && entry.tagName !== undefined && entry.tagName.toLowerCase() !== "bracket" && entry.parentNode !== null)
                        {
                            entry = entry.parentNode;
                        }
                    }

                    entry = entry.parentNode !== null ? entry.parentNode : null;
                }
                else if (node.is("." + this.css.fn))
                {
                    // Function Node
                    tagname = node.data("funcdata").selectSingleNode("Name").firstChild.nodeValue;
                    entry = entry.appendChild(doc.createElement(tagname));
                }
                else if (node.is("." + this.css.operator))
                {
                    // Operator Node
                    tagname = node.data("funcdata").selectSingleNode("Name").firstChild.nodeValue;

                    // Find operator functions
                    var opcur = this.operatorData.selectSingleNode("//Function[Name='" + entry.nodeName + "']");
                    var opnew = this.operatorData.selectSingleNode("//Function[Name='" + tagname + "']");

                    // Determine operator precendence from function details
                    var pcur = (opcur !== null && checkExists(opcur.getAttribute("OperatorPrecendence"))) ? parseInt(opcur.getAttribute("OperatorPrecendence")) : 5;
                    var pnew = (opnew !== null && checkExists(opnew.getAttribute("OperatorPrecendence"))) ? parseInt(opnew.getAttribute("OperatorPrecendence")) : 5;

                    // Find the parent of the current entry point
                    pnode = entry.parentNode;

                    // Check the parent node to see if it is an operator & calculate precedence
                    var opparent = this.operatorData.selectSingleNode("//Function[Name='" + pnode.nodeName + "']");
                    var pparent = (opparent !== null && checkExists(opparent.getAttribute("OperatorPrecendence"))) ? parseInt(opparent.getAttribute("OperatorPrecendence")) : 5;

                    if (pnew >= pcur)
                    {
                        while (pnew >= pparent && entry.parentNode !== null)
                        {
                            entry = entry.parentNode;
                            pnode = entry.parentNode;

                            opparent = this.operatorData.selectSingleNode("//Function[Name='" + pnode.nodeName + "']");
                            pparent = (opparent !== null && checkExists(opparent.getAttribute("OperatorPrecendence"))) ? parseInt(opparent.getAttribute("OperatorPrecendence")) : 5;
                        }

                        xnode = pnode.removeChild(entry);
                        entry = pnode.appendChild(doc.createElement(tagname));
                        entry.appendChild(xnode);
                    }
                    else
                    {
                        xnode = entry.removeChild(entry.lastChild);
                        entry = entry.appendChild(doc.createElement(tagname));
                        entry.appendChild(xnode);
                    }

                }
                else if (node.is("." + this.css.textbox))
                {
                    // Value Node
                    var sv;

                    var tokenboxvalue = node.find("input[type=text]").tokenbox("value");

                    if (tokenboxvalue.length === 1)
                    {
                        this._buildValueNode(tokenboxvalue[0], doc, entry);
                    }
                    else
                    {
                        vnode = entry.appendChild(doc.createElement("Item"));
                        vnode.setAttribute("SourceType", "Value");
                        sv = vnode.appendChild(doc.createElement("SourceValue"));
                        sv.setAttribute("xml:space", "preserve");

                        for (var j = 0, k = tokenboxvalue.length; j < k; j++)
                        {
                            this._buildValueNode(tokenboxvalue[j], doc, sv);
                        }
                    }
                }
                else if (node.is("." + this.css.wrapper))
                {
                    // Sub Expression Node
                    this._buildExpressionForNodes(node.children(), doc, entry);
                }
            }

            if (stack.length > 0)
            {
                return;
            }

        },

        // Generates the preview text used to populate the preview panel & display node of the expression
        _buildExpressionPreviewText: function (nodes)
        {
            var result = "";

            for (var i = 0, l = nodes.length; i < l; i++)
            {
                var node = nodes.eq(i), text = "", data = null;

                if (node.is("." + this.css.fn + ", ." + this.css.operator))
                {
                    data = node.data("funcdata");

                    if (!!data) {
                        // Read function/operator name from bound data
                        if (data.selectSingleNode("ShortName") !== null) {
                            text = data.selectSingleNode("ShortName").firstChild.nodeValue;
                        }
                        else if (data.selectSingleNode("DisplayName") !== null) {
                            text = data.selectSingleNode("DisplayName").firstChild.nodeValue;
                        }
                    }
                    if (text === null || text === "")
                    {
                        // Fallback if data bound did not yield a value
                        text = node.text().trim();
                    }
                }
                else if (node.is("." + this.css.wrapper))
                {
                    text = this._buildExpressionPreviewText(node.children());
                }
                else if (node.is("." + this.css.textbox))
                {
                    var tokenboxvalue = node.find("input[type=text]").tokenbox("value");

                    if (tokenboxvalue.length > 0)
                    {
                        var textarr = [];
                        for (var j = 0, k = tokenboxvalue.length; j < k; j++)
                        {
                            textarr.push(tokenboxvalue[j].text.insertNBSpace());
                        }
                        text = textarr.join(" ");
                    }
                    else
                    {
                        text = "[blank]";
                    }
                }
                else if (node.is(":not(." + this.css.extra + ")") || node.is("." + this.css.bracket))
                {
                    text = node.text().trim();
                }

                if (!!text) {
                    result += (node.is(":not(." + this.css.comma + ")") ? " " : "") + text;
                }
            }

            return result.trim();
        },

        // Build value item node
        _buildValueNode: function (value, doc, entry)
        {
            var inode = entry.appendChild(doc.createElement("Item")), disp, isv;

            if (value.type === "value")
            {
                inode.setAttribute("SourceType", "Value");

                if (value.data.DataType !== undefined)
                {
                    inode.setAttribute("DataType", this._mapDataType(value.data.DataType));
                }
                else
                {
                    inode.setAttribute("DataType", "Text");
                }

                if (value.data.SubType !== undefined)
                {
                    inode.setAttribute("Type", value.data.SubType);
                }

                disp = inode.appendChild(doc.createElement("Display"));
                disp.appendChild(doc.createTextNode(value.text));

                isv = inode.appendChild(doc.createElement("SourceValue"));
                isv.setAttribute("xml:space", "preserve");
                isv.appendChild(doc.createTextNode(value.data));
            }
            else if (value.data.ItemType === "Literal")
            {
                inode.setAttribute("SourceType", "Value");

                if (value.data.SubType !== undefined && value.data.SubType !== "")
                {
                    inode.setAttribute("Type", value.data.SubType);
                }

                if (value.data.DataType !== undefined && value.data.DataType !== "")
                {
                    inode.setAttribute("DataType", this._mapDataType(value.data.DataType));
                }
                else
                {
                    inode.setAttribute("DataType", "Text");
                }

                isv = inode.appendChild(doc.createElement("SourceValue"));
                isv.setAttribute("xml:space", "preserve");
                isv.appendChild(doc.createTextNode(value.data.Value.toString()));
            }
            else
            {
                inode.setAttribute("SourceType", value.data.ItemType);
                inode.setAttribute("SourceID", value.data.id);

                if (checkExists(value.data.InstanceID) && value.data.InstanceID !== "")
                {
                    inode.setAttribute("SourceInstanceID", value.data.InstanceID);
                }
                if (checkExists(value.data.SubType) && value.data.SubType !== "")
                {
                    inode.setAttribute("Type", value.data.SubType);
                }

                if (value.data.DataType !== undefined && value.data.DataType !== "")
                {
                    inode.setAttribute("DataType", this._mapDataType(value.data.DataType));
                }
                else
                {
                    inode.setAttribute("DataType", "Text");
                }

                if (checkExists(value.data.Name) && value.data.Name !== "")
                {
                    inode.setAttribute("SourceName", value.data.Name);
                }

                if (checkExists(value.data.DisplayName) && value.data.DisplayName !== "")
                {
                    inode.setAttribute("SourceDisplayName", value.data.DisplayName);
                }

                if (checkExists(value.data.SourcePath) && checkExists(value.data.SourcePath !== ""))
                {
                    inode.setAttribute("SourcePath", value.data.SourcePath);
                    inode.setAttribute("SourceID", value.data.SourceID);
                }
                disp = inode.appendChild(doc.createElement("Display"));
                disp.appendChild(doc.createTextNode(value.text));
            }
        },

        // creating & initialising the widget
        _create: function ()
        {
            //#region
            var xml;
            if (this.options.contextXML && !this.options.contextXML.xml)
            {
                xml = this.options.contextXML;
                this.options.contextXML = parseXML(xml);
            }
            if (this.options.currentXML && !this.options.currentXML.xml)
            {
                xml = this.options.currentXML;
                this.options.currentXML = parseXML(xml);
            }
            if (this.options.operatorXML && !this.options.operatorXML.xml)
            {
                xml = this.options.operatorXML;
                this.options.operatorXML = parseXML(xml);
            }

            if (this.element)
            {
                this.contentWrapper = this.element;
            }
            else
            {
                this.contentWrapper = $("<div></div>");
            }

            if (typeof SourceCode.Forms.Services.AnalyzerResourcesService !== "undefined")
            {
                this.resourceService = SourceCode.Forms.Services.AnalyzerResourcesService();
            }

            this.contentWrapper.empty().load("Expressions/ExpressionBuilder.aspx", this._partialPageLoaded.bind(this));
            //#endregion
        },

        // Destroy widget method implementation
        _destroy: function ()
        {
            this.contextTree.off(".expressionbuilder");
            this.operatorTree.off(".expressionbuilder");

            this.contextTree.tree("destroy");
            this.operatorTree.tree("destroy");

            this.expressionPanel.off(".expressionbuilder");

            this.expressionPanel.off("click.expressionbuilder");

            $(document).off(".expressionbuilder");

            this.contentWrapper.empty();
        },

        //dropping a Bracket
        _dropBracket: function (placeholder, text, classname, match)
        {
            //#region
            var bracketDiv = $(this.html.bracket.format(classname, text));
            if (match !== undefined && match !== null)
            {
                bracketDiv.data("match", match);
                match.data("match", bracketDiv);
            }
            placeholder.replaceWith(bracketDiv);
            return bracketDiv;
            //#endregion
        },

        //dropping a function item
        _dropFunction: function (e, ui)
        {
            //#region
            var _this = null;
            if (e)
            {
                _this = e.data;
            }
            if (!_this)
            {
                _this = this;
            }
            var jqtarget = $(e.target);

            var text = (!!ui.draggable.parent().metadata().symbolname) ? ui.draggable.parent().metadata().symbolname : ui.draggable.text();
            var fnname = ui.draggable.parent().metadata().name;
            var icon = ui.draggable.parent().metadata().icon.replace("function ", "");
            var funcData = this.operatorData.selectSingleNode("//Function[Name='" + fnname + "']");
            var hasParams = (funcData.selectSingleNode("Parameters") !== null) ? true : false;

            var functionItem = $(_this.html.fn.format(icon, text));

            if (funcData !== null)
            {
                functionItem.data("funcdata", funcData);
                if (funcData.selectSingleNode("Description") !== null)
                {
                    var tooltip = funcData.selectSingleNode("Description");
                    tooltip = checkExists(tooltip) ? tooltip.text : "";
                    if (checkExists(funcData.getAttribute("ReturnType")))
                    {
                        tooltip += " \n\n" + Resources.ExpressionBuilder.ReturnTypeTooltipLabel + " " + funcData.getAttribute("ReturnType");
                    }
                    if (hasParams)
                    {
                        tooltip += " \n\n" + Resources.ExpressionBuilder.ParametersTooltipLabel;
                        var params = funcData.selectNodes("Parameters/Parameter");
                        for (var i = 0, l = params.length; i < l; i++)
                        {
                            tooltip += "\n" + params[i].selectSingleNode("DisplayName").text + " (" + ((params[i].getAttribute("Type") === "0") ? Resources.ExpressionBuilder.AnyTypeTooltipText : params[i].getAttribute("Type")) + ") ";
                        }
                    }
                    functionItem.attr("title", tooltip);
                }
            }

            var nextLeftBracket, match = null, rightBrackets, matchRightBracket = null;

            jqtarget.before(functionItem);

            if (hasParams)
            {
                nextLeftBracket = this._dropBracket(jqtarget, "(", this.css.leftbracket, match);

                if (nextLeftBracket.data("match") === undefined || nextLeftBracket.data("match") === null)
                {
                    matchRightBracket = $(this.html.bracket.format(this.css.rightbracket, ")"));
                    nextLeftBracket.next("." + this.css.textbox).after(matchRightBracket);
                    matchRightBracket.data("match", nextLeftBracket);
                    nextLeftBracket.data("match", matchRightBracket);
                }

                if (functionItem.next().is("." + this.css.leftbracket))
                {
                    functionItem.addClass(this.css.collapsemargin).next("." + this.css.leftbracket).addClass(this.css.collapsemargin);
                }

                this._addFunctionHotSpots(functionItem, nextLeftBracket, matchRightBracket);
            }
            else
            {
                if (jqtarget.next().is("." + this.css.textbox))
                {
                    jqtarget.next().remove();
                }
                matchRightBracket = $(this.html.bracket.format(this.css.rightbracket, ")")).insertAfter(jqtarget);
                nextLeftBracket = this._dropBracket(jqtarget, "(", this.css.leftbracket, matchRightBracket);
                functionItem.addClass(this.css.collapsemargin).next("." + this.css.leftbracket).addClass(this.css.collapsemargin).next("." + this.css.rightbracket).addClass(this.css.collapsemargin);
            }
            _this._update();
            //#endregion
        },

        //dropping a Left Bracket
        _dropLeftBracket: function (e, ui)
        {
            //#region
            var _this = null;
            if (e)
            {
                _this = e.data;
            }
            if (!_this)
            {
                _this = this;
            }
            var placeholder = $(e.target);

            var match = null;

            this._dropBracket(placeholder, "(", this.css.leftbracket, match);
            _this._update();
            //#endregion
        },

        //dropping an operator item
        _dropOperatorItem: function (e, ui)
        {
            //#region
            var _this = null;
            if (e)
            {
                _this = e.data;
            }
            if (!_this)
            {
                _this = this;
            }
            var text = (!!ui.draggable.parent().metadata().symbolname) ? ui.draggable.parent().metadata().symbolname : ui.draggable.text();
            var fnname = ui.draggable.parent().metadata().name;
            var funcData = this.operatorData.selectSingleNode("//Function[Name='" + fnname + "']");
            var icon = ui.draggable.parent().metadata().icon.replace("operator ", "");

            var jqtarget = $(e.target);

            var operatorDiv = $(this.html.operator.format(icon, text));

            if (funcData !== null)
            {
                operatorDiv.data("funcdata", funcData);
            }

            if (!jqtarget.is("." + this.css.operator))
            {
                if (jqtarget.prev(".{0}, .{1}, .{2}".format(this.css.operator, this.css.textbox, this.css.rightbracket)).length !== 0)
                {
                    _this._addTokenBox(jqtarget, null, "after");
                }
                else
                {
                    _this._addTokenBox(jqtarget, null, "before");
                }
            }
            jqtarget.replaceWith($(operatorDiv));

            _this._update();

            //#endregion
        },

        //dropping a Right Bracket
        _dropRightBracket: function (e, ui)
        {
            //#region
            var _this = null;
            if (e)
            {
                _this = e.data;
            }
            if (!_this)
            {
                _this = this;
            }
            var placeholder = $(e.target);

            // Determining the matching left bracket
            var prvrbs = placeholder.prevUntil("." + this.css.leftbracket + ":not(.function + .left-bracket)").filter("." + this.css.rightbracket);
            var prvlbs = placeholder.prevAll("." + this.css.leftbracket);

            var match = null;
            if (prvlbs.length > 0)
            {
                match = prvlbs.eq(prvrbs.length);
            }

            // Adding the bracket to the canvas
            var rightBracket = this._dropBracket(placeholder, ")", this.css.rightbracket, match);

            // Updating the canvas to reflect the parameters of the matching function
            if (match !== null && match.prev("." + this.css.fn).length > 0)
            {
                this._addFunctionHotSpots(match.prev("." + this.css.fn), match, rightBracket);
            }

            _this._update();
            //#endregion
        },

        _getFunctions: function ()
        {
            if (!checkExists(SourceCode.Forms.Designers.Common) || !checkExists(SourceCode.Forms.Designers.Common.expressionsDefinitionsXml))
            {
                jQuery.popupManager.showError(Resources.ExpressionBuilder.ErrorExpressionFunctions);
                return;
            }

            var expXml = SourceCode.Forms.Designers.Common.expressionsDefinitionsXml;

            this.operatorTree.tree("loadXML", $("nodes", expXml)[0]);
            this.operatorData = $("Functions", expXml)[0];

            var operatorsNode = this.operatorTree.find("li.expressions").filter(
                function ()
                {
                    return $(this).metadata().name === "operators";
                });
            this.operatorTree.tree("add", operatorsNode,
                {
                    icon: "left-bracket",
                    text: Resources.ExpressionBuilder.LeftBracketText,
                    description: Resources.ExpressionBuilder.LeftBracketTooltip,
                    symbolname: "("
                });
            this.operatorTree.tree("add", operatorsNode,
                {
                    icon: "right-bracket",
                    text: Resources.ExpressionBuilder.RightBracketText,
                    description: Resources.ExpressionBuilder.RightBracketTooltip,
                    symbolname: ")"
                });

            // Loading of logical literals
            var logicalNode = this.operatorTree.find("li.expressions").filter(
                function ()
                {
                    return $(this).metadata().name === "logical";
                });
            this.operatorTree.tree("add", logicalNode,
                {
                    icon: "literal false",
                    text: Resources.ExpressionBuilder.FalseLiteralText,
                    description: Resources.ExpressionBuilder.FalseLiteralTooltip,
                    name: "False",
                    data: { icon: "literal false", ItemType: "Literal", DataType: "Boolean", Value: false }
                });
            this.operatorTree.tree("add", logicalNode,
                {
                    icon: "literal true",
                    text: Resources.ExpressionBuilder.TrueLiteralText,
                    description: Resources.ExpressionBuilder.TrueLiteralTooltip,
                    name: "True",
                    data: { icon: "literal true", ItemType: "Literal", DataType: "Boolean", Value: true }
                });

            // Loading of text literals
            var stringNode = this.operatorTree.find("li.expressions").filter(
                function ()
                {
                    return $(this).metadata().name === "text";
                });
            this.operatorTree.tree("add", stringNode,
                {
                    icon: "literal empty-string",
                    text: Resources.ExpressionBuilder.EmptyStringLiteralText,
                    description: Resources.ExpressionBuilder.EmptyStringLiteralTooltip,
                    name: "EmptyString",
                    data: { icon: "literal empty-string", ItemType: "Literal", DataType: "Text", Value: "" }
                });

            this.load(true);

            // Initialise the tabbox
            $("#ContextTab, #OperatorsTab").on("click", function ()
            {
                $(this).addClass("selected").parent().siblings().children(".selected").removeClass("selected");
                $("#" + $(this).attr("id") + "_Content").show().siblings().hide();
            });
        },

        // initialising the expression building controls such as the drag handlers
        _initializeControls: function ()
        {
            var _this = this;
            //#region
            this.partialPageContent.find(".pane-container").panecontainer();

            //Initialize context trees
            //#region
            this.contextTree = this.contextTreeContainer.tree({
                draggable: "a:not(.disabled, .not-droppable, .not-draggable, .view, .item-view, .list-view, .capturelist-view, .content-view, .controls, .fields, .expressions, .smartobject, .folder, .form, .client, .parameters, .systemvalues, .ControlPropertyCategory)"
            });

            //initialize textbox
            $("#EBtxtExpressionHeader").textbox();
            //initialize tokenboxes:
            $("#EBExpressionsPanelContent > .expression-wrapper").find("input[type=text]").tokenbox(this.tokenboxoptions);

            //#region Removing control node from context tree to avoid circular referencing
            if (checkExists(this.options.control))
            {
                var controlID = this.options.control.getAttribute("ID"),
                    currentID = (this.options.currentXML !== undefined) ? this.options.currentXML.documentElement.getAttribute("ID") : null,
                    fieldID = (checkExists(this.options.control.getAttribute("FieldID"))) ? this.options.control.getAttribute("FieldID") : null;

                var setDisabled = function (ids, xml)
                {
                    var criteriaString = "[";
                    for (var i = 0; i < ids.length; i++)
                    {
                        var id = ids[i];
                        if (checkExists(id) && id !== "")
                        {
                            if (criteriaString === "[")
                            {
                                criteriaString += "@id='{0}'".format(id);
                            }
                            else
                            {
                                criteriaString += "or @id='{0}'".format(id);
                            }
                        }
                    }
                    criteriaString += "]";
                    if (criteriaString !== "[]")
                    {
                        var nodes = xml.selectNodes("//node{0}".format(criteriaString));
                        for (var i = 0; i < nodes.length; i++)
                        {
                            var node = nodes[i];
                            if (checkExists(node))
                            {
                                var icon = node.getAttribute("icon");
                                if (!checkExists(icon))
                                {
                                    icon = "";
                                }
                                node.setAttribute("icon", icon + " not-droppable");
                                node.setAttribute("description", Resources.ExpressionBuilder.NodeNotAvailableForUse);
                            }
                        }
                    }
                };
                setDisabled([controlID, currentID, fieldID], this.options.contextXML);
            }

            //#endregion Removing control node from context tree to avoid circular referencing
            this.contextTree.tree("loadXML", this.options.contextXML);

            this.contextTree.on("treeexpand", function (ev, data)
            {
                _this.partialLoadContextTree(data);
            });

            this.operatorTree = this.contextOperatorTreeContainer.tree({
                draggable: "a.operator, a.left-bracket, a.right-bracket, a.function, a.literal"
            });
            var dragstarted = 0;
            $(this.operatorTree).on("dragstart", function (event, ui) { this._addDropAreas(event, ui, dragstarted++); }.bind(this));
            $(this.operatorTree).on("dragstop", function () { this._removeDropAreas(); dragstarted = 0; }.bind(this));

            // Keeps Firefox from implementing a native hyperlink drag
            this.contextTree.on("mousedown.expressionbuilder", "a.disabled, a.not-droppable, a.view, a.item-view, a.list-view, a.capturelist-view, a.content-view, a.controls, a.fields, a.expressions, a.smartobject, a.folder, a.form, a.client, a.parameters, a.systemvalues, .ControlPropertyCategory", function (event)
            {
                if (event.preventDefault)
                {
                    event.preventDefault();
                }
            });

            // Keeps Firefox from implementing a native hyperlink drag
            this.operatorTree.on("mousedown.expressionbuilder", "a.expressions", function (event)
            {
                if (event.preventDefault)
                {
                    event.preventDefault();
                }
            });

            //#endregion

            // Load Function Data (will also populate the operator tree)
            this._getFunctions();

            // Adding some hover effects so corresponding brackets are highlighted
            var self = this;
            this.expressionPanel.on("hover.expressionbuilder", ".{0}, .{1}, .{2}, .{3}".format(this.css.operator, this.css.leftbracket, this.css.rightbracket, this.css.fn), function ()
            {
                $(this).toggleClass("hover");
                if ($(this).is("." + self.css.fn))
                {
                    $(this).next("." + self.css.leftbracket).toggleClass("hover");
                    if ($(this).next("." + self.css.leftbracket).data("match") !== undefined && $(this).next("." + self.css.leftbracket).data("match") !== null)
                    {
                        $(this).next("." + self.css.leftbracket).data("match").toggleClass("hover");
                    }
                }
                else if ($(this).is("." + self.css.leftbracket))
                {
                    $(this).prev("." + self.css.fn).toggleClass("hover");
                    if ($(this).data("match") !== undefined && $(this).data("match") !== null)
                    {
                        $(this).data("match").toggleClass("hover");
                    }
                }
                else
                {
                    if ($(this).data("match") !== undefined && $(this).data("match") !== null)
                    {
                        $(this).data("match").toggleClass("hover").prev("." + self.css.fn).toggleClass("hover");
                    }
                }
            });

            // Adding some blur event handling for the tokenboxes
            this.expressionPanel.on("blur.expressionbuilder", "*[contenteditable=true]", this._update.bind(this));

            // Adding tokendrop event handling to update preview
            this.expressionPanel.on("tokenboxdrop.expressionbuilder", "input[type=text]", this._update.bind(this));

            // Adding focus event handling to indicate current selected expression element
            this.expressionPanel.on("tokenboxfocus.expressionbuilder", "input[type=text]", function ()
            {
                self.expressionPanel.find(".selected").removeClass("selected");
                $(this).closest(".textbox-container").addClass("selected");
            });

            // Adding kepress event handling to remove current selected subexpression tokenbox
            this.expressionPanel.on("tokenboxkeypress.expressionbuilder", "input[type=text]", function (ev)
            {
                if (ev.keyCode === 46)
                {
                    var str = $(ev.originalEvent.currentTarget).text().replace(/\u200B/g, "");
                    if (str === "")
                    {
                        self.deleteItem();
                    }
                }
            });

            // Keyhandling (mostly delete)
            $(document).on("keydown.expressionbuilder", function (ev)
            {
                if (!$(ev.target).is("input, select, textarea, *[contenteditable=true]") && [8, 46].indexOf(ev.keyCode) !== -1)
                {
                    this.deleteItem();
                }
            }.bind(this));

            // Click event handling to select items on the canvas
            this.expressionPanel.on("click.expressionbuilder", ".{0}, .{1}, .{2}, .{3}".format(this.css.operator, this.css.bracket, this.css.fn, this.css.textbox), this.selectItem.bind(this));
            this.expressionPanel.on("click.expressionbuilder", function (ev)
            {
                if (!$(ev.target).is(".{0}, .{1}, .{2}, .{3}, .{4}".format(self.css.operator, self.css.bracket, self.css.fn, self.css.textbox, self.css.extra))
                    && $(ev.target).parents(".{0}, .{1}, .{2}, .{3}, .{4}".format(self.css.operator, self.css.bracket, self.css.fn, self.css.textbox, self.css.extra)).length === 0)
                {
                    self.deselectItem();
                }
            });
            //#endregion
        },

        partialLoadContextTree: function (data)
        {
            var node = data.node;
            var tree = data.tree;
            var metadata = node.metadata();

            var existingContent = null;

            if (checkExists(metadata.dynamic) && node.hasClass("children") && !node.hasClass("dynamicloaded"))
            {
                existingContent = node.children("ul").children();
                var thisItemType = metadata.ItemType;

                if (thisItemType === "Control")
                {
                    var thisItemID = metadata.Guid;
                    var thisItemSubType = metadata.SubType;
                    var instanceID = metadata.InstanceID;
                    var subformID = metadata.SubFormID;

                    if (instanceID === "" || !checkExists(subformID))
                    {
                        instanceID = "00000000-0000-0000-0000-000000000000";
                    }

                    if (subformID === "" || !checkExists(subformID))
                    {
                        subformID = "00000000-0000-0000-0000-000000000000";
                    }

                    var xmlResponse = SourceCode.Forms.Designers.Common._getTransformedControlTypePropertyXml({
                        id: thisItemID,
                        subType: thisItemSubType,
                        node: data.node,
                        subformId: subformID,
                        instanceId: instanceID,
                        metadata: metadata,
                        viewContextSettings: { // expressions. Never include control  fields. They are only for use with for each
                            includeControlFields: "False"
                        }
                    });

                    metadata.open = true;
                    tree.tree("loadXML", xmlResponse, node, false, metadata);

                    if (existingContent.length > 0)
                    {
                        //move the existing children to the end
                        var listItems = node.children("ul").children();
                        var lastItem = $(listItems[listItems.length - 1]);

                        existingContent.insertAfter(lastItem);
                        //metadata.childItems = metadata.childItems.concat(childItems);
                    }
                    tree.tree("applyDragHandlers", node);
                    node.addClass("dynamicloaded");
                }
            }
        },

        getDraggingNode: function ()
        {
            //#region
            var node = this.contextTree.tree("find", "metadata", "", arguments[0]);
            if ($chk(node))
            {
                var draggingNode = this.setDraggingNode(node);
                return draggingNode;
            }
            else
            {
                return null;
            }
            //#endregion
        },

        //needs to be synced with ConfigurationWidget.js
        //This function checks if a parent is only partially loaded then searches for the child or just returns the dragging node
        //parentMetadata is what is used to search for the parent and child for the child once the parent has been fully loaded
        getPartialDraggingNode: function (parentMetadata, childMetadata)
        {
            //#region
            var node = this.contextTree.tree("find", "metadata", "", parentMetadata);

            //if the parent is only partially loaded then load its children first
            if (checkExists(node) && node.metadata().dynamic && !node.hasClass("dynamicloaded"))
            {
                this.partialLoadContextTree({ node: node, tree: this.contextTree });
            }

            return this.getDraggingNode(childMetadata);
            //#endregion
        },

        setDraggingNode: function (listItem)
        {
            if (!listItem.metadata()["ItemType"])
            {
                return false;
            }

            //#region
            var node = listItem.children("a");
            var draggingNode = {};

            draggingNode.text = node.text();
            draggingNode.hasChildren = listItem.is(".children");
            draggingNode.icon = listItem.metadata().icon;
            draggingNode.id = listItem.metadata().id;
            draggingNode.name = listItem.metadata().name;
            draggingNode.open = listItem.is(".open");
            draggingNode.data = {};

            jQuery.each(listItem.metadata(), function (name, value)
            {
                draggingNode.data[name] = value;
            });

            //get display text
            var parentNode = listItem;
            var displayText = "";
            while (parentNode.is(":not(.root)"))
            {
                //if this is not the root node or there is only one root node write the text
                if (!(parentNode.parent("ul").parent("li").is(".root") && parentNode.parent("ul").parent("li").children("ul").children("li").length === 1))
                {
                    if (displayText === "")
                    {
                        displayText = parentNode.children("a").text();
                    }
                    else
                    {
                        displayText = parentNode.children("a").text() + " - " + displayText;
                    }
                }
                parentNode = parentNode.parent("ul").parent("li");
            }
            if (displayText === "")
            {
                displayText = node.text();
            }

            draggingNode.tooltip = displayText;
            draggingNode.display = node.text();
            draggingNode.value = (listItem.metadata().id) ? (listItem.metadata().id) : listItem.metadata().name;

            return draggingNode;
            //#endregion

        },

        _loadBracket: function (node, container)
        {
            var left = $(this.html.bracket.format(this.css.leftbracket, "("));
            var right = $(this.html.bracket.format(this.css.rightbracket, ")"));

            if (container.is(".replace-wrapper"))
            {
                container.replaceWith(left);
            }
            else
            {
                container.append(left);
            }

            right.insertAfter(left);

            right.data("match", left);
            left.data("match", right);

            var content = $("<div class=\"replace-wrapper\"></div>");
            content.insertAfter(left);
            this._loadNode(node.firstChild, content);
        },

        _loadFunction: function (func, container)
        {
            var funcdata = this.operatorData.selectSingleNode("//Function[Name='" + func.tagName + "']");
            var functionIcon = funcdata.selectSingleNode("Icon").firstChild.nodeValue;
            var functionSymbol = (funcdata !== null && funcdata.selectSingleNode("ShortName") !== null) ? funcdata.selectSingleNode("ShortName").firstChild.nodeValue : funcdata.selectSingleNode("DisplayName").firstChild.nodeValue;
            var functionParams = (funcdata.selectSingleNode("Parameters") !== null) ? funcdata.selectNodes("Parameters/Parameter").length : 0;
            var functionVariadic = (checkExists(funcdata.getAttribute("IsVariadic")) && funcdata.getAttribute("IsVariadic").toLowerCase() === "true") ? true : false;

            var functionDiv = $(this.html.fn.format(functionIcon, functionSymbol));

            if (funcdata.selectSingleNode("Description") !== null)
            {
                var tooltip = funcdata.selectSingleNode("Description");
                tooltip = checkExists(tooltip) ? tooltip.text : "";
                if (checkExists(funcdata.getAttribute("ReturnType")))
                {
                    tooltip += " \n\n" + Resources.ExpressionBuilder.ReturnTypeTooltipLabel + " " + funcdata.getAttribute("ReturnType");
                }
                if (funcdata.selectSingleNode("Parameters") !== null)
                {
                    tooltip += " \n\n" + Resources.ExpressionBuilder.ParametersTooltipLabel;
                    var params = funcdata.selectNodes("Parameters/Parameter");
                    for (var i = 0, l = params.length; i < l; i++)
                    {
                        tooltip += "\n" + params[i].selectSingleNode("DisplayName").text + " (" + params[i].getAttribute("Type") + ") ";
                    }
                }
                functionDiv.attr("title", tooltip);
            }

            if (container.is(".replace-wrapper"))
            {
                container.replaceWith(functionDiv);
            }
            else
            {
                container.append(functionDiv);
            }

            functionDiv.data("funcdata", funcdata);

            var leftBracketDiv = $(this.html.bracket.format(this.css.leftbracket, "("));
            leftBracketDiv.insertAfter(functionDiv);

            if (functionDiv.next().is("." + this.css.leftbracket))
            {
                functionDiv.addClass(this.css.collapsemargin).next("." + this.css.leftbracket).addClass(this.css.collapsemargin);
            }

            var pos = leftBracketDiv;

            if (functionParams !== func.childNodes.length)
            {
                var differnce = functionParams - func.childNodes.length;

                for (var i = 0, l = differnce; i < l; i++)
                {
                    $(func).append("<Item SourceType=\"Value\" DataType=\"Text\"><SourceValue xml:space=\"preserve\" xmlns:xml=\"http://www.w3.org/XML/1998/namespace\"></SourceValue></Item>");
                }
            }

            for (var i = 0, l = func.childNodes.length; i < l; i++)
            {
                var commaDiv = $(this.html.comma);

                if (i !== 0)
                {
                    commaDiv.insertAfter(pos);
                    pos = commaDiv;
                }

                var subexpDiv = $(this.html.wrapper);
                subexpDiv.insertAfter(pos);
                pos = subexpDiv;

                this._loadNode(func.childNodes[i], subexpDiv);
            }

            if (functionVariadic)
            {
                var extra = $(this.html.extra);
                extra.insertAfter(pos);
                extra.droppable(this.extradropoptions);
                extra.droppable("option", "drop", this._addExtraDrop.bind(this));
                extra.on("click", function (ev)
                {
                    this._addExtraArgument($(ev.target));
                    this._update();
                }.bind(this));
                pos = extra;
            }

            var rightBracketDiv = $(this.html.bracket.format(this.css.rightbracket, ")"));
            rightBracketDiv.insertAfter(pos);
            rightBracketDiv.data("match", leftBracketDiv);
            leftBracketDiv.data("match", rightBracketDiv);
        },

        _loadNode: function (node, container)
        {
            if (node.tagName === "Item")
            {
                this._loadValue(node, container);
            }
            else if (node.tagName === "Bracket")
            {
                this._loadBracket(node, container);
            }
            else
            {
                var funcdata = this.operatorData.selectSingleNode("//Function[Name='" + node.tagName + "']");

                if (checkExists(funcdata.getAttribute("IsOperator")) && funcdata.getAttribute("IsOperator").toLowerCase() === "true")
                {
                    this._loadOperator(node, container);
                }
                else
                {
                    this._loadFunction(node, container);
                }
            }
        },

        _loadOperator: function (operator, container)
        {
            var funcdata = this.operatorData.selectSingleNode("//Function[Name='" + operator.tagName + "']");
            var operatorIcon = funcdata.selectSingleNode("Icon").firstChild.nodeValue;
            var operatorSymbol = (funcdata !== null && funcdata.selectSingleNode("ShortName") !== null) ? funcdata.selectSingleNode("ShortName").firstChild.nodeValue : funcdata.selectSingleNode("DisplayName").firstChild.nodeValue;

            var operatorDiv = $(this.html.operator.format(operatorIcon, operatorSymbol));

            if (container.is(".replace-wrapper"))
            {
                container.replaceWith(operatorDiv);
            }
            else
            {
                container.append(operatorDiv);
            }

            operatorDiv.data("funcdata", funcdata);

            var leftOperand = $("<div class=\"replace-wrapper\"></div>").insertBefore(operatorDiv);
            var rightOperand = $("<div class=\"replace-wrapper\"></div>").insertAfter(operatorDiv);

            this._loadNode(operator.firstChild, leftOperand);
            this._loadNode(operator.lastChild, rightOperand);
        },

        _loadValue: function (val, container)
        {
            //TODO: TD 0001
            var metaArray = { watermark: Resources.ExpressionBuilder.TokenboxWatermarkText };

            var input = $(this.html.textbox.format("<input type=\"text\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode() + "\" />"));

            if (container.is(".replace-wrapper"))
            {
                container.replaceWith(input);
            }
            else
            {
                container.append(input);
            }

            input.find("input[type=text]").tokenbox(this.tokenboxoptions);

            var tokenboxvalue = [];

            if (val.selectNodes("SourceValue/Item").length > 0)
            {
                var items = val.selectNodes("SourceValue/Item");

                for (var i = 0, l = items.length; i < l; i++)
                {
                    tokenboxvalue.push(this._valueItemToObject(items[i]));
                }
            }
            else
            {
                tokenboxvalue.push(this._valueItemToObject(val));
            }

            input.find("input[type=text]").tokenbox("value", tokenboxvalue);
        },

        _mapDataType: function (type)
        {
            switch (type.toLowerCase())
            {
                case "guid":
                case "hyperlink":
                case "memo":
                case "multivalue":
                    return "Text";
                case "decimal":
                    return "Number";
                case "yesno":
                    return "Boolean";
                default:
                    return type;
            }
        },

        // the partial page for the widget has loaded
        _partialPageLoaded: function ()
        {
            //#region
            this.partialPageContent = this.contentWrapper.find(".wrapper.partial-page-container");
            this.expressionPanel = this.contentWrapper.find("#EBExpressionsPanel");
            this.contextPanel = this.contentWrapper.find("#EBContextPanel");
            this.contextTreeContainer = this.contextPanel.find("#EBContextPanelTree");
            this.contextOperatorTreeContainer = this.contextPanel.find("#EBOperatorsPanelTree");
            this.symbolsTreeContainer = this.contextPanel.find("#SymbolsTree");
            this.previewPanel = this.contentWrapper.find("#EBExpressionPreviewPanel");

            this._show();
            this._initializeControls();
            //#endregion
        },

        _removeDropAreas: function ()
        {
            //#region

            window.setTimeout(function ()
            {
                var droppableOperators = this.expressionPanel.find("." + this.css.container);

                if (droppableOperators.length > 0)
                {
                    droppableOperators.droppable("destroy");
                    droppableOperators.remove();
                }

                this.expressionPanel.find(".existing-operator").removeClass("existing-operator");
            }.bind(this), 0);
            //#endregion
        },

        // Converts an Item XML node into a value object for the tokenbox
        _valueItemToObject: function (itemNode)
        {
            var valueobj = {}, findResult;
            var sourceType = itemNode.getAttribute("SourceType").toLowerCase();

            if (sourceType === "value")
            {
                valueobj.type = "value";
                valueobj.text = valueobj.data = itemNode.selectSingleNode("SourceValue").text;

                if (["false", "true"].indexOf(valueobj.data.toLowerCase()) !== -1)
                {
                    findResult = this.operatorTree.find("a.literal." + valueobj.data.toLowerCase()).parent();
                    valueobj.type = "context";
                    valueobj.text = findResult.children("a").text();
                    valueobj.data = $.extend({}, findResult.metadata());
                }
                else if (valueobj.text === "" && itemNode.getAttribute("DataType").toLowerCase() === "text")
                {
                    // Empty String Literal is assumed
                    findResult = this.operatorTree.find("a.literal.empty-string").parent();
                    valueobj.type = "context";
                    valueobj.text = findResult.children("a").text();
                    valueobj.data = $.extend({}, findResult.metadata());
                }
            }
            else
            {
                findResult = this.contextTree.tree("find", "metadata", "", "id", itemNode.getAttribute("SourceID"));

                var SourceInstanceID = itemNode.getAttribute("SourceInstanceID");

                if (checkExists(SourceInstanceID))
                {
                    findResult = findResult.filter(function ()
                    {
                        return $(this).metadata().InstanceID === SourceInstanceID;
                    });
                }
                else if (sourceType === "formparameter")
                {
                    findResult = findResult.filter(function ()
                    {
                        return $(this).metadata().ItemType.toLowerCase() === "formparameter";
                    });
                }

                valueobj.type = "context";

                if (findResult.length > 0)
                {
                    valueobj.text = findResult.children("a").text();
                    valueobj.data = $.extend({}, findResult.metadata());
                }
                else
                {
                    var failed = false;

                    // Check if its a partialNode
                    var sourcePath = itemNode.getAttribute("SourcePath");
                    var instanceID = itemNode.getAttribute("SourceInstanceID") === "00000000-0000-0000-0000-000000000000" ? null : itemNode.getAttribute("SourceInstanceID");
                    var sourceID = itemNode.getAttribute("SourceID");
                    var subformID = itemNode.getAttribute("SourceSubFormID");

                    var parentMetadata = { id: sourcePath, SubFormID: subformID, InstanceID: instanceID };
                    var childMetadata = { SourceID: sourceID, SourcePath: sourcePath, SubFormID: subformID, InstanceID: instanceID };
                    var draggingNode = this.getPartialDraggingNode(parentMetadata, childMetadata);

                    if (checkExists(draggingNode) && draggingNode !== "")
                    {
                        valueobj.text = draggingNode.text;
                        valueobj.data = draggingNode.data;
                    }
                    else
                    {
                        failed = true;
                    }

                    if (failed)
                    {
                        valueobj.text = (itemNode.selectSingleNode("Display") !== null) ? itemNode.selectSingleNode("Display").text : "";
                        valueobj.data = { icon: itemNode.getAttribute("DataType").toLowerCase() + " error" };

                        if (valueobj.text === "")
                        {
                            var displayName = SourceCode.Forms.Designers.Common.getItemDisplayName(itemNode);

                            if (checkExistsNotEmpty(displayName))
                            {
                                valueobj.text = displayName;
                            }
                        }
                    }
                }

                // Validation Status Handling
                if (SourceCode.Forms.DependencyHelper.hasValidationStatusError(itemNode))
                {
                    var validationStatus = itemNode.getAttribute("ValidationStatus");

                    valueobj.data.ValidationStatus = validationStatus;
                    valueobj.status = SourceCode.Forms.DependencyHelper.getMainValidationStatus(validationStatus);

                    var validationMessages = itemNode.getAttribute("ValidationMessages");
                    var itemType = itemNode.getAttribute("SourceType");

                    if (this.resourceService !== null && validationMessages !== null && validationMessages !== "")
                    {
                        valueobj.data.ValidationMessages = validationMessages;
                        valueobj.tooltip = this.resourceService.getValidationMessages(validationMessages).join("\n");

                        var msgObj = this.resourceService.parseValidationMessage(validationMessages)[0];

                        valueobj.data.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(itemType, msgObj.subType) + " error";
                    }
                    else
                    {
                        valueobj.data.icon = SourceCode.Forms.Designers.Common.getItemTypeIcon(itemType, "") + " error";
                    }
                }
            }

            return valueobj;
        },

        // Displays the dialog for the Expression Builder
        _show: function ()
        {
            var $expressionBuilder = this;
            var width = Math.floor($(window).width() * 0.8);
            var height = Math.floor($(window).height() * 0.8);

            var expressionPanelDialogPopup = $.popupManager.showPopup({
                headerText: ($expressionBuilder.options.currentXML !== undefined) ? Resources.ExpressionBuilder.EditExpressionBuilderDialogHeader : Resources.ExpressionBuilder.AddExpressionBuilderDialogHeader,
                modalize: true,
                content: $expressionBuilder.partialPageContent,
                width: width,
                height: (height >= 350) ? height : 350,
                maximizable: true,
                maximized: false,
                buttons: [
                    {
                        type: "help",
                        click: function ()
                        {
                            if ($expressionBuilder.options.currentXML !== undefined)
                            {
                                HelpHelper.runHelp(7076);
                            }
                            else
                            {
                                HelpHelper.runHelp(7075);
                            }
                        }
                    },
                    {
                        text: Resources.WizardButtons.OKButtonText,
                        click: function (event, ui)
                        {
                            this.save();
                            return false;
                        }.bind(this)
                    },
                    {
                        text: Resources.WizardButtons.CancelButtonText,
                        click: function (event, ui)
                        {
                            popupManager.closeLast({ cancelOnClose: true });
                            var el = $expressionBuilder.element;

                            window.setTimeout(function ()
                            {
                                $(this).ExpressionBuilder("destroy");
                                $(this).remove();
                            }.bind(el), 0);
                            return false;
                        }
                    }
                ],
                onClose: function ()
                {
                    popupManager.closeLast({ cancelOnClose: true });
                    var el = $expressionBuilder.element;

                    window.setTimeout(function ()
                    {
                        $(this).ExpressionBuilder("destroy");
                        $(this).remove();
                    }.bind(el), 0);
                    return false;
                }
            });

        },

        _update: function ()
        {
            var text = this._buildExpressionPreviewText(this.expressionPanel.find(".expression-wrapper").children());
            this._updatePreviewText(text);
        },

        _updatePreviewText: function (text)
        {
            //#region
            this.previewText = text;
            this.previewPanel.find(".scroll-wrapper").empty().append($("<span class=\"preview-content\"></span>").text(this.previewText));
            //#endregion
        },

        clearAll: function ()
        {
            //TODO: TD 0001
            var metaArray = { watermark: Resources.ExpressionBuilder.TokenboxWatermarkText };

            $("#EBExpressionsPanelContent > .expression-wrapper").find("input[type=text]").tokenbox("destroy");
            $("#EBExpressionsPanelContent > .expression-wrapper").empty().html($(this.html.textbox.format("<input type=\"text\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode() + "\" />")));
            $("#EBExpressionsPanelContent > .expression-wrapper").find("input[type=text]").tokenbox(this.tokenboxoptions);
            this._update();
        },

        deleteBracket: function (item)
        {

            if (item.prev().is(":not(." + this.css.fn + ")"))
            {
                var stack = [item[0]];
                if (item.data("match") !== undefined)
                {
                    stack.push(item.data("match"));
                }

                $(stack).remove();
            }
            else
            {
                this.deleteFunction(item.prev());
            }

        },

        deleteFunction: function (item)
        {
            var stack = [item[0]], container = item.parent();

            if (item.next(".left-bracket").length > 0)
            {
                stack.push(item.next("." + this.css.leftbracket)[0]);

                if (item.next("." + this.css.leftbracket).data("match") !== undefined)
                {
                    stack.push(item.next("." + this.css.leftbracket).data("match")[0]);

                    var contents = item.next("." + this.css.leftbracket).nextUntil(item.next("." + this.css.leftbracket).data("match"));

                    for (var i = 0, l = contents.length; i < l; i++)
                    {
                        stack.push(contents[i]);
                    }
                }
            }

            var target = $("<span></span>").insertBefore(item);

            $(stack).remove();

            this._addTokenBox(target, null, "replace");
        },

        deleteItem: function (item)
        {
            if (!item || (typeof item.type !== "undefined" && typeof item.currentTarget !== "undefined")) {
                // No arguments or Event object passed
                item = this.expressionPanel.find(".selected");
            }
            if (item.length > 0)
            {
                if (item.is("." + this.css.fn))
                {
                    this.deleteFunction(item);
                }
                else if (item.is("." + this.css.operator))
                {
                    this.deleteOperator(item);
                }
                else if (item.is("." + this.css.bracket))
                {
                    this.deleteBracket(item);
                }
                else if (item.is("." + this.css.textbox))
                {
                    this.deleteValue(item);
                }

                this._update();
            }
        },

        deleteOperator: function (item)
        {

            var stack = [item[0]];

            // Removing the right operand
            if (item.next().is("." + this.css.textbox))
            {
                stack.push(item.next()[0]);
            }
            else if (item.next().is("." + this.css.leftbracket))
            {
                stack.push(item.next()[0]);

                if (item.next().data("match") !== undefined) {
                    stack.push(item.next().data("match")[0]);

                    var contents = item.next().nextUntil(item.next().data("match"));

                    for (var i = 0, l = contents.length; i < l; i++) {
                        stack.push(contents[i]);
                    }
                }
            }
            else if (item.next().is("." + this.css.fn))
            {
                var func = item.next();

                stack.push(func[0]);

                if (func.next(".left-bracket").length > 0)
                {
                    stack.push(func.next("." + this.css.leftbracket)[0]);

                    if (func.next("." + this.css.leftbracket).data("match") !== undefined)
                    {
                        stack.push(func.next("." + this.css.leftbracket).data("match")[0]);

                        var contents = func.next("." + this.css.leftbracket).nextUntil(func.next("." + this.css.leftbracket).data("match"));

                        for (var i = 0, l = contents.length; i < l; i++)
                        {
                            stack.push(contents[i]);
                        }
                    }
                }
            }

            // Removing the left operand
            /*
            if (item.prev().is("." + this.css.textbox))
            {
            if (item.prev().prev().length === 0 || item.prev().prev().is(":not(." + this.css.operator + ")")) stack.push(item.prev()[0]);
            }
            else if (item.prev().is("." + this.css.rightbracket))
            {
            if (item.prev().data("match") !== undefined)
            {
            stack.push(item.prev().data("match")[0]);

            var contents = item.prev().data("match").nextUntil(item.prev());

            for (var i = 0, l = contents.length; i < l; i++) stack.push(contents[i]);

            stack.push(item.prev()[0]);
            }

            if (item.prev().data("match").prev().is("." + this.css.fn)) stack.push(item.prev().data("match").prev()[0]);
            }
            */

            $(stack).remove();

        },

        deleteValue: function (item)
        {
            if (item.find("input[type=text]").tokenbox("value").length > 0)
            {
                this._addTokenBox(item, null, "replace");
            }
            else
            {
                if (item.parent().is("." + this.css.wrapper) && item.is(":only-child"))
                {
                    var sub = item.parent();

                    var func = sub.prevAll("." + this.css.fn).eq(0);
                    var funcdata = func.data("funcdata");

                    if (funcdata.getAttribute("IsVariadic") === "True")
                    {
                        var paramcnt = funcdata.selectNodes("Parameters/Parameter").length, vidx = paramcnt - 1;
                        var subs = func.next().nextUntil("." + this.css.rightbracket, "." + this.css.wrapper);
                        var subidx = subs.index(sub[0]);
                        var stack = [];

                        if (subidx >= vidx)
                        {
                            if (subidx > vidx)
                            {
                                stack.push(sub[0]);
                                stack.push(sub.prev("." + this.css.comma)[0]);
                            }
                            else if (subidx === vidx)
                            {
                                if (sub.next("." + this.css.comma).length > 0)
                                {
                                    stack.push(sub[0]);
                                    stack.push(sub.next("." + this.css.comma)[0]);
                                }
                            }
                        }

                        $(stack).remove();
                    }
                }
            }
        },

        deselectItem: function ()
        {
            this.expressionPanel.find(".selected").removeClass("selected");
        },

        html:
        {
            comma: "<div class=\"icon icon-size16 {0}\">,</div>".format(css.comma),
            wrapper: "<span class=\"icon {0}\"></span>".format(css.wrapper),
            extra: "<div class=\"icon {0}\">,  ...</div>".format(css.extra),
            container: "<div class=\"icon {0}\"></div>".format(css.container),
            operator: "<div class=\"icon icon-size16 {0} {1}\">{2}</div>".format(css.operator, "{0}", "{1}"),
            fn: "<div class=\"icon {0} {1}\">{2}</div>".format(css.fn, "{0}", "{1}"),
            textbox: "<div class=\"icon {0}\">{1}</div>".format(css.textbox, "{0}"),
            bracket: "<div class=\"icon icon-size16 {0} {1}\">{2}</div>".format(css.bracket, "{0}", "{1}")
        },

        //load the expression values that was previously saved
        load: function (loaded)
        {
            if (this.options.currentXML && loaded === true) //edit the expression value
            {
                // Format Expression XML to expose execution
                if (this.transformer === null)
                {
                    this.transformer = new XslTransform();
                    this.transformer.importStylesheet(applicationRoot + "Expressions/LoadFormatter.xslt");
                }

                var transformed = tryParseXML(this.transformer.transformToText(this.options.currentXML));
                if (checkExists(transformed) && checkExists(transformed.documentElement) && transformed.documentElement.xml.length > 0)
                {
                    this.options.currentXML = transformed;
                }

                //traverse nodes and create UI correspondingly
                var nameNode = this.options.currentXML.selectSingleNode("Expression/Name");
                $("#EBtxtExpressionHeader").textbox("setValue", nameNode.text);
                $("#EBtxtExpressionHeader").trigger("focus");
                $("#EBExpressionID").val(this.options.currentXML.selectSingleNode("Expression").getAttribute("ID"));

                var expressionnode = null;

                if (!SourceCode.Forms.Browser.msie)
                {
                    expressionnode = this.options.currentXML.selectSingleNode(
                        "Expression/*[local-name()!='Name'][local-name()!='Display'][local-name()!='DisplayValue']");
                }
                else
                {
                    $.each(this.options.currentXML.selectNodes("Expression/*"), function ()
                    {
                        if (this.tagName !== "Name" && this.tagName !== "Display" && this.tagName !== "DisplayValue")
                        {
                            expressionnode = this;
                        }
                    });
                }

                this.expressionPanel.find(".expression-wrapper").empty();

                this._loadNode(expressionnode, this.expressionPanel.find(".expression-wrapper"));

                this._update();
            }
            else
            {
                if ($("#InitialTextbox").length > 0)
                {
                    $("#InitialTextbox").tokenbox(this.tokenboxoptions);
                }
                this._update();
            }

            // Initialise Toolbar Buttons
            $("#DeleteExpressionTerm").on("click", this.deleteItem.bind(this));
            $("#ClearAllExpressionTerms").on("click", this.clearAll.bind(this));
            $("#ExpressionValidateButton").on("click", function ()
            {
                if (this.validate())
                {
                    $.popupManager.showNotification(Resources.ExpressionBuilder.ValidationPassed);
                }
            }.bind(this));
            // End of toolbar initialisation

            $("#EBtxtExpressionHeader").trigger("focus");
        },

        save: function ()
        {
            if ($("#EBtxtExpressionHeader").val() === "")
            {
                $.popupManager.showWarning({ message: Resources.ExpressionBuilder.ValidationNameRequired, onClose: function () { $("#EBtxtExpressionHeader")[0].focus(); } });
                return false;
            }
            else
            {
                var expressions = this.contextTree.find("li.root > ul > li").eq(1).find("> ul > li.expressions li.expression").filter(function ()
                {
                    var jqThis = $(this);
                    return !jqThis.is(".disabled") && jqThis.children("a").text().toLowerCase() === $("#EBtxtExpressionHeader").val().toLowerCase();
                });

                if (expressions.length > 0 && expressions.eq(0).metadata().id.toLowerCase() !== $("#EBExpressionID").val().toLowerCase())
                {
                    $.popupManager.showWarning({ message: Resources.ExpressionBuilder.ValidationNameExists, onClose: function () { $("#EBtxtExpressionHeader")[0].focus(); } });
                    return false;
                }
            }

            if (this.validate())
            {
                var doc = $.parseXML("<Expression ID=\"" + ($("#EBExpressionID").val() !== "" ? $("#EBExpressionID").val() : String.generateGuid()) + "\" />");

                var nodes = this.expressionPanel.find(".expression-wrapper").children();

                var entry = doc.documentElement;

                var name = doc.documentElement.appendChild(doc.createElement("Name"));
                name.appendChild(doc.createTextNode($("#EBtxtExpressionHeader").val()));

                this._buildExpressionForNodes(nodes, doc, entry);

                var text = this._buildExpressionPreviewText(nodes);
                var display = doc.documentElement.appendChild(doc.createElement("Display"));
                display.appendChild(doc.createTextNode(text));

                var result = {
                    id: doc.documentElement.getAttribute("ID"),
                    name: doc.documentElement.selectSingleNode("Name").firstChild.nodeValue,
                    preview: doc.documentElement.selectSingleNode("Name").text,
                    xml: doc.documentElement.xml
                };

                if (typeof this.options.save === "function")
                {
                    this.options.save(result);
                }

                popupManager.closeLast({ cancelOnClose: true });

                var el = this.element;
                window.setTimeout(function ()
                {
                    $(this).ExpressionBuilder("destroy");
                    $(this).remove();
                }.bind(el), 0);

            }

        },

        selectItem: function (e, ui)
        {
            this.expressionPanel.find(".selected").removeClass("selected");
            $(e.currentTarget).addClass("selected");
        },

        validate: function ()
        {
            // Check to see if all brackets are properly closed
            var lbs = this.expressionPanel.find(".expression-wrapper").find("." + this.css.leftbracket);
            var rbs = this.expressionPanel.find(".expression-wrapper").find("." + this.css.rightbracket);

            if (lbs.length !== rbs.length)
            {
                $.popupManager.showWarning(Resources.ExpressionBuilder.ValidationUnclosedBracketsFound);
                return false;
            }

            // Check to see if all tokenboxes has valid values (resolved items)

            var tokenboxes = this.expressionPanel.find(".expression-wrapper").find("input[type=text]");

            for (var i = 0, l = tokenboxes.length; i < l; i++)
            {
                var value = tokenboxes.eq(i).tokenbox("value");
                if (value.length === 0)
                {
                    $.popupManager.showWarning(Resources.ExpressionBuilder.ValidationTokenboxEmpty);
                    return false;
                }
                else
                {
                    for (var j = 0, k = value.length; j < k; j++)
                    {
                        // Only validate context values by status
                        if (value[j].type !== "value")
                        {
                            if (value[j].data.icon === "error" || ["error", "missing"].indexOf(value[j].status.toLowerCase()) > -1)
                            {
                                $.popupManager.showWarning(Resources.ExpressionBuilder.ValidationTokenboxUnresolvedEntity);
                                return false;
                            }
                            if (value[j].status.toLowerCase() === "warning")
                            {
                                $.popupManager.showWarning(Resources.ExpressionBuilder.ValidationTokenboxWarningEntity);
                                return false;
                            }
                        }
                    }
                }
            }

            return true;
        }
        //#endregion
    };

    if (typeof SCExpressionBuilder === "undefined") SCExpressionBuilder = SourceCode.Forms.Widget.ExpressionBuilder;
    $.widget("ui.ExpressionBuilder", SCExpressionBuilder);

    $.extend($.ui.ExpressionBuilder.prototype,
        {
            //#region
            options:
            {

            }
            //#endregion
        });

    SourceCode.Forms.ExpressionPreviewHelper =
    {
        //#region

        getExpressionPreviewText: function (expressionNode)
        {
            var xmlHelper = SourceCode.Forms.ExpressionXmlHelper;
            var result = "";

            if (!checkExists(expressionNode))
            {
                return result;
            }

            if (expressionNode.nodeName === "Expression")
            {
                //get first root function / operator / value
                expressionNode = expressionNode.selectNodes("*[not(self::Name) and not(self::Display) and not(self::DisplayValue)]")[0];
                if (!checkExists(expressionNode))
                {
                    return result;
                }
            }

            var expressionType = xmlHelper.getExpressionNodeType(expressionNode);

            if (expressionType === xmlHelper.expressionNodeType.FUNCTION)
            {
                result += this._generatePreviewForFunction(expressionNode);
                return result;
            }

            if (expressionType === xmlHelper.expressionNodeType.OPERATOR)
            {
                result += this._generatePreviewForOperator(expressionNode);
                return result;
            }

            if (expressionType === xmlHelper.expressionNodeType.PROPERTY)
            {
                result += this._generatePreviewForProperty(expressionNode);
                return result;
            }

            if (expressionType === xmlHelper.expressionNodeType.VALUE)
            {
                result += this._generatePreviewForValue(expressionNode);
                return result;
            }

            if (expressionType === xmlHelper.expressionNodeType.BRACKET)
            {
                result += this._generatePreviewForBracket(expressionNode);
                return result;
            }

            return result;
        },

        generateDisplayPreviewForExpressions: function (expressionNode)
        {
            var previewText = this.getExpressionPreviewText(expressionNode);

            var oldExpressionDisplayNode = expressionNode.selectSingleNode("DisplayValue");
            if (!checkExists(oldExpressionDisplayNode))
            {
                oldExpressionDisplayNode = expressionNode.selectSingleNode("Display");
            }

            if (previewText !== "")
            {
                if (checkExists(oldExpressionDisplayNode))
                {
                    var newDisplayNode = expressionNode.ownerDocument.createElement(oldExpressionDisplayNode.nodeName);
                    var newExpressionDisplayNode = expressionNode.ownerDocument.createTextNode(previewText);

                    oldExpressionDisplayNode.parentNode.removeChild(oldExpressionDisplayNode);

                    newDisplayNode.appendChild(newExpressionDisplayNode);
                    expressionNode.appendChild(newDisplayNode);
                }
            }
            else
            {
                if (checkExists(oldExpressionDisplayNode))
                {
                    expressionNode.removeChild(oldExpressionDisplayNode);
                }
            }
        },

        _generatePreviewForFunction: function (expressionNode)
        {
            var xmlHelper = SourceCode.Forms.ExpressionXmlHelper;
            var result = "";

            if (!checkExists(expressionNode))
            {
                return result;
            }

            var nodeName = expressionNode.nodeName;

            if (!checkExists(SourceCode.Forms.Designers.Common.expressionsDefinitionsXml))
            {
                result = nodeName;
                return result;
            }

            var functionNode = xmlHelper.getFunctionNodeByFunctionName(nodeName);
            if (!checkExists(functionNode))
            {
                result = nodeName;
                return result;
            }

            var requiredParameterCount = xmlHelper.getRequiredFunctionParameters(functionNode).length;
            var actualParameterCount = expressionNode.selectNodes("./*").length;

            var symbol = "";
            var dispNameNode = functionNode.selectSingleNode("DisplayName");
            if (checkExists(dispNameNode))
            {
                symbol = dispNameNode.text;
            }
            else
            {
                symbol = nodeName;
            }

            result += symbol + " ( ";

            var paramNodes = expressionNode.selectNodes("*[not(self::Name) and not(self::Display) and not(self::DisplayValue)]");
            var i = 0;
            for (i = 0; i < paramNodes.length; i++) 
            {
                if (i > 0)
                {
                    result += ", ";
                }
                if (checkExists(paramNodes[i]))
                {
                    result += this.getExpressionPreviewText(paramNodes[i]);
                }
            }


            var diff = requiredParameterCount - actualParameterCount;

            if (diff > 0)
            {
                //The expression is missing some required parameters and we need to add default values
                for (var em = 0; em < diff; em++)
                {
                    if (i > 0)
                    {
                        result += ", ";
                    }

                    result += "Text";

                    i++;
                }
            }

            result += " )";

            return result;

        },

        _generatePreviewForBracket: function (expressionNode)
        {
            var result = "";

            if (!checkExists(expressionNode))
            {
                return result;
            }

            result += "( ";

            var paramNodes = expressionNode.selectNodes("*[not(self::Name) and not(self::Display) and not(self::DisplayValue)]");
            var i = 0;
            for (i = 0; i < paramNodes.length; i++) 
            {
                if (i > 0)
                {
                    result += ", ";
                }
                if (checkExists(paramNodes[i]))
                {
                    result += this.getExpressionPreviewText(paramNodes[i]);
                }
            }

            result += " )";

            return result;
        },

        _generatePreviewForOperator: function (expressionNode)
        {
            var xmlHelper = SourceCode.Forms.ExpressionXmlHelper;
            var result = "";

            if (!checkExists(expressionNode))
            {
                return result;
            }

            var operator = expressionNode.nodeName;

            var operatorDefinitionNode = xmlHelper.getFunctionNodeByFunctionName(operator);

            if (!checkExists(operatorDefinitionNode))
            {
                return result;
            }

            var paramNodes = expressionNode.selectNodes("*[not(self::Name) and not(self::Display) and not(self::DisplayValue)]");
            if (paramNodes.length > 0)
            {
                var itemLeft = paramNodes[0];
                var itemRight = null;

                if (paramNodes.length > 1)
                {
                    itemRight = paramNodes[1];
                }

                var symbol = operator;
                var shortNameNode = operatorDefinitionNode.selectSingleNode("ShortName");
                if (checkExists(shortNameNode))
                {
                    symbol = shortNameNode.text;
                }

                var itemLeftPreview = this.getExpressionPreviewText(itemLeft);
                var itemRightPreview = this.getExpressionPreviewText(itemRight);

                result += itemLeftPreview + " " + symbol + " " + itemRightPreview;

            }

            return result;
        },

        _generatePreviewForValue: function (expressionNode)
        {
            var result = "";

            if (!checkExists(expressionNode))
            {
                return result;
            }

            var valueNode = expressionNode.selectSingleNode("SourceValue");
            if (checkExists(valueNode))
            {
                result = valueNode.text;
            }

            return result;
        },

        _generatePreviewForProperty: function (expressionNode)
        {
            var result = "";

            if (!checkExists(expressionNode))
            {
                return result;
            }

            var sourceType = expressionNode.getAttribute("SourceType");
            var sourceName = expressionNode.getAttribute("SourceName");
            var sourceDisplayName = expressionNode.getAttribute("SourceDisplayName");
            if (!checkExists(sourceType))
            {
                sourceType = "";
            }
            if (!checkExists(sourceName))
            {
                sourceName = "";
            }
            if (!checkExists(sourceDisplayName))
            {
                sourceDisplayName = "";
            }

            switch (sourceType)
            {
                case "SystemVariable":
                    result = this._getSystemVariableTypeResourceText(sourceName);
                    break;
                case "Control":
                case "ControlProperty":
                case "Expression":
                case "EnvironmentField":
                case "FormParameter":
                case "ViewParameter":
                case "ViewProperty":
                case "ViewField":
                    {
                        result = sourceDisplayName;

                        if (SourceCode.Forms.DependencyHelper.hasValidationStatusError(expressionNode))
                        {
                            result = SourceCode.Forms.Designers.Common.getItemDisplayName(expressionNode);
                        }
                    }
                    break;
            }

            return result;
        },

        _getSystemVariableTypeResourceText: function (systemVariableType)
        {
            var result = "";

            switch (systemVariableType.toLowerCase())
            {
                case "currentdate":
                    result = Resources.ContextTree.SystemValuesCurrentDate;
                    break;
                case "currentdateonly":
                    result = Resources.ContextTree.SystemValuesCurrentDateOnly;
                    break;
                case "currenttime":
                    result = Resources.ContextTree.SystemValuesCurrentTime;
                    break;
                case "currentuser":
                    result = Resources.ContextTree.TreeExtraHeading_SystemValuesUser;
                    break;
                case "currentusername":
                    result = Resources.ContextTree.SystemValuesCurrentUserName;
                    break;
                case "currentuserfqn":
                    result = Resources.ContextTree.SystemValuesCurrentUserFQN;
                    break;
                case "currentuserdisplayname":
                    result = Resources.ContextTree.SystemValuesDisplayName;
                    break;
                case "currentuserdescription":
                    result = Resources.ContextTree.SystemValuesDescription;
                    break;
                case "currentuseremail":
                    result = Resources.ContextTree.SystemValuesEmail;
                    break;
                case "currentusermanagerid":
                    result = Resources.ContextTree.SystemValuesManagerFQN;
                    break;
                case "screenheight":
                    result = Resources.ContextTree.SystemValuesScreenHeight;
                    break;
                case "screenwidth":
                    result = Resources.ContextTree.SystemValuesScreenWidth;
                    break;
                case "browserplatform":
                    result = Resources.ContextTree.SystemValuesPlatform;
                    break;
                case "browseruseragent":
                    result = Resources.ContextTree.SystemValuesUserAgent;
                    break;
                case "browserculture":
                    result = Resources.ContextTree.SystemValuesBrowserCulture;
                    break;
                case "rendermode":
                    result = Resources.ContextTree.TreeExtraHeading_SystemValuesRenderMode;
                    break;
                default:
                    result = "[" + Resources.ExpressionBuilder.UnresolvedObjectTextSystemVariableText + "]";
                    break;
            }

            return result;
        },

        _getUnresolvedResourceText: function (sourceType)
        {
            var text = "";
            switch (sourceType.toLowerCase())
            {
                case "control":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextControlText;
                    break;
                case "controlproperty":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextControlPropertyText;
                    break;
                case "expression":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextExpressionText;
                    break;
                case "environmentfield":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextEnvironmentFieldText;
                    break;
                case "viewfield":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextViewFieldText;
                    break;
                case "viewparameter":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextViewParameterText;
                    break;
                case "formparameter":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextFormParameterText;
                    break;
                case "systemvariable":
                    text = Resources.ExpressionBuilder.UnresolvedObjectTextSystemVariableText;
                    break;
            }

            return text;
        }

        //#endregion
    };

    SourceCode.Forms.ExpressionXmlHelper =
    {
        expressionNodeType:
        {
            FUNCTION: 1,
            OPERATOR: 2,
            VALUE: 3,
            PROPERTY: 4,
            BRACKET: 5
        },

        ///<summary>
        ///Returns a collection of all the parameter nodes for the passed in function node
        ///The different functions are defined in SourceCode.Forms.Designers.Common.expressionsDefinitionsXml
        ///</summary>
        getRequiredFunctionParameters: function (functionNode)
        {
            return functionNode.selectNodes("Parameters/Parameter");
        },

        ///<summary>
        ///For a function in an expression, get the required parameters count by looking up that function in the definition.
        ///Gets a list of all the parameter nodes for the passed in function node
        ///The different functions are defined in SourceCode.Forms.Designers.Common.expressionsDefinitionsXml
        ///</summary>
        getRequiredFunctionParamsForExpressionFn: function (expFnNode)
        {
            var fnName = expFnNode.nodeName;
            var fnNode = this.getFunctionNodeByFunctionName(fnName);
            var reqParams = this.getRequiredFunctionParameters(fnNode);
            return reqParams;
        },

        ///<summary>
        ///Looks up the expression function by name from the SourceCode.Forms.Designers.Common.expressionsDefinitionsXml
        ///<returns>Function xml node from SourceCode.Forms.Designers.Common.expressionsDefinitionsXml</returns>
        ///</summary>
        getFunctionNodeByFunctionName: function (fnName)
        {
            var functionNode = null;

            if (checkExists(SourceCode.Forms.Designers.Common.expressionsDefinitionsXml))
            {
                functionNode = SourceCode.Forms.Designers.Common.expressionsDefinitionsXml.selectSingleNode(
                    "FunctionsData/Functions/Function[Name='{0}']".format(fnName));
            }

            return functionNode;
        },

        ///<summary>
        ///Gets the first parent of type Function/Operator for the passed-in item node
        ///</summary>
        getParentFunctionForItemNode: function (itemNode)
        {
            var functionFound = false;
            var nodeParent = itemNode.parentNode;

            while (checkExists(nodeParent) && (nodeParent.nodeName.toLowerCase() !== "expression") && !functionFound)
            {
                var expType = this.getExpressionNodeType(nodeParent);
                if (expType === this.expressionNodeType.FUNCTION || expType === this.expressionNodeType.OPERATOR)
                {
                    functionFound = true;
                }
                else
                {
                    nodeParent = nodeParent.parentNode;
                }
            }

            if (!functionFound)
            {
                nodeParent = null;
            }
            return nodeParent;
        },

        ///<summary>
        ///Returns the type of expression node for the passed-in node - Function, Operator, Value, Property, Bracket
        ///</summary>
        getExpressionNodeType: function (expressionNode)
        {
            var type = null;
            var nodeName = expressionNode.nodeName;

            if (nodeName === "Bracket")
            {
                type = this.expressionNodeType.BRACKET;
            }
            else if (nodeName !== "Item" && checkExists(SourceCode.Forms.Designers.Common.expressionsDefinitionsXml))
            {
                var functionNode = SourceCode.Forms.ExpressionXmlHelper.getFunctionNodeByFunctionName(nodeName);
                if (checkExists(functionNode))
                {
                    var isOperator = functionNode.getAttribute("IsOperator");
                    if (checkExists(isOperator) && isOperator.toLowerCase() === "true")
                    {
                        type = this.expressionNodeType.OPERATOR;
                    }
                    else
                    {
                        type = this.expressionNodeType.FUNCTION;
                    }
                }
            }
            else
            {
                var sourceType = expressionNode.getAttribute("SourceType");
                if (checkExists(sourceType))
                {
                    if (sourceType === "Value")
                    {
                        type = this.expressionNodeType.VALUE;
                    }
                    else
                    {
                        type = this.expressionNodeType.PROPERTY;
                    }
                }
            }
            return type;
        }
    };

    SourceCode.Forms.Widget.ExpressionGrid =
    {
        _renderNoneItem: true,

        // Recursive function that will mark the specified expression as invalid as well as the recursive dependants
        InvalidateExpression: function (expressionsNode, expressionID)
        {
            var Expression = expressionsNode.selectSingleNode("Expression[@ID='" + expressionID + "']");

            if (checkExists(Expression))
            {
                Expression.setAttribute("Resolved", "False");

                var Items = expressionsNode.selectNodes(".//Item[@SourceType='Expression'][@SourceID='" + expressionID + "']");

                for (var i = 0, l = Items.length; i < l; i++)
                {
                    var Item = Items[i];
                    var ItemExpression = Item.selectSingleNode("./ancestor::Expression");
                    if (checkExists(ItemExpression))
                    {
                        this.InvalidateExpression(expressionsNode, ItemExpression.getAttribute("ID"));
                    }
                }
            }
        },

        RefreshExpressionGrid: function (expressionsNode, grid, expressionID)
        {
            grid.grid("clear");

            var selectedindex = null;
            if (this._renderNoneItem)
            {
                grid.grid("add", "row", ["", "(None)", ""]);
                selectedindex = 0;
            }

            // Loading the grid
            var expressions = expressionsNode.selectNodes("Expression");

            if (expressions.length > 0)
            {
                for (var i = 0, l = expressions.length; i < l; i++)
                {
                    // Bug Fix: 869148
                    // When the focus is NOT on an element with a property, the selectedindex will always be 1 more than it should be, 
                    // as a result of the _this._renderNoneItem being "True" and creating a "None" item with an index of 0. This fix
                    // checks whether there is a "None" item in the expressions list, and assigns the correct "selectedindex" value.
                    if (expressions[i].getAttribute("ID") === expressionID)
                    {
                        if (this._renderNoneItem)
                        {
                            selectedindex = i + 1;
                        }
                        else
                        {
                            selectedindex = i;
                        }
                    }

                    var expressionPreview = "";
                    if (expressions[i].selectSingleNode("DisplayValue") !== null)
                    {
                        expressionPreview = expressions[i].selectSingleNode("DisplayValue").text.htmlEncode();
                    }
                    else if (expressions[i].selectSingleNode("Display") !== null)
                    {
                        expressionPreview = expressions[i].selectSingleNode("Display").text.htmlEncode();
                    }

                    var row = [
                        {
                            value: expressions[i].getAttribute("ID")

                        },
                        {
                            display: expressions[i].selectSingleNode("Name") !== null ?
                                expressions[i].selectSingleNode("Name").text.htmlEncode() : ''
                        },
                        {
                            display: expressionPreview
                        }
                    ];

                    row[1].icon = SourceCode.Forms.Widget.ExpressionGrid._getExpressionIconName(expressions[i]);

                    grid.grid("add", "row", row, false);
                }

                grid.grid("synccolumns");
            }

            if (checkExists(selectedindex))
            {
                grid.grid("select", [selectedindex]);
            }
        },

        ValidateExpressionAndRemove: function (expInfo)
        {
            var removeExpFn = function ()
            {
                SourceCode.Forms.Widget.ExpressionGrid.RemoveExpression(expInfo);
            };

            var expNameXPath = "//Expressions/Expression[@ID='{0}']/Name".format(expInfo.expGuid);
            var expName = getNodeValue(expNameXPath, expInfo.expressionsNode, "");

            var expData =
            {
                itemId: expInfo.expGuid,
                itemType: SourceCode.Forms.DependencyHelper.ReferenceType.ControlExpression
            };

            var expressionDependencies = SourceCode.Forms.Designers.getDependencies(expData);
            if (expressionDependencies.length > 0)
            {
                var notifierOptions =
                {
                    references: expressionDependencies,
                    deletedItemDisplayName: expName,
                    deleteItemType: SourceCode.Forms.DependencyHelper.ReferenceType.ControlExpression,
                    removeObjFn: removeExpFn
                };
                SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
            }
            else
            {
                this.PromptRemoveExpression(expInfo);
            }
        },

        PromptRemoveExpression: function (expInfo)
        {
            popupManager.showConfirmation({
                message: Resources.ExpressionBuilder.RemoveExpressionConfirmation,
                height: 158,
                width: 384,
                onAccept: function ()
                {
                    SourceCode.Forms.Widget.ExpressionGrid.RemoveExpression(expInfo);
                    popupManager.closeLast({ cancelOnClose: true });
                }
            });
        },

        RemoveExpression: function (expInfo)
        {
            var expressionsNode = expInfo.expressionsNode;
            var grid = expInfo.grid;
            var expressionID = expInfo.expGuid;
            var contextXML = expInfo.contextXML;

            //----Code to remove dependant expressions - keep as reference until User Story 585201 done--------------
            //var affectedExpressions = expressionsNode.selectNodes("Expression[.//Item[@SourceType='Expression'][@SourceID='" + expressionID + "']]");
            //var ControlProperties = expressionsNode.parentNode.selectNodes("Controls/Control/Properties/Property[Name='ControlExpression'][Value='" + expressionID + "']");

            //for (var i = 0, l = ControlProperties.length; i < l; i++)
            //{
            //	ControlProperties[i].parentNode.removeChild(ControlProperties[i]);
            //}

            //var Controls = expressionsNode.parentNode.selectNodes("Controls/Control[@ExpressionID='" + expressionID + "']");

            //for (var i = 0, l = Controls.length; i < l; i++)
            //{
            //	Controls[i].removeAttribute("ExpressionID");
            //}

            //for (var i = 0, l = affectedExpressions.length; i < l; i++)
            //{
            //	affectedExpressions[i].setAttribute("Resolved", "False");
            //	var items = affectedExpressions[i].selectNodes(".//Item[@SourceType='Expression'][@SourceID='" + expressionID + "']");
            //	for (var j = 0, k = items.length; j < k; j++)
            //	{
            //		items[j].parentNode.removeChild(items[j]);
            //	}
            //}
            //--------------------------------------------------------------------------------------------------------

            expressionsNode.removeChild(expressionsNode.selectSingleNode("Expression[@ID='" + expressionID + "']"));
            //This removes Expression from contextHTML in order to remove from Tree
            var contextNode = contextXML.selectNodes("nodes/node/node[@text='Expressions']");
            contextNode[0].removeChild(contextNode[0].selectSingleNode("node[@id='" + expressionID + "']"));

            grid.grid("remove", "selected-row");
            grid.find(".edit, .remove").addClass("disabled");

            SourceCode.Forms.Widget.ExpressionGrid.RefreshExpressionGrid(expressionsNode, grid, "");
        },

        SaveExpression: function (expressionsNode, expression)
        {
            var expressionXmlDoc = $.parseXML(expression.xml);
            var expressionText = expression.preview;
            var expressionElem = expressionXmlDoc.documentElement;
            var expressionDisplayElem = expressionXmlDoc.selectSingleNode('Display');
            var ExpressionId = expressionElem.getAttribute("ID");

            var existingExpression = expressionsNode.selectSingleNode('Expression[@ID="' + ExpressionId + '"]');
            if ($chk(existingExpression) === true)
            {
                expressionsNode.removeChild(existingExpression);
                SourceCode.Forms.Widget.ExpressionGrid._updateExpressionsInControlProperties(existingExpression, expression);
            }

            var clonedExpression = expressionElem.cloneNode(true);
            expressionsNode.appendChild(clonedExpression);

            return ExpressionId;
        },

        _updateExpressionsInControlProperties: function (existingExpression, expression)
        {
            var oldName = existingExpression.selectSingleNode("Name").text;
            // If the expression name has changed, update Controls that utilize expression with new name
            if (expression.Name != oldName)
            {
                var definition = SourceCode.Forms.Designers.Common.getDefinitionXML();
                var controlsReferencingExpression = definition.selectNodes("//Controls/Control[@ExpressionID='" + expression.id + "']");
                for (var i = 0; i < controlsReferencingExpression.length; i++)
                {
                    var node = controlsReferencingExpression[i].selectSingleNode("Properties/Property[Name='ControlExpression']");

                    if (node.selectSingleNode("DisplayValue") !== null)
                    {
                        node.removeChild(node.selectSingleNode("DisplayValue"));
                    }
                    if (node.selectSingleNode("NameValue") !== null)
                    {
                        node.removeChild(node.selectSingleNode("NameValue"));
                    }

                    var displayNode = node.appendChild(definition.createElement("DisplayValue"));
                    displayNode.appendChild(definition.createTextNode(expression.name));

                    var nameValueNode = node.appendChild(definition.createElement("NameValue"));
                    nameValueNode.appendChild(definition.createTextNode(expression.name));
                }
            }
        },

        _expressionSelected: function (expressionsNode, thisContextXml, grid, controlNode, setControlPropery, thisSelectAsContextType, callback, callbackArgs)
        {
            var result = null;
            var selectedRows = grid.grid("fetch", "selected-rows", "objects");

            if (checkExists(controlNode))
            {
                result = SourceCode.Forms.Widget.ExpressionGrid.SetControlExpression(controlNode, selectedRows[0], expressionsNode, setControlPropery);
            }

            if (result == null || result.length > 0)
            {
                if (thisSelectAsContextType && result[1] !== null)
                {
                    // transform to sourceValue
                    var selectedExpression = thisContextXml.selectSingleNode("//*[@Guid='" + result[1][0].value + "' or @id='" + result[1][0].value + "']");
                    var expName = selectedExpression.getAttribute("Name");
                    var expDisplayName = selectedExpression.getAttribute("DisplayName");
                    var expText = selectedExpression.getAttribute("text");

                    result[1][0].value = [{
                        status: "",
                        type: "context",
                        selectionType: "complex",
                        text: expText,
                        data: {
                            id: selectedExpression.getAttribute("id"),
                            Guid: selectedExpression.getAttribute("Guid"),
                            InstanceID: selectedExpression.getAttribute("InstanceID"),
                            SubFormID: selectedExpression.getAttribute("SubFormID"),
                            Name: expName,
                            text: expText,
                            ItemType: selectedExpression.getAttribute("ItemType"),
                            DisplayName: expDisplayName,
                            icon: selectedExpression.getAttribute("icon")
                        }
                    }];
                }

                callback(result, callbackArgs);
                popupManager.closeLast({ cancelOnClose: true });
            }
        },

        SelectExpression: function (expressionsNode, contextXML, controlNode, enableToolbar, callback, callbackArgs, setControlPropery, validationCallbacks, selectAsContextType)
        {
            var _this = this;
            var container = $("#ExpressionGridContainer");
            if (container.length === 0)
            {
                container = $("<div id=\"ExpressionGridContainer\" class=\"wrapper\"></div>").append("body");
            }

            container.empty().load("Expressions/ExpressionGrid.aspx", function ()
            {
                var width = Math.floor(jQuery(window).width() * 0.6);
                var height = Math.floor(jQuery(window).height() * 0.8);

                var headerText;
                if (checkExists(controlNode))
                {
                    headerText = Resources.ExpressionBuilder.ExpressionGridDialogHeaderText.replace("{0}", controlNode.selectSingleNode("Name").text);
                    _this._renderNoneItem = true;
                }
                else
                {
                    headerText = Resources.ExpressionBuilder.ExpressionsText;
                    _this._renderNoneItem = false;
                }

                var thisContextXml = contextXML;
                var thisSelectAsContextType = selectAsContextType;
                popupManager.showPopup({
                    buttons: [
                        {
                            type: "help",
                            click: function () { HelpHelper.runHelp(7015); }
                        },
                        {
                            text: Resources.WizardButtons.OKButtonText,
                            click: function ()
                            {
                                _this._expressionSelected(expressionsNode, thisContextXml, grid, controlNode, setControlPropery, thisSelectAsContextType, callback, callbackArgs);
                            }
                        },
                        { text: Resources.WizardButtons.CancelButtonText, click: function () { popupManager.closeLast({ cancelOnClose: true }); } }],
                    headerText: headerText,
                    content: container,
                    draggable: true,
                    width: width,
                    height: height
                });

                var grid = $(this).find(".grid").grid({
                    rowselect: function (row, ev)
                    {
                        if (row.length > 0 && row.children("td:first-child").metadata().value === "" && enableToolbar)
                        {
                            $(this).find(".edit, .remove").addClass("disabled");
                        }
                        else if (enableToolbar)
                        {
                            $(this).find(".edit, .remove").removeClass("disabled");
                        }
                        else
                        {
                            $(this).find(".add, .edit, .remove").addClass("disabled");
                        }
                    }
                    ,
                    rowdblclick: function (row, ev)
                    {
                        if (row.children("td:first-child").metadata().value !== "" && enableToolbar)
                        {
                            $("#ExpressionsGridEditButton").trigger("click");
                        }
                    }
                });

                // Loading the grid
                var selectedindex = null;
                if (_this._renderNoneItem)
                {
                    grid.grid("add", "row", ["", "(None)", ""], false);
                    selectedindex = 0;
                }

                var expressions = (expressionsNode !== null) ? expressionsNode.selectNodes("Expression") : [];

                if (expressions.length > 0)
                {
                    var selectedexp;

                    if (checkExists(controlNode) && controlNode.selectSingleNode("Properties/Property[Name='ControlExpression']") !== null)
                    {
                        selectedexp = controlNode.selectSingleNode("Properties/Property[Name='ControlExpression']/Value").text;
                    }

                    for (var i = 0, l = expressions.length; i < l; i++)
                    {
                        if (expressions[i].getAttribute("ID") === selectedexp)
                        {
                            selectedindex = i + 1;
                        }

                        var expressionPreview = Resources.ExpressionBuilder.PreviewUnavailable;
                        if (expressions[i].selectSingleNode("DisplayValue") !== null)
                        {
                            expressionPreview = expressions[i].selectSingleNode("DisplayValue").text.htmlEncode();
                        }
                        else if (expressions[i].selectSingleNode("Display") !== null)
                        {
                            expressionPreview = expressions[i].selectSingleNode("Display").text.htmlEncode();
                        }

                        var row = [
                            { value: expressions[i].getAttribute("ID") },
                            { display: expressions[i].selectSingleNode("Name") !== null ? expressions[i].selectSingleNode("Name").text.htmlEncode() : '' },
                            { display: expressionPreview }
                        ];

                        row[1].icon = SourceCode.Forms.Widget.ExpressionGrid._getExpressionIconName(expressions[i]);

                        grid.grid("add", "row", row, false);
                    }

                    grid.grid("synccolumns");
                }

                if (checkExists(selectedindex))
                {
                    grid.grid("select", [selectedindex]);
                }

                var expInfo = {
                    expGuid: null,
                    expressionsNode: expressionsNode,
                    grid: grid,
                    contextXML: contextXML,
                    controlNode: controlNode
                };

                grid.on("click", "a:not(.disabled)", function ()
                {
                    if ($("#EBContentWrapper").length === 0)
                    {
                        $("body").append("<div id=\"EBContentWrapper\"></div>");
                    }

                    if ($(this).is(".add"))
                    {
                        expInfo.expGuid = null;
                        if (checkExists(validationCallbacks) && checkExists(validationCallbacks.addRow) && typeof validationCallbacks.addRow === "function")
                        {
                            validationCallbacks.addRow(expInfo);
                        }
                        else
                        {
                            $("#EBContentWrapper").ExpressionBuilder({
                                contextXML: expInfo.contextXML,
                                control: expInfo.controlNode,
                                save: function (exp)
                                {
                                    var expid = SourceCode.Forms.Widget.ExpressionGrid.SaveExpression(expInfo.expressionsNode, exp);
                                    SourceCode.Forms.Widget.ExpressionGrid.RefreshExpressionGrid(expInfo.expressionsNode, expInfo.grid, exp.id);
                                    return SourceCode.Forms.Widget.ExpressionGrid.UpdateContextXML(expInfo.contextXML, exp.id, exp.name);
                                }
                            });
                        }
                    }
                    else if ($(this).is(".edit"))
                    {
                        expInfo.expGuid = grid.grid("fetch", "selected-rows", "objects")[0][0].value;
                        if (checkExists(validationCallbacks) && checkExists(validationCallbacks.editRow) && typeof validationCallbacks.editRow === "function")
                        {
                            validationCallbacks.editRow(expInfo);
                        }
                        else
                        {
                            var expxml = expInfo.expressionsNode.selectSingleNode("Expression[@ID='" + expInfo.expGuid + "']");
                            $("#EBContentWrapper").ExpressionBuilder({
                                contextXML: expInfo.contextXML,
                                currentXML: expxml.xml,
                                control: expInfo.controlNode,
                                save: function (exp)
                                {
                                    var expid = SourceCode.Forms.Widget.ExpressionGrid.SaveExpression(expInfo.expressionsNode, exp);

                                    SourceCode.Forms.DependencyHelper.removeExpressionsAnnotationPointingToExpression(expInfo.expressionsNode, expid);

                                    SourceCode.Forms.Widget.ExpressionGrid.RefreshExpressionGrid(expInfo.expressionsNode, expInfo.grid, exp.id);
                                    return SourceCode.Forms.Widget.ExpressionGrid.UpdateContextXML(expInfo.contextXML, exp.id, exp.name);
                                }
                            });
                        }
                    }
                    else if ($(this).is(".remove"))
                    {
                        expInfo.expGuid = grid.grid("fetch", "selected-rows", "objects")[0][0].value;
                        if (checkExists(validationCallbacks) && checkExists(validationCallbacks.removeRow) && typeof validationCallbacks.removeRow === "function")
                        {
                            validationCallbacks.removeRow(expInfo);
                        }
                        else
                        {
                            SourceCode.Forms.Widget.ExpressionGrid.ValidateExpressionAndRemove(expInfo);
                            expInfo.contextXML = SourceCode.Forms.Widget.ExpressionGrid.UpdateContextXML(expInfo.contextXML, expInfo.expGuid);
                        }
                    }
                });
            });
        },

        _getExpressionIconName: function (expressionNode)
        {
            var iconName = "expression";

            if (checkExists(expressionNode.getAttribute("Resolved")) && expressionNode.getAttribute("Resolved") === "False")
            {
                iconName = "expression-error";
            }
            else
            {
                var nodes = expressionNode.selectNodes(".//Item[@ValidationStatus='Missing']|.//Item[@ValidationStatus='Warning']");
                if (checkExists(nodes) && nodes.length > 0)
                {
                    iconName = "expression-error";
                }
            }

            return iconName;
        },

        _checkCircularReference: function (controlField, expressionsNode, expressionID)
        {
            var expressionNode = expressionsNode.selectSingleNode(".//Expression[@ID='" + expressionID + "']");
            var sourceNodes = controlField !== null && checkExists(expressionNode) ? expressionNode.selectNodes(".//Item[@SourceID='" + controlField + "']") : [];

            if (sourceNodes.length > 0)
            {
                return true;
            }
            else
            {
                var expressionItems = checkExists(expressionNode) ? expressionNode.selectNodes(".//Item[@SourceType='Expression']") : [];
                if (expressionItems.length > 0)
                {
                    var _this = this;
                    var result = false;

                    $.each(expressionItems,
                        function ()
                        {
                            if (_this._checkCircularReference(controlField, expressionsNode, this.getAttribute("SourceID")))
                            {
                                result = true;
                                return false;
                            }
                        });

                    if (result)
                    {
                        return true;
                    }
                }
            }

            return false;
        },

        _checkValidExpression: function (expressionsNode, expressionID)
        {
            var expressionNode = expressionsNode.selectSingleNode(".//Expression[@ID='" + expressionID + "']");

            if (SourceCode.Forms.DependencyHelper.hasValidationStatusError(expressionNode))
            {
                return false;
            }

            return true;
        },

        SetControlExpression: function (controlNode, expression, expressionsNode, setControlProperty)
        {
            var propNode = controlNode.selectSingleNode("Properties/Property[Name='ControlExpression']");

            if (checkExists(expressionsNode))
            {
                var controlField = checkExists(controlNode.selectSingleNode("Properties/Property[Name='Field']/Value")) ? controlNode.selectSingleNode("Properties/Property[Name='Field']/Value").text : null;

                if (this._checkCircularReference(controlField, expressionsNode, expression[0].value))
                {
                    popupManager.showError(Resources.ExpressionBuilder.BoundFieldErrorText);
                    return false;
                }

                if (!this._checkValidExpression(expressionsNode, expression[0].value))
                {
                    popupManager.showError(Resources.ExpressionBuilder.InvalidExpressionErrorText);
                    return false;
                }
            }

            if (expression[0].value === "")
            {
                SourceCode.Forms.DependencyHelper.removeExpressionAnnotationForControl(controlNode);

                if (propNode !== null)
                {
                    propNode.parentNode.removeChild(propNode);
                }
                if (checkExists(controlNode.getAttribute("ExpressionID")))
                {
                    controlNode.removeAttribute("ExpressionID");
                }

                return [controlNode, null, expressionsNode];
            }
            else
            {
                if (!checkExists(setControlProperty) || setControlProperty !== false)
                {
                    SourceCode.Forms.DependencyHelper.removeExpressionAnnotationForControl(controlNode);

                    var doc = controlNode.ownerDocument;
                    if (propNode === null)
                    {
                        if (controlNode.selectSingleNode("Properties") === null)
                        {
                            controlNode.appendChild(doc.createElement("Properties"));
                        }
                        propNode = controlNode.selectSingleNode("Properties").appendChild(doc.createElement("Property"));
                        propNode.appendChild(doc.createElement("Name"));
                        propNode.firstChild.appendChild(doc.createTextNode("ControlExpression"));
                    }

                    if (propNode.selectSingleNode("Value") !== null)
                    {
                        propNode.removeChild(propNode.selectSingleNode("Value"));
                    }
                    if (propNode.selectSingleNode("DisplayValue") !== null)
                    {
                        propNode.removeChild(propNode.selectSingleNode("DisplayValue"));
                    }
                    if (propNode.selectSingleNode("NameValue") !== null)
                    {
                        propNode.removeChild(propNode.selectSingleNode("NameValue"));
                    }

                    var valueNode = propNode.appendChild(doc.createElement("Value"));
                    valueNode.appendChild(doc.createTextNode(expression[0].value));

                    var displayNode = propNode.appendChild(doc.createElement("DisplayValue"));
                    displayNode.appendChild(doc.createTextNode(expression[1].display));

                    var nameValueNode = propNode.appendChild(doc.createElement("NameValue"));
                    nameValueNode.appendChild(doc.createTextNode(expression[1].display));

                    controlNode.setAttribute("ExpressionID", expression[0].value);
                }

                return [controlNode, expression, expressionsNode];
            }
        },

        UpdateContextXML: function (contextXML, expressionID, expressionName)
        {

            var outputtype = typeof contextXML;

            var contextDoc = (outputtype === "string") ? $.parseXML(contextXML) : contextXML;

            if (expressionName !== undefined && expressionName !== null)
            {
                var ExpressionsNode = contextDoc.selectSingleNode(".//node[contains(@icon, 'expressions')]");

                var tmpDoc;
                var expressionNameEncoded = expressionName.xmlEncode();
                if (ExpressionsNode === null)
                {
                    tmpDoc = $.parseXML("<node name=\"Expressions\" icon=\"expressions\" text=\""
                        + Resources.ExpressionBuilder.ExpressionsText + "\" haschildren=\"true\" open=\"true\" />");

                    ExpressionsNode = contextDoc.selectSingleNode("nodes/node[(@ItemType='View')or(@ItemType='Form')]").appendChild(tmpDoc.documentElement.cloneNode(true));
                }

                var ExpressionNode = ExpressionsNode.selectSingleNode("node[@id='" + expressionID + "']");

                if (ExpressionNode === null)
                {
                    var nodeTemplate = '<node id="{0}" Guid="{0}" InstanceID="00000000-0000-0000-0000-000000000000" SubFormID="00000000-0000-0000-0000-000000000000" Name="{1}" text="{1}" ItemType="Expression" SubType="Expression" DisplayName="{1}" Data="{1}" icon="expression"/>';
                    tmpDoc = $.parseXML(nodeTemplate.format(expressionID, expressionNameEncoded));

                    ExpressionNode = ExpressionsNode.appendChild(tmpDoc.documentElement.cloneNode(true));
                }

                ExpressionNode.setAttribute("Name", expressionNameEncoded);
                ExpressionNode.setAttribute("DisplayName", expressionNameEncoded);
                ExpressionNode.setAttribute("text", expressionNameEncoded);
            }
            else
            {
                var RemovedExpression = contextDoc.selectSingleNode(".//node[contains(@icon, 'expressions')]/node[@id='" + expressionID + "']");
                RemovedExpression.setAttribute("disabled", "true");
                //if (RemovedExpression !== null) RemovedExpression.parentNode.removeChild(RemovedExpression);
            }

            return (outputtype === "string") ? contextDoc.xml : contextDoc;
        }
    };

    SourceCode.Forms.ExpressionContextHelper =
    {
        pluginReturnedId: "expressions",

        _pluginReturned: function (event, callbackThis, callback, callbackArguments)
        {
            if (this.pluginCount > this.returnedPlugins)
            {
                this.returnedPlugins++;

                var returnedXml = event.detail.xml;

                //sort context items so that system values is first, then forms (alphabetically) then views (alphabetically)
                var type = returnedXml.documentElement.getAttribute("ItemType");
                var name = returnedXml.documentElement.getAttribute("text");
                var pos = ConfigurationWidget.prototype._getContextTreePosition(this.pluginResults.documentElement, type, name);

                var clonedReturnXML = returnedXml.documentElement.cloneNode(true);
                var documentElement = this.pluginResults.documentElement;

                if (pos === documentElement.childNodes.length)
                {
                    documentElement.appendChild(clonedReturnXML);
                }
                else
                {
                    documentElement.insertBefore(clonedReturnXML, documentElement.childNodes[pos]);
                }
            }
            if (this.pluginCount === this.returnedPlugins)
            {
                this._unBind();
                if (checkExists(callbackArguments))
                {
                    callbackArguments.unshift(this.pluginResults);
                }
                else
                {
                    callbackArguments = [this.pluginResults];
                }
                callback.apply(callbackThis, callbackArguments);
            }
        },

        //_BuildExpressionContextTreeXml
        _BuildExpressionContextTreeXml: function (plugins, callbackThis, callback, callbackArguments)
        {
            this.pluginCount = plugins.length;
            this.returnedPlugins = 0;
            this.pluginResults = parseXML("<nodes/>");

            jQuery(document.body).on(this.pluginReturnedId, function (event)
            {
                this._pluginReturned(event, callbackThis, callback, callbackArguments);
            }.bind(this));

            for (var i = 0; i < this.pluginCount; i++)
            {
                plugins[i].pluginReturnedId = this.pluginReturnedId;
                plugins[i].initialize();
            }
        },

        _unBind: function ()
        {
            if ((typeof this.pluginReturnedId !== "undefined") && (this.pluginReturnedId !== null) && (this.pluginReturnedId !== ""))
            {
                jQuery(document.body).off(this.pluginReturnedId);
            }
        }
    };

})(jQuery);
