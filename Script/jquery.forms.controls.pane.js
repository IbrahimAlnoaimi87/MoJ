(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.PaneContainer = {

    	AnimationTypes: {
    		none: "none",
			auto: "auto", //Animation will be picked for you (uses global settings)
    		slideLeft: "slide-left",
    		slideRight: "slide-right",
    		slideUp: "slide-up",
    		slideDown: "slide-down"
    	},

        _create: function ()
        {
            //#region
            this.orientation = (this.element.is(".horizontal")) ? "horizontal" : "vertical";
            this.panes = this.element.children(".pane");
            this.dividers = this.element.children(".divider");

            this._initPanes();
            this._initDivDragHandlers();

            this._trigger("create", null, {});
            //#endregion
        },

        regexp:
        {
            //#region
            percentage: /^\d+\%$/gi,
            pixel: /^\d+(px)?$/gi
            //#endregion
        },

        //orientation helper functions
        //#region
        getOrientationCSSEndPositionText: function ()
        {
            //#region
            if (this.orientation === "horizontal")
                return "right";
            else
                return "bottom";
            //#endregion
        },

        getOrientationCSSBeginPositionText: function ()
        {
            //#region
            if (this.orientation === "horizontal")
                return "left";
            else
                return "top";
            //#endregion
        },

        getOrientationCSSBeginPosition: function (jqObject)
        {
            //#region
            if (jqObject === null || jqObject.length === 0)
                return 0;
            else
                return parseInt(jqObject.css(this.getOrientationCSSBeginPositionText()));
            //#endregion
        },

        getOrientationCSSEndPosition: function (jqObject)
        {
            //#region
            if (jqObject === null || jqObject.length === 0)
                return 0;
            else
                return parseInt(jqObject.css(this.getOrientationCSSEndPositionText()));
            //#endregion
        },

        getOrientationDimensionText: function ()
        {
            //#region
            if (this.orientation === "horizontal")
                return "width";
            else
                return "height";
            //#endregion
        },

        getOrientationDimension: function (jqObject)
        {
            //#region
            if (jqObject === null || jqObject.length === 0)
            {
                return 0;
            }
            else
            {
                if (this.orientation === "horizontal")
                {
                    return jqObject.outerWidth();
                }
                else
                {
                    return jqObject.outerHeight();
                }
            }
            //#endregion
        },

        setOrientationCSSBeginPosition: function (jqObject, value)
        {
            //#region
            if (jqObject !== null)
            {
                if (value.toString().indexOf("px") < 0 && value !== "auto")
                    value = value + "px";
                jqObject.css(this.getOrientationCSSBeginPositionText(), value);
            }
            //#endregion
        },

        setOrientationCSSEndPosition: function (jqObject, value)
        {
            //#region
            if (jqObject !== null)
            {
                if (value.toString().indexOf("px") < 0 && value !== "auto")
                    value = value + "px";
                jqObject.css(this.getOrientationCSSEndPositionText(), value);
            }
            //#endregion
        },

        setOrientationCSSDimension: function (jqObject, value)
        {
            //#region
            if (jqObject !== null)
            {
                if (value.toString().indexOf("px") < 0)
                    value = value + "px";
                jqObject.css(this.getOrientationDimensionText(), value);
            }
            //#endregion
        },

        getOffSetPosition: function (jqObject)
        {
            //#region
            if (jqObject === null || jqObject.length === 0)
                return 0;
            else
            {
                if (this.orientation === "horizontal")
                    return jqObject.offset().left;
                else
                    return jqObject.offset().top;
            }
            //#endregion
        },

        getOrientationMetaDimension: function (jqObject)
        {
            //#region
            if (jqObject === null || jqObject.length === 0)
                return 0;
            else
            {
                var m = jqObject.metadata(), dimension = "";
                if (this.orientation === "horizontal")
                {
                    dimension = m.width;
                    if (checkExists(dimension) && dimension.indexOf("%") > -1)
                    {
                        var jqObjectParent = jqObject.parent();
                        var parentWidth = jqObjectParent.width();
                        var dividers = jqObjectParent.children().filter(".divider").length;
                        var dividerWidth = jqObjectParent.children().filter(".divider").width();
                        if (dividers === 0) {
                            dimension = Math.floor(parseInt(dimension.replace("%", "")) / 100 * (parentWidth)) + "px";
                        }
                        else {
                            dimension = Math.floor(parseInt(dimension.replace("%", "")) / 100 * (parentWidth - (dividers * dividerWidth))) + "px";
                        }
                    }
                    else if (checkExists(m.autosize) && m.autosize === true)
                    {
                        jqObject.css("position", "relative");
                        dimension = jqObject.children().outerWidthAll(true) + "px";
                        jqObject.css("position", "absolute");
                    }
                    return dimension;

                }
                else
                {
                    dimension = m.height;
                    if (checkExists(dimension) && dimension.indexOf("%") > -1)
                    {
                        var jqObjectParent = jqObject.parent();
                        var parentHeight = jqObjectParent.height();
                        var dividers = jqObjectParent.children().filter(".divider").length;
                        var dividerHeight = jqObjectParent.children().filter(".divider").height();
                        if (dividers === 0) {
                            dimension = Math.floor(parseInt(dimension.replace("%", "")) / 100 * (parentHeight)) + "px";
                        }
                        else {
                            dimension = Math.floor(parseInt(dimension.replace("%", "")) / 100 * (parentHeight - (dividers * dividerHeight))) + "px";
                        }
                    }
                    else if (checkExists(m.autosize) && m.autosize === true)
                    {
                        jqObject.css("position", "relative");
                        dimension = jqObject.children().outerHeightAll(true) + "px";
                        jqObject.css("position", "absolute");
                    }
                    return dimension;
                }
            }
            //#endregion
        },

        //#endregion
        _initPanes: function ()
        {
            //#region

            //css
            //css[0] a css key pair
            //css[0][0]=dimention name
            //css[0][1]=dimention value
            //eg css[0][0]=top css[0][1]=50px
            var dimension = this.getOrientationDimensionText();
            var dimensionlessPaneIndex = -1;
            //loop through all panes
            var l = this.panes.length;
            for (var i = 0; i < l; i++)
            {
                var $pane = this.panes.eq(i);
                var $metadata = $pane.metadata();
                //find the dimensionless pane
                if (!checkExists($metadata[dimension]) && (!checkExists($metadata["autosize"]) || $metadata["autosize"] === false))
                {
                    dimensionlessPaneIndex = i;
                    break;
                }
            }

            var firstPaneIndex = 0;
            for (var i = 0, firstl = dimensionlessPaneIndex; i < firstl; i++)
            {
                var $pane = this.panes.eq(i);
                var $metadata = $pane.metadata();
                var $div = $pane.prev(".divider");
                var css = [];

            	//initPanes is also called by refresh, if a pane is hidden we need to take that into account
				//and not just try to re-show it.
                if ($pane.data("isHidden") === true) {
                	firstPaneIndex++;
                	continue;
                }

                //Calculate the starting position
                //#region
                //if this is the first pane
                if (i === firstPaneIndex)
                    css.push([this.getOrientationCSSBeginPositionText(), "0"]);
                else
                {
                	var $previousPane = (i > firstPaneIndex) ? this.panes.eq(i - 1) : null;
                	var $previousDivider = (i > firstPaneIndex) ? $pane.prev(".divider") : null;
                    if ($previousPane !== null)
                    {
                        //calculate left/top position based on previous panes+ the previous divider
                        css.push([this.getOrientationCSSBeginPositionText(), this.getOrientationCSSBeginPosition($previousPane) + this.getOrientationDimension($previousPane) + this.getOrientationDimension($previousDivider) + "px"]);
                    }
                }
                //#endregion

                //Calculate the end position
                //#region
                css.push([dimension, this.getOrientationMetaDimension($pane)]);
                //#endregion

                //Add the style to the Pane
                //#region
                for (var c = 0, d = css.length; c < d; c++)
                {
                    $pane.css(css[c][0], css[c][1]);
                }
                //#endregion

                //divider
                //#region
                var lt = 0;
                lt = this.getOrientationCSSBeginPosition(this.panes.eq((i - 1))) + this.getOrientationDimension(this.panes.eq((i - 1)));
                $div.css(this.getOrientationCSSBeginPositionText(), lt);
                //#endregion
                $pane.attr("location", "-1");

            }
            for (var i = this.panes.length - 1; i > dimensionlessPaneIndex; i--)
            {
                //handle all panes after the dimesionless pane
                //in reverse logic
                var $pane = this.panes.eq(i);
                var $metadata = $pane.metadata();
                var $div = $pane.prev(".divider");
                var css = [];

                //Calculate the end position
                //#region
                var $nextPane = this.panes.eq(i + 1);
                var $nextDivider = $pane.next(".divider");
                if ($nextPane.length !== 0 && $nextPane.data("isHidden")!=true)
                {
                    //calculate left/top position based on previous panes+ the previous divider
                    css.push([this.getOrientationCSSEndPositionText(), this.getOrientationCSSEndPosition($nextPane) + this.getOrientationDimension($nextPane) + this.getOrientationDimension($nextDivider) + "px"]);
                }
                else
                {
                    css.push([this.getOrientationCSSEndPositionText(), "0"]);
                }
                //#endregion

                //Calculate the start position
                //#region
                css.push([dimension, this.getOrientationMetaDimension($pane)]);
                //#endregion

                //Add the style to the Pane
                //#region
                for (var c = 0, d = css.length; c < d; c++)
                {
                    $pane.css(css[c][0], css[c][1]);
                }
                //#endregion

                //set divider
                //#region
                var lt = 0;
                lt = this.getOrientationCSSEndPosition(this.panes.eq(i)) + this.getOrientationDimension(this.panes.eq(i));
                $div.css(this.getOrientationCSSEndPositionText(), lt);
                //#endregion
                $pane.attr("location", "1");

            }

            //handle MR dimensionless
            var $dimlesspane = this.panes.eq(dimensionlessPaneIndex);
            var $div = $dimlesspane.prev(".divider");
            var $nextPane = this.panes.eq(dimensionlessPaneIndex + 1);
            var $prevPane = this.panes.eq(dimensionlessPaneIndex - 1);
            var css = [];

            //Calculate the starting position
            //#region
            if (dimensionlessPaneIndex === firstPaneIndex)
            {
                css.push([this.getOrientationCSSBeginPositionText(), "0px"]);
            }
            else
            {
                var dim = this.getOrientationCSSBeginPosition($prevPane) + this.getOrientationDimension($prevPane) + this.getOrientationDimension($div) + "px";
                css.push([this.getOrientationCSSBeginPositionText(), dim]);
            }
            //#endregion

            //Calculate the ending position
            //#region
            if (dimensionlessPaneIndex === l - 1)
            {
                css.push([this.getOrientationCSSEndPositionText(), "0px"]);
            }
            else
            {
                var dim = this.getOrientationCSSEndPosition($nextPane) + this.getOrientationDimension($nextPane) + this.getOrientationDimension($dimlesspane.next(".divider")) + "px";
                css.push([this.getOrientationCSSEndPositionText(), dim]);
            }
            //#endregion

            //Add the style to the Pane
            //#region
            for (var c = 0, d = css.length; c < d; c++)
            {
                $dimlesspane.css(css[c][0], css[c][1]);
            }
            //#endregion

            //Add the style to the divider
            //#region
            var lt = 0;
            lt = this.getOrientationCSSBeginPosition(this.panes.eq((i - 1))) + this.getOrientationDimension(this.panes.eq((i - 1)));
            $div.css(this.getOrientationCSSBeginPositionText(), lt);
            //#endregion
            $dimlesspane.attr("location", "0")
            //#endregion
        },

        //used for saving the width of a pane, whether its been hidden or not.
        getPaneWidth: function (paneId)
        {
            var $pane = this.panes.filter(paneId);
            if ($pane.length==0) throw "PaneID " + paneId + " could not be found";
            
            if ($pane.data("isHidden") === true)
            {
                return $pane.data("restore");
            }
            else
            {
                return $pane.width();
            }
        },

        draggableMouseDown: function (event)
        {
            //#region
            var $this = this;
            var divider = $(event.target);
            divider.off("mousedown");
            divider.draggable({
                helper: "clone",
                axis: ($this.orientation === "horizontal") ? "x" : "y",
                opacity: 0.7,
                containment: $this._calculateContainment(divider),
                start: function (ev, ui)
                {
                    $(ui.helper).data("divider", divider);
                    $this.element.find("iframe").overlay({ modal: true });
                },
                stop: function (ev, ui)
                {
                    $this.element.find("iframe").removeOverlay();
                    $this._dragStop(ev, ui);
                    $(ui.helper).removeData("divider");
                    divider.draggable("destroy");
                    divider.on("mousedown", function (event) { $this.draggableMouseDown(event); });
                }
            });
            divider.trigger(event);
            //#endregion
        },

        _initDivDragHandlers: function ()
        {
            //#region
            var $this = this;

            this.dividers.each(function ()
            {
                $(this).off(".panecontainer");

                var jqDiv = $(this);
                var jqDivMeta = jqDiv.metadata();
                if (jqDivMeta.divResize !== "none")
                    $(this).on("mousedown.panecontainer", function (event) { $this.draggableMouseDown(event); });
            });
            //#endregion

        },

        _calculateContainment: function (divider)
        {
            //#region
            var $prevPane = divider.prev(".pane");
            var $nextPane = divider.next(".pane");
            var $prevPaneMeta = $prevPane.metadata();
            var $nextPaneMeta = $nextPane.metadata();
            var $prevPaneOffset = $prevPane.offset();
            var $nextPaneOffset = $nextPane.offset();
            var jqDiv = $(divider);
            var jqDivMetaDivResize = jqDiv.metadata().divResize;

            var prevMinWidth = 0, nextMinWidth = 0, prevMinHeight = 0, nextMinHeight = 0;
            if (typeof $prevPaneMeta.minwidth !== "undefined")
            {
                prevMinWidth = parseInt($prevPaneMeta.minwidth.replace("px", ""));
            }
            if (typeof $nextPaneMeta.minwidth !== "undefined")
            {
                nextMinWidth = parseInt($nextPaneMeta.minwidth.replace("px", ""));
            }
            if (typeof $prevPaneMeta.minheight !== "undefined")
            {
                prevMinHeight = parseInt($prevPaneMeta.minheight.replace("px", ""));
            }
            if (typeof $nextPaneMeta.minheight !== "undefined")
            {
                nextMinHeight = parseInt($nextPaneMeta.minheight.replace("px", ""));
            }
            var containment = {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            };

            if (this.orientation === "horizontal")
            {
                containment.y1 = containment.y2 = $prevPaneOffset.top;
                containment.x1 = $prevPaneOffset.left + prevMinWidth;
                containment.x2 = $nextPaneOffset.left + $nextPane.width() - nextMinWidth;

                //                switch (jqDivMetaDivResize)
                //                {
                //                    case "before":
                //                        containment.x2 = jqDiv.offset().left;
                //                        break;
                //                    case "after":
                //                        containment.x1 = jqDiv.offset().left;
                //                        break;
                //                }

            }
            else
            {
                containment.y1 = $prevPaneOffset.top + prevMinHeight;
                containment.x1 = containment.x2 = $prevPaneOffset.left;
                containment.y2 = $nextPaneOffset.top + $nextPane.height() - nextMinHeight;
                //                switch (jqDivMetaDivResize)
                //                {
                //                    case "before":
                //                        containment.y2 = jqDiv.offset().top;
                //                        break;
                //                    case "after":
                //                        containment.y1 = jqDiv.offset().top;
                //                        break;
                //                }
            }

            return [containment.x1, containment.y1, containment.x2, containment.y2];
            //#endregion

        },

        _dragStop: function (ev, ui)
        {
            //#region
            var $this = this, div = $(ui.helper).data("divider"), prev = div.prev(".pane"), nxt = div.next(".pane"), cont = div.parent();
            var dimensionLessDiv = $(div).parent().children().filter("div[location='0']");

            var divMetaDivResize = div.metadata().divResize;

            var change = this.getOffSetPosition(div) - this.getOffSetPosition(ui.helper);
            var prevAtt = prev.attr("location");
            var nextAtt = nxt.attr("location");
            if (prevAtt === nextAtt)
            {
                if (prevAtt === "-1")
                {
                    //both before dimensionless pane

                    var nextPanes = nxt;
                    var $this = this;
                    switch (divMetaDivResize)
                    {
                        case "before":
                            nextPanes = prev.nextAll(".pane").filter("div[location!='1']");

                            //prev size-
                            var oldPrevDimension = this.getOrientationDimension(prev);
                            this.setOrientationCSSDimension(prev, oldPrevDimension - change);

                            break;
                        case "both":

                            //prev size-
                            var oldPrevDimension = this.getOrientationDimension(prev);
                            this.setOrientationCSSDimension(prev, oldPrevDimension - change);

                            //next size+
                            var oldNextDimension = this.getOrientationDimension(nxt);
                            this.setOrientationCSSDimension(nxt, oldNextDimension + change);

                            break;
                    }
                    //div begin- next begin-
                    nextPanes.each(function ()
                    {
                        var jqThis = $(this)
                        //next begin-
                        var oldDivBeginPosition = $this.getOrientationCSSBeginPosition(jqThis);
                        $this.setOrientationCSSBeginPosition(jqThis, oldDivBeginPosition - change);

                        var panePrevDiv = jqThis.prev(".divider");
                        //div begin-
                        var oldDivBeginPosition = $this.getOrientationCSSBeginPosition(panePrevDiv);
                        $this.setOrientationCSSBeginPosition(panePrevDiv, oldDivBeginPosition - change);
                    });
                }
                else
                {
                    //both after dimensionless pane
                    var prevPanes = prev;
                    var $this = this;
                    switch (divMetaDivResize)
                    {
                        case "after":
                            prevPanes = nxt.prevAll(".pane").filter("div[location!='-1']");

                            //next size+
                            var oldNextDimension = this.getOrientationDimension(nxt);
                            this.setOrientationCSSDimension(nxt, oldNextDimension + change);

                            break;
                        case "both":

                            //prev size-
                            var oldPrevDimension = this.getOrientationDimension(prev);
                            this.setOrientationCSSDimension(prev, oldPrevDimension - change);

                            //next size+
                            var oldNextDimension = this.getOrientationDimension(nxt);
                            this.setOrientationCSSDimension(nxt, oldNextDimension + change);

                            break;
                    }

                    //div end+ prev end+
                    prevPanes.each(function ()
                    {
                        var jqThis = $(this)
                        //prev end+
                        var oldPrevEndPosition = $this.getOrientationCSSEndPosition(jqThis);
                        $this.setOrientationCSSEndPosition(jqThis, oldPrevEndPosition + change);

                        var panePrevDiv = jqThis.next(".divider");
                        //div end+
                        var oldDivEndPosition = $this.getOrientationCSSEndPosition(panePrevDiv);
                        $this.setOrientationCSSEndPosition(panePrevDiv, oldDivEndPosition + change);
                    });
                }
            }
            else if (prevAtt === "0")
            {
                //dimesionless pane is prev pane

                //next size+
                var oldNextDimension = this.getOrientationDimension(nxt);
                this.setOrientationCSSDimension(nxt, oldNextDimension + change);

                //prev end+
                var oldPrevEndPosition = this.getOrientationCSSEndPosition(prev);
                this.setOrientationCSSEndPosition(prev, oldPrevEndPosition + change);

                //div end+
                var oldDivEndPosition = this.getOrientationCSSEndPosition(div);
                this.setOrientationCSSEndPosition(div, oldDivEndPosition + change);
            }
            else if (nextAtt === "0")
            {
                //dimesionless pane is next pane

                //prev size-
                var oldPrevDimension = this.getOrientationDimension(prev);
                this.setOrientationCSSDimension(prev, oldPrevDimension - change);

                //next begin-
                var oldNextBeginPosition = this.getOrientationCSSBeginPosition(nxt);
                this.setOrientationCSSBeginPosition(nxt, oldNextBeginPosition - change);

                //div begin-
                var oldDivBeginPosition = this.getOrientationCSSBeginPosition(div);
                this.setOrientationCSSBeginPosition(div, oldDivBeginPosition - change);
            }

            //TFS 720744 & 731081
            var transitionOptions = {
                parentToHandleOn: this.element,
                selectorToWaitFor: ".pane",
                onEndCallback: function ()
                {
                    $this._trigger("resize", null, {});
                    SourceCode.Forms.Designers.Common.triggerEvent("LayoutChanged");
                }
            };

            var transitionHelper = new SourceCode.Forms.TransitionHelper(transitionOptions);

            transitionHelper.handleTransition();
            //#endregion
        },

        html: function (options)
        {
            var html = "<div";

            if (options.id !== undefined && options.id !== "") html += " id=\"" + options.id + "\"";

            html += " class=\"pane-container " + (options.orientation === "horizontal" ? "horizontal" : "vertical") + "\"";

            html += ">";

            for (var i = 0, l = options.panes.length; i < l; i++)
            {
                if (i !== 0 && options.showDividers !== false)
                {

                    html += "<div class=\"divider " + (options.orientation === "horizontal" ? "vertical" : "horizontal");

                    var metaArray = {};

                    if ((options.panes[i].resizable !== undefined && options.panes[i].resizable) || (options.panes[i - 1].resizeable !== undefined && options.panes[i - 1].resizeable))
                    {
                        html += " draggable";

                        if ((options.panes[i].resizable !== undefined && options.panes[i].resizable) && (options.panes[i - 1].resizeable !== undefined && options.panes[i - 1].resizeable))
                        {
                            metaArray = {};
                            metaArray["divResize"] = "both";

                            html += "\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode();
                        }
                        else if ((options.panes[i].resizable === undefined || !options.panes[i].resizable) && (options.panes[i - 1].resizeable !== undefined && options.panes[i - 1].resizeable))
                        {
                            metaArray = {};
                            metaArray["divResize"] = "before";

                            html += "\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode();
                        }
                        else if ((options.panes[i].resizable !== undefined && options.panes[i].resizable) && (options.panes[i - 1].resizeable === undefined || !options.panes[i - 1].resizeable))
                        {
                            metaArray = {};
                            metaArray["divResize"] = "after";

                            html += "\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode();
                        }
                    }
                    else
                    {
                        metaArray = {};
                        metaArray["divResize"] = "after";

                        html += "\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode();
                    }

                    html += "\"></div>";
                }

                html += "<div";

                if (options.panes[i].id !== undefined && options.panes[i].id !== "") html += " id=\"" + options.panes[i].id + "\"";

                var m = {};
                var mLength = 0;

                if (options.orientation === "horizontal")
                {
                    if (options.panes[i].width !== undefined)
                    {
                        m["width"] = options.panes[i].width;
                        mLength++;
                    }
                    if (options.panes[i].minwidth !== undefined)
                    {
                        m["minwidth"] = options.panes[i].minwidth;
                        mLength++;
                    }
                    if (options.panes[i].maxwidth !== undefined)
                    {
                        m["maxwidth"] = options.panes[i].maxwidth;
                        mLength++;
                    }
                }
                else
                {
                    if (options.panes[i].height !== undefined)
                    {
                        m["height"] = options.panes[i].height;
                        mLength++;
                    }
                    if (options.panes[i].minheight !== undefined)
                    {
                        m["minheight"] = options.panes[i].minheight;
                        mLength++;
                    }
                    if (options.panes[i].maxheight !== undefined)
                    {
                        m["maxheight"] = options.panes[i].maxheight;
                        mLength++;
                    }
                }

                if (options.panes[i].autosize !== undefined)
                {
                    m["autosize"] = options.panes[i].autosize;
                    mLength++;
                }
                if (options.panes[i].resizable !== undefined)
                {
                    m["resizable"] = options.panes[i].resizable;
                    mLength++;
                }

                html += " class=\"pane\"";

                if (mLength > 0)
                {
                    html += " data-options=\"" + jQuery.toJSON(m).htmlEncode() + "\"";
                }

                html += "></div>";
            }

            html += "</div>";

            return html;
        },

    	//Param: hidePaneId - Id of a pane in this panecontainer
		//Param: animation - enum for animation types.
        hidePane: function (hidePaneId, animationType)
        {        	
        	//TODO: work out whether the panel is first/last/middle
        	//TODO: potentially flip the animation depending on which end the pane is on.
			//TODO: Implement other animation types
        	//switch (animationType) {
        	//	case this.AnimationTypes.slideLeft: break;
        	//	case this.AnimationTypes.slideRight: break;
        	//	case this.AnimationTypes.slideUp: break;
        	//	case this.AnimationTypes.slideDown: break;				
        	//}

        	var dockProperty = "right";

        	// Get widths and panes
        	var hidePane = this.element.find("#" + hidePaneId + ".pane");
        	var cachedWidth = hidePane.width();
        	var directChildren = hidePane.children(":visible");

			//cache the width before animating
        	hidePane.data("restore", cachedWidth);
        	hidePane.data("isHidden", true);

			//prep the panel children for sliding animation
        	directChildren.css({
        		"width": cachedWidth,
        		"position": "absolute"
			});
			directChildren.css(dockProperty, "0px");

			//get panes/dividers involved with the animation
        	var divider = hidePane.next(".divider");
        	var nextPane = divider.next(".pane");
        	var prevPane = hidePane.prev(".pane");
        	var hidePaneLeft = hidePane.position().left;

        	function afterAnimation() {
        		//console.log("pane animation finished - hide");
        	}

        	//horrible syntax for adding a one-use transition binding :(
        	//the jQuery approach was nicer
        	(new SourceCode.Forms.TransitionHelper({
        		parentToHandleOn: this.element,
        		selectorToWaitFor: "#" + hidePaneId,
        		onEndCallback: afterAnimation
        	})).handleTransition();

        	//kick off the animation
        	//Note: the divider must animate completely away, as it is not meant to be draggable when the panel is hidden.
        	hidePane.width("0");
        	if (divider.length > 0) divider.css("left", hidePaneLeft - divider.width());
        	if (nextPane.length > 0) nextPane.css("left", hidePaneLeft );
        	
        },

    	//Param: hidePaneId - ID of a pane in this panecontainer
    	//Param: animation - enum for animation types.
        showPane: function (hidePaneId, animationType)
        {
        	var dockProperty = "right";

        	// Get widths and panes
        	var hidePane = this.element.find("#" + hidePaneId + ".pane");
        	var cachedWidth = hidePane.data("restore");
        	var directChildren = hidePane.children(":visible");

        	hidePane.data("isHidden", false);

        	//get panes/dividers involved with the animation
        	var divider = hidePane.next(".divider");
        	var nextPane = divider.next(".pane");
        	var prevPane = hidePane.prev(".pane");
        	var hidePaneLeft = hidePane.position().left;

        	function afterAnimation() {
        		//undo any changes to the children made before the animation
        		directChildren.css({
        			"width": "",
        			"position": ""
        		});
				directChildren.css(dockProperty, "");
        	}

        	//horrible syntax for adding a one-use transition binding :(
			//the jQuery approach was nicer
        	(new SourceCode.Forms.TransitionHelper({
        		parentToHandleOn: this.element,
        		selectorToWaitFor: "#" + hidePaneId,
        		onEndCallback: afterAnimation
        	})).handleTransition();

        	//kick off the animation
        	hidePane.width(cachedWidth);
        	if (divider.length > 0) divider.css("left", cachedWidth );
        	if (nextPane.length > 0) nextPane.css("left", cachedWidth + divider.width());

        },

        refresh: function ()
        {
            this._initPanes();
        }
    }

    if (typeof SCPaneContainer === "undefined") SCPaneContainer = SourceCode.Forms.Controls.PaneContainer;

    $.widget("ui.panecontainer", SourceCode.Forms.Controls.PaneContainer);

    $.extend($.ui.panecontainer.prototype, {
        options: {}
    });

    $(function ()
    {
        $(".pane-container").panecontainer();
    });

})(jQuery);
