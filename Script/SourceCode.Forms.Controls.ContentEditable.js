(function($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};
    SourceCode.Forms.Controls.ContentEditable =
    {
        //#region
        waterMarkElement: null,
        _useTextNodes: null,

        _selectionInfo:
        {
            range: null,
            isDomRange: null
        },
        _create: function ()
        {
            //#region
            this.element.prop("contentEditable", false);
            this.element.addClass("contentEditable");
            this.waterMarkElement = this.element.find(".input-control-watermark");
            this.element.on("mouseup", function(event)
            {
                this._selectionInfo = this._getSelectionInfo(this._getSelection());
            }
            .bind(this));
            this.element.on("keypress", function(event, ui) { this._keyPress(event); }.bind(this));
            if (this.options.droppable)
            {
                this.element.droppable({
                    accept: this.options.droppableAccept,
                    tolerance: 'pointer',
                    //scope: 'layout',
                    drop: function(event, ui) { this._dragDropped(event, ui); }.bind(this),
                    over: function(event, ui) { this._dragOver(event, ui); }.bind(this),
                    out: function(event, ui) { this._dragOut(event, ui); }.bind(this)
                });
            }
            this.waterMarkElement.on("click", 
            function(event)
            {
                $(event.target).hide();


                var oldWaterMarkElement = this.waterMarkElement.clone();
                this.waterMarkElement.off("click");
                this.waterMarkElement.remove();
                this.element.empty();
                this.element.html("");
                this.element.prop("contentEditable", true);
                this.element.trigger("focus");
            }.bind(this));

            //#endregion
        },
        _usesTextNodes: function()
        {
            //#region
            if (this._useTextNodes === null)
                this._useTextNodes = $.FeatureDetection.isHostProperty(this._selectionInfo.range, "offsetLeft") && $.FeatureDetection.isHostMethod(this._selectionInfo.range, "move")
            return this._useTextNodes
            //#endregion
        },
        _keyPress: function(event)
        {
            //#region
            this._selectionInfo = this._getSelectionInfo(this._getSelection());
            if (
                event.keyCode === 39//right
                || event.keyCode === 38//up
                || event.keyCode === 37//left
                || event.keyCode === 40//down
                || event.keyCode === 16//shift
                || event.keyCode === 13//enter
                || event.keyCode === 8//backspace
                || event.keyCode === 46 //delete
                )
            {
            }
            else
            {
                //	            if (this._checkRangeWithinContainer(this.selectionInfo.range, ".normalSection"))
                //	            {
                //	                //allow normal event propagation
                //	            }
                //	            else
                //	            {
                event.preventDefault();
                event.stopPropagation();
                this.insertNormalText(String.fromCharCode(event.which));

                //	            }
            }
            //#endregion
        },
        _getSelection: function()
        {
            //#region
            if ($.FeatureDetection.isHostMethod(window, "getSelection"))
                return window.getSelection();
            else if ($.FeatureDetection.isHostObject(document, "selection"))
            {
                this.element.trigger("focus");
                return window.document.selection;
            }
            else
                return null;
            //#endregion
        },
        _createRange: function()
        {
            //#region
            if ($.FeatureDetection.isHostMethod(document, "createRange"))
            {
                return document.createRange();
            }
            else if ($.FeatureDetection.isHostMethod(document.body, "createTextRange"))
            {
                return document.body.createTextRange();
            }
            else
                return null;
            //#endregion
        },
        _getSelectionInfo: function(selection)
        {
            //#region
            var range = null;
            var isDomRange = null;
            if ($.FeatureDetection.isHostMethod(selection, "getRangeAt"))
            {
                range = (selection.rangeCount === 0) ? null : selection.getRangeAt(0);
                isDomRange = true
            }
            else if ($.FeatureDetection.isHostMethod(selection, "createRange"))
            {
                range = selection.createRange();
                isDomRange = false;
            }
            else if ($.FeatureDetection.areHostObjects(selection,
                        ["anchorNode", "focusNode", "anchorOffset", "focusOffset", "isCollapsed"]))
            {
                range = this._createRange();
                if ($.FeatureDetection.isHostObject(range, "collapsed"))
                {
                    range.setStart(selection.anchorNode, selection.anchorOffset);
                    range.setEnd(selection.focusNode, selection.focusOffset);

                    // Handle the case when the selection was selected backwards (from the end to the start in the
                    // document)
                    if (range.collapsed !== selection.isCollapsed)
                    {
                        range.setStart(selection.focusNode, selection.focusOffset);
                        range.setEnd(selection.anchorNode, selection.anchorOffset);
                    }

                    isDomRange = true;
                }
            }

            return { range: range, isDomRange: isDomRange };
            //#endregion
        },
        selectionInfo: function()
        {
            //#region
            if (this._selectionInfo.range === null)
            {
                this._selectionInfo = this._getSelectionInfo(this._getSelection());
            }
            return this._selectionInfo;
            //#endregion
        },
        _selectRange: function(selection, range)
        {
            //#region
            if ($.FeatureDetection.areHostMethods(selection, ["removeAllRanges", "addRange"]))
            {
                selection.removeAllRanges();
                selection.addRange(range);
            }
            else if ($.FeatureDetection.isHostMethod(selection, ["empty"]) && $.FeatureDetection.isHostMethod(range, ["select"]))
            {
                selection.empty();
                range.select();
            }
            //#endregion
        },
        loadContents: function(completeHtmlText)
        {
            this.element.prop("contentEditable", false);
            this.element.html(completeHtmlText);
            this.element.prop("contentEditable", true);
            this.element.trigger("focus");

        },
        insertText: function(text)
        {
            //#region
            var selectionInfo = this.selectionInfo();
            var range = selectionInfo.range;
            if (this._checkRangeWithinContainer(range, ".contentEditable"))
            {
                if (selectionInfo.isDomRange)
                {
                    try
                    {
                        range.deleteContents();
                        var newNode = document.createTextNode(text)
                        range.insertNode(newNode);
                        range.setEnd(newNode, text.length)
                        range.collapse(false);
                        this.element[0].focus();
                    }
                    catch (ex)
                    {
                    }

                }
                else
                {
                    range.pasteHTML(text);
                }
                this._selectRange(this._getSelection(), range);
                this._selectionInfo = this._getSelectionInfo(this._getSelection());
                this.element[0].focus();
            }
            //#endregion
        },
        insertFormulae: function(text)
        {
            //#region
            if (this._usesTextNodes())
                this.insertText(text);
            else
            {
                for (i = 0; i < text.length; i++)
                    this.insertHtml(this._createNormalSection(text.charAt(i)));
            }
            //#endregion
        },
        insertNormalText: function(text)
        {
            //#region
            if (this._usesTextNodes())
                this.insertText(text);
            else
                this.insertHtml(this._createNormalSection(text));
            //#endregion
        },
        _setRangeToElement: function(range, element, isDomRange, atStart)
        {
            //#region
            var tempRange;
            if (isDomRange)
            {
                range.selectNode(element);
                if (atStart !== null)
                    range.collapse(atStart);
            }
            else
            {
                tempRange = range.duplicate();
                tempRange.moveToElementText(element);
                if (atStart !== null)
                {
                    range.setEndPoint("StartToStart", tempRange);
                    range.setEndPoint("EndToEnd", tempRange);
                    // range.setEndPoint(atStart ? "StartToStart" : "StartToEnd", tempRange);
                    // range.setEndPoint(atStart ? "EndToStart" : "EndToEnd", tempRange);
                    range.collapse(atStart);
                }
                else
                {

                }
            }
            //#endregion
        },
        _checkRangeWithinContainer: function(range, container)
        {
            //#region
            var result = false;
            if ($.FeatureDetection.areHostObjects(range, ["startContainer", "endContainer"]))
            {
                var begin = $(range.startContainer);
                var end = $(range.endContainer);
                result = (end.closest(container).length !== 0
                        && begin.closest(container).length !== 0
                        && end.closest(".nonContentEditable").length === 0
                        && begin.closest(".nonContentEditable").length === 0
                        );
            }
            else
                result = true;
            return result;
            //#endregion
        },
        insertHtml: function(jQueryObject)
        {
            //#region
            var selectionInfo = this.selectionInfo();
            var range = selectionInfo.range;
            if (this._checkRangeWithinContainer(range, ".contentEditable"))
            {
                if (selectionInfo.isDomRange)
                {
                    try
                    {
                        range.deleteContents();
                        range.insertNode(jQueryObject[0]);
                        this._setRangeToElement(range, jQueryObject[0], true, false);
                        this.element[0].focus();
                    }
                    catch (ex)
                    {
                        alert(ex.message);
                    }

                }
                else
                {
                    range.pasteHTML(jQueryObject[0].outerHTML);
                }
                this._selectRange(this._getSelection(), range);
                this._selectionInfo = this._getSelectionInfo(this._getSelection());
                this.element[0].focus();

            }
            //#endregion
        },
        _createNonContentEditableSection: function(draggable)
        {
            //#region
            var draggableMetaData = draggable.closest("li").metadata();
            var nonEditableSection = this.createNonContentEditableSection(
                draggable.text(),
                draggableMetaData.id,
                draggableMetaData.type,
                draggableMetaData.subtype
            );
            return nonEditableSection;
            //#endregion
        },
        createNonContentEditableSection: function(text, id, type, subtype)
        {
            //#region
            var metaArray = {};
            metaArray["id"] = id;
            metaArray["type"] = type;
            metaArray["subtype"] = subtype;

            var nonEditableSection =
                $("<span></span>")
                    .css({
                        display: "inline-block",
                        border: "solid 1px black",
                        backgroundColor: "Green"
                    })
                    .prop("contenteditable", false)
                    .attr("data-options", jQuery.toJSON(metaArray))
                    .addClass("nonContentEditable")
                    .addClass("draggedFromTree")
                    .text(text)
                    .selectable(false);

            nonEditableSection.metadata().id = id;
            nonEditableSection.metadata().type = type;
            nonEditableSection.metadata().subtype = subtype;

            return nonEditableSection;
            //#endregion
        },
        _createFormulaeSection: function(text)
        {
            //#region
            var nonEditableSection =
                $("<span></span>")
                    .css({
                        display: "inline-block",
                        color: "green"
                    })
                    .prop("contenteditable", false)
                    .addClass("nonContentEditable")
                    .addClass("formulaeSection")
                    .html(text);
            return nonEditableSection;
            //#endregion
        },
        _createNormalSection: function(text)
        {
            //#region
            var nonEditableSection =
                $("<span></span>")
                    .css({
                        display: "inline-block"
                    })
                    .addClass("normalSection")
                    .text(text);
            return nonEditableSection;
            //#endregion
        },
        _dragDropped: function(event, ui)
        {
            //#region
            this.element.off("mousemove");
            this.insertHtml(this._createNonContentEditableSection($(ui.draggable)));
            //this.element.find('.nonContentEditable').draggable({ helper: "clone" });
            //#endregion
        },
        _dragOver: function(event, ui)
        {
            //#region
            $(ui.draggable).on("drag", function(event, ui) { this._dragMouseMove(event, ui); }.bind(this));
            //#endregion
        },
        _setSelection: function(x, y)
        {
            //#region
            var collapseRangeToStart = true;
            var range = this._createRange();
            var doc = document;
            this.element[0].focus();
            if ($.FeatureDetection.isHostMethod(doc, "elementFromPoint"))
            {
                var current = doc.elementFromPoint(x, y);
                var jqCurrent = $(current);
                //fix to place at end element in firefox/safari/chrome/opera
                if (!this._usesTextNodes())
                {
                    //firefox / safari / chrome / opera
                    if (jqCurrent.hasClass("contentEditable"))
                    {
                        jqCurrent = jqCurrent.children().last();
                        collapseRangeToStart = false;
                        current = jqCurrent[0];
                    }
                }
                this._setRangeToElement(range, current, this.selectionInfo().isDomRange, collapseRangeToStart);

                if (this._usesTextNodes())
                {
                    //fix for text node placement in IE
                    if (jqCurrent.hasClass("contentEditable") && collapseRangeToStart)
                    {
                        var i = this.element.text().length;
                        //each move into a new span and out of a new span takes a 1 character move
                        i += (this.element.find(".nonContentEditable").length * 2);
                        var j = 0
                        while (range.offsetLeft < x && i > 0)
                        {
                            range.move('character', 1);
                            i--;
                        }
                        //fix to move range out of non editable sections
                        while ($(range.parentElement()).hasClass("nonContentEditable"))
                            range.move('character', -1);
                    }
                }
            }
            this._selectRange(this._getSelection(), range);
            this._selectionInfo = this._getSelectionInfo(this._getSelection());
            this.element[0].focus();
            //#endregion
        },
        _dragMouseMove: function(event, ui)
        {
            //#region
            var x = event.pageX;
            var y = event.pageY;
            $(ui.helper).hide();
            this._setSelection(x, y);
            $(ui.helper).show();
            event.stopPropagation();
            //#endregion
        },
        _dragOut: function(event, ui)
        {
            //#region
            $(ui.draggable).off("drag");
            this.element[0].blur();
            //#endregion
        }
        //#endregion
    }
    if (typeof SCContentEditable === "undefined") SCContentEditable = SourceCode.Forms.Controls.ContentEditable
    $.widget("ui.ContentEditable", SourceCode.Forms.Controls.ContentEditable);
    $.extend($.ui.ContentEditable.prototype,
        {
            options:
            {
                droppable: true,
                droppableAccept: ".ui-draggable"
            },
            getter: "createNonContentEditableSection"
        });


    $.extend(
    {
        FeatureDetection:
        {
            //#region
            isHostMethod: function(object, property)
            {
                //#region
                if (typeof object === "undefined") return false;
                var t = typeof object[property];
                return t === 'function' || (!!(t === 'object' && object[property])) || t === 'unknown';
                //#endregion
            },

            isHostObject: function(object, property)
            {
                //#region
                if (typeof object === "undefined" || object === null) return false;
                return !!(typeof (object[property]) === 'object' && object[property]);
                //#endregion
            },
            isHostProperty: function(object, property)
            {
                //#region
                if (typeof object === "undefined" || object === null) return false;
                if (typeof (object[property]) === 'undefined') return false;
                return true;
                //#endregion
            },


            // Next pair of functions are a convenience to save verbose repeated calls to previous two functions
            areHostMethods: function(object, properties)
            {
                //#region
                for (var i = properties.length; i--; )
                {
                    if (!this.isHostMethod(object, properties[i]))
                    {
                        return false;
                    }
                }
                return true;
                //#endregion
            },

            areHostObjects: function(object, properties)
            {
                //#region
                for (var i = properties.length; i--; )
                {
                    if (!this.isHostObject(object, properties[i]))
                    {
                        return false;
                    }
                }
                return true;
                //#endregion
            }
            //#endregion
        }
    });
})(jQuery);
