(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null)
    {
        SourceCode = {};
    }
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null)
    {
        SourceCode.Forms = {};
    }
    if (typeof SourceCode.Forms.Utilities === "undefined" || SourceCode.Forms.Utilities === null)
    {
        SourceCode.Forms.Utilities = {};
    }

    var modaliserPixelOverlap = 3;

    var modalizers = {};

    function modalizerAutoResize()
    {
    }

    modalizerAutoResize.prototype =
        {
            timeoutId: 0,

            checkSize: function ()
            {
                window.clearTimeout(this.timeoutId);
                var documentWidth = null;
                var documentHeight = null;

                var sizeChanged = false;

                for (var id in modalizers)
                {
                    var currentModal = modalizers[id];
                    if (checkExists(currentModal) && currentModal.options.autoResize === true)
                    {
                        if (currentModal.options.isJqueryExtension)
                        {
                            var calculations = doCalculations(currentModal);
                            //transfer calculations options into main options
                            for (var property in calculations)
                            {
                                if (currentModal[property] !== calculations[property])
                                {
                                    sizeChanged = true;
                                    currentModal[property] = calculations[property];
                                }
                            }
                            if (sizeChanged)
                            {
                                //apply changes
                                var nativeStyle = currentModal.element[0].style;
                                nativeStyle.left = currentModal.left + "px";
                                nativeStyle.top = currentModal.top + "px";
                                nativeStyle.width = currentModal.width + "px";
                                nativeStyle.height = currentModal.height + "px";
                            }
                        }
                        else
                        {
                            if (!checkExists(documentWidth) || !checkExists(documentHeight))
                            {
                                var jqDoc = $(document);
                                documentWidth = jqDoc.width();
                                documentHeight = jqDoc.height();
                            }
                            if (!checkExists(currentModal.width) || !checkExists(currentModal.height))
                            {
                                //this item has not been examined before set its old values
                                currentModal.height = documentHeight;
                                currentModal.width = documentWidth;
                                sizeChanged = false;
                            }
                            else
                            {
                                if (currentModal.width !== documentWidth || currentModal.height !== documentHeight)
                                {
                                    sizeChanged = true;
                                    currentModal.width = documentWidth;
                                    currentModal.height = documentHeight;
                                }
                            }
                        }

                    }
                }
                if (sizeChanged)
                {
                    RunModalVisibilityCalculator(modalizers);
                }
                var currentThis = this;
                this.timeoutId = window.setTimeout(
                    function ()
                    {
                        currentThis.checkSize();
                    }, 200);

                return sizeChanged;
            },

            beginMonitor: function ()
            {
                this.monitorStarted = true;
                var result =
                    {
                        visibilityRun: this.checkSize()
                    };
                return result;
            },

            tryEndMonitor: function ()
            {
                if (this.monitorStarted === true)
                {
                    for (var i = 0, ml = modalizers.length; i < ml; i++)
                    {
                        var currentModal = modalizers[i];
                        if (checkExists(currentModal) && currentModal.options.autoResize === true)
                        {
                            return false;
                        }
                    }
                    window.clearTimeout(this.timeoutId);
                }
                return true;
            }
        };

    var modalizerAutoResizer = new modalizerAutoResize();

    // function to calculate which modals should be shown when they overlap each other
    function RunModalVisibilityCalculator(modalizers)
    {
        var areas = [];
        var maxArea = [];
        var currentArea = null;
        var currentModal = null;
        var areasLength = 0;
        var subAreasLength = 0;
        var found = false;
        var documentWidth = null;
        var documentHeight = null;

        for (var id in modalizers)
        {
            currentModal = modalizers[id];
            if (checkExists(currentModal) && (!checkExists(currentModal.options) || !checkExists(currentModal.options.excludeFromVisibilityCalculations) || currentModal.options.excludeFromVisibilityCalculations === false))
            {
                if (!currentModal.isJqueryExtension && !checkExists(currentModal.width) || !checkExists(currentModal.height))
                {
                    if (!checkExists(documentWidth) || !checkExists(documentHeight))
                    {
                        var jqDoc = $(document);
                        documentWidth = jqDoc.width();
                        documentHeight = jqDoc.height();
                    }
                    //this item has not been examined before set its old values
                    currentModal.height = documentHeight;
                    currentModal.width = documentWidth;
                }
                areasLength = areas.length;
                found = false;

                while (areasLength--)
                {
                    subAreasLength = areas[areasLength].length;

                    while (subAreasLength--)
                    {
                        var subArea = areas[areasLength][subAreasLength];

                        // currentModal.left < subArea.left +  subArea.width
                        // 0 < subArea.left +  subArea.width - currentModal.left
                        // change zero to 2 if the result is within 2 pixels the items are not considered overlapping
                        if (modaliserPixelOverlap < subArea.left + subArea.width - currentModal.left &&
                            modaliserPixelOverlap < currentModal.left + currentModal.width - subArea.left &&
                            modaliserPixelOverlap < subArea.top + subArea.height - currentModal.top &&
                            modaliserPixelOverlap < currentModal.top + currentModal.height - subArea.top)
                        {
                            areas[areasLength].push(currentModal);
                            currentArea = (currentModal.width) * (currentModal.height);
                            if (maxArea[areasLength].area < currentArea)
                            {
                                maxArea[areasLength].area = currentArea;
                                maxArea[areasLength].modalIndex = areas[areasLength].length - 1;
                            }
                            found = true;
                            break;
                        }
                    }

                }
                if (!found)
                {
                    areas.push([currentModal]);
                    currentArea = (currentModal.width) * (currentModal.height);
                    maxArea.push({ area: currentArea, modalIndex: 0 });
                }
            }
        }

        areasLength = areas.length;
        while (areasLength--)
        {
            var currentMaxArea = maxArea[areasLength];
            currentArea = areas[areasLength];
            subAreasLength = currentArea.length;
            while (subAreasLength--)
            {
                currentModal = currentArea[subAreasLength];
                var hidden = (subAreasLength !== currentMaxArea.modalIndex);
                currentModal.element.toggleClass("hidden", hidden);
            }
        }
    }

    //[Constructor]
    function Modalizer()
    {
    }

    //[Functions]
    Modalizer.prototype =
        {
            //show
            show: function (pShowBusy, pTargetFrame, id, fixedPosition, autoResize, extendedOptions)
            {
                if (!SourceCode.Forms.Layout.isRuntime()) 
                {
                	//items with a higher z index than the modal must be hidden to prevent bleeding through
                	if (checkExists(SourceCode.Forms.Designers) && checkExists(SourceCode.Forms.Designers.Common) && checkExists(SourceCode.Forms.Designers.Common.Context))
                	{
                		SourceCode.Forms.Designers.Common.Context.toggleCanvasAdornments(false);
                	}
                    
                }

                var _element = this.element;
                var _document;
                var positionClass = (checkExists(fixedPosition) && fixedPosition === true) ? "base2" : "base0";

                if (checkExists(pTargetFrame) && typeof pTargetFrame === "string" && checkExists(frames[pTargetFrame]))
                {
                    _document = frames[pTargetFrame];
                    _document = _document.document;
                }
                else
                {
                    _document = document;
                }

                if (!checkExists(_element) || checkExists(id))
                {
                    _element = _document.createElement("div");

                    if (!checkExists(id))
                    {
                        id = ''.generateGuid();
                        this.element = _element;
                    }
                    _element.setAttribute("id", id);

                }
                if (!checkExists(id))
                {
                    id = _element.id;
                }

                if (checkExists(_element))
                {
                    _element.className = positionClass + " base1 modalizer modal-element";
                }

                var _ajaxLoader = this.ajaxLoader;

                if (typeof pShowBusy === typeof true && pShowBusy === true)
                {
                    if (!checkExists(_ajaxLoader))
                    {
                        _ajaxLoader = this.ajaxLoader = _document.createElement("div");
                        _ajaxLoader.className = positionClass + " base1 ajaxLoader modal-element";

                        _element.appendChild(_ajaxLoader);
                    }

                    _ajaxLoader.style.display = "block";
                }
                else if (checkExists(_ajaxLoader))
                {
                    _ajaxLoader.style.display = "none";
                }

                var _parentNode = _element.parentNode;

                if (!checkExists(_parentNode) || _parentNode !== _document.body)
                {
                    _document.body.appendChild(_element);
                }

                var modalizer = modalizers[id] =
                    {
                        left: 0,
                        top: 0,
                        element: $(_element),
                        options:
                        {
                            targetFrame: null,
                            id: id,
                            offset: null,
                            type: null,
                            fixedPosition: fixedPosition,
                            autoResize: autoResize,
                            isJqueryExtension: false
                        }
                    };
                for (property in extendedOptions)
                {
                    modalizer.options[property] = extendedOptions[property];
                }

                var visibilityRun = false;
                if (autoResize)
                {
                    var result = modalizerAutoResizer.beginMonitor();
                    visibilityRun = result.visibilityRun;
                }
                if (!visibilityRun)
                {
                    RunModalVisibilityCalculator(modalizers);
                }

                this._applyExtendedOptions(_element, extendedOptions);

                return this;
            },

            //hide
            hide: function (id)
            {
                if (!SourceCode.Forms.Layout.isRuntime())
                {
                    //items with a higher z index than the modal can now be shown again
                	if (checkExists(SourceCode.Forms.Designers) && checkExists(SourceCode.Forms.Designers.Common) && checkExists(SourceCode.Forms.Designers.Common.Context))
                	{
                		SourceCode.Forms.Designers.Common.Context.toggleCanvasAdornments(true);
                	}
                }
                var _element;

                if (checkExists(id))
                {
                    _element = document.getElementById(id);
                }
                else
                {
                    _element = this.element;
                    if (checkExists(_element))
                    {
                        id = _element.id;
                    }
                }

                if (checkExists(_element))
                {
                    var _parentNodeToHide = _element.parentNode;
                    if (checkExists(_parentNodeToHide))
                    {
                        _parentNodeToHide.removeChild(_element);
                        var autoResize = null;

                        if (checkExists(modalizers[id]))
                        {
                            autoResize = modalizers[id].autoResize;
                        }

                        modalizers[id] = null;
                        delete modalizers[id];

                        if (autoResize)
                        {
                            modalizerAutoResizer.tryEndMonitor();
                        }

                        RunModalVisibilityCalculator(modalizers);
                    }
                }

                return this;
            },

            _applyExtendedOptions: function (element, extendedOptions)
            {
                if (checkExists(element) && checkExists(extendedOptions))
                {
                    // Opacity.
                    if (typeof extendedOptions.opacity === "number")
                    {
                        jQuery(element).css("opacity", extendedOptions.opacity);
                    }
                    else
                    {
                        // Reset the opacity if previously set.
                        jQuery(element).css("opacity", "");
                    }
                }
            }
        };

    //[Fields]

    //global
    window.modalizer = new Modalizer();
    window.runtimeModalizer = new Modalizer();
    SourceCode.Forms.Utilities.RunModalVisibilityCalculator = RunModalVisibilityCalculator;

    //jquery extensions
    function doCalculations(modal)
    {
        //http://blogs.msdn.com/b/ie/archive/2012/02/17/sub-pixel-rendering-and-the-css-object-model.aspx
        //the option below allows the measurements to be calculated accurately in ie10 standards mode
        document.msCSSOMElementFloatMetrics = true;
        var element = modal.modalisedElement;
        var calculations =
            {
                left: 0,
                top: 0,
                width: element.outerWidth(),
                height: element.outerHeight(),
                calculatePosition: true
            };
        if (!modal.options.offset)
        {
            calculations.left = 0;
            calculations.top = 0;
            if (modal.options.addToElement)//runtime workflow view modalizer
            {
                calculations.calculatePosition = false;
            }
            else if (!modal.options.overrideAbsolute && element.css("position") === "absolute")
            {
                calculations.calculatePosition = false;
            }
        }
        else
        {
            calculations.left = modal.options.offset;
            calculations.top = modal.options.offset;

            var calculatedOffset = modal.options.offset * 2;

            calculations.width = calculations.width - calculatedOffset;
            calculations.height = calculations.height - calculatedOffset;
        }

        if (calculations.calculatePosition)
        {
            var offset = element.offset();

            calculations.left += offset.left;
            calculations.top += offset.top;

            //IE 10 specific calculations to ensure the element is overlayed fully
            //rather extend the overlay by one pixel than show the element by one pixel
            var floorLeft = Math.floor(calculations.left);
            var diffLeft = calculations.left - floorLeft;
            if (diffLeft !== 0)
            {
                calculations.left = floorLeft;
                calculations.width = calculations.width + 1 + Math.round(diffLeft);
            }
            var floorTop = Math.floor(calculations.top);
            var diffTop = calculations.top - floorTop;
            if (diffTop !== 0)
            {
                calculations.top = floorTop;
                calculations.height = calculations.height + 1 + Math.round(diffTop);
            }
        }
        if (element[0].offsetWidth === 0)
        {
            calculations.width = 0;
        }
        if (element[0].offsetHeight === 0)
        {
            calculations.height = 0;
        }
        document.msCSSOMElementFloatMetrics = false;
        return calculations;
    }
    //modalize
    jQuery.fn.modalize = function (pModalize, pOffset, pType, fixedPosition, autoResize, extendedOptions)
    {
        var positionClass = (checkExists(fixedPosition) && fixedPosition === true) ? "base2" : "base0";
        if (!extendedOptions)
        {
            extendedOptions = {};
        }

        for (var ti = 0; ti < this.length; ti++)
        {
            if (typeof pModalize === typeof false && (pOffset === null || typeof pOffset === typeof 0))
            {
                var $this = jQuery(this[ti]);

                var _id = $this.data("modalizerId");
                if (!checkExists(_id))
                {
                    _id = "".generateGuid();
                    $this.data("modalizerId", _id);
                }

                pType = pType || ["modalizer"];
                if (typeof pType === "String")
                {
                    pType = [pType];
                }

                var calculations = null;
                var pTypeLength = pType.length;
                var modalizerId = null;
                var parentModalizer = null;
                var property = null;
                var i = pTypeLength;
                while (i--)
                {
                    if (i === pTypeLength - 1)
                    {
                        //the last modal will be the parent we need to track
                        modalizerId = _id + '_' + pType[i];
                        parentModalizer = $(document.getElementById(modalizerId));

                    }
                    var modalizer = modalizers[_id];

                    if (pModalize)
                    {
                        //we need show the modal
                        if (parentModalizer.length === 0)
                        {
                            if (!modalizer)
                            {
                                modalizer =
                                    {
                                        element: null,
                                        modalisedElement: $this,
                                        options:
                                        {
                                            targetFrame: null,
                                            id: modalizerId,
                                            offset: pOffset,
                                            type: pType,
                                            fixedPosition: fixedPosition,
                                            autoResize: autoResize,
                                            isJqueryExtension: true
                                        }

                                    };
                                //transfer extended options into main options
                                for (property in extendedOptions)
                                {
                                    modalizer.options[property] = extendedOptions[property];
                                }
                                modalizers[_id] = modalizer;
                            }
                            calculations = doCalculations(modalizer);

                            //transfer calculations options into main options
                            for (property in calculations)
                            {
                                modalizer[property] = calculations[property];
                            }

                            parentModalizer = jQuery("<div id=\"" + modalizerId + "\" class=\"" + positionClass + " " + pType[i] + " modal-element\"></div>").css({
                                "left": calculations.left + "px",
                                "top": calculations.top + "px",
                                "width": calculations.width + "px",
                                "height": calculations.height + "px"
                            }).appendTo(calculations.calculatePosition ? document.body : $this);



                            modalizer.element = parentModalizer;
                            var visibilityRun = false;
                            if (autoResize)
                            {
                                var result = modalizerAutoResizer.beginMonitor();
                                visibilityRun = result.visibilityRun;
                            }
                            if (!visibilityRun)
                            {
                                RunModalVisibilityCalculator(modalizers);
                            }
                        }
                        else
                        {
                            var styleText = "";
                            if (modalizer.options.innerPositions && modalizer.options.innerPositions.length)
                            {
                                var pos = modalizer.options.innerPositions.pop();
                                styleText = " style='";
                                for (var style in pos)
                                {
                                    styleText += style + ":" + pos[style];
                                }
                                styleText += "'";
                            }
                            parentModalizer.append("<div class=\"" + pType[i] + " inner-modal\"" + styleText + "></div>");
                        }
                    }
                    else if (parentModalizer.length !== 0)
                    {
                        //we need to hide the modal
                        modalizers[_id] = null;
                        delete modalizers[_id];
                        $this.data("modalizerId", null);

                        modalizerAutoResizer.tryEndMonitor();
                        parentModalizer.remove();

                        RunModalVisibilityCalculator(modalizers);
                        //return as there is no need to remove children
                        break;
                    }
                }
            }
        }

        return this;
    };

    //showBusy
    jQuery.fn.showBusy = function (showBusy, fixedPosition, autoResize)
    {
        return this.modalize(showBusy, 0, ['ajaxLoader'], fixedPosition, autoResize);
    };

    //show or hide Busy and modal in one step
    jQuery.fn.showBusyModal = function (showBusy, fixedPosition, autoResize)
    {
        return this.modalize(showBusy, 0, ['ajaxLoader', 'modalizer'], fixedPosition, autoResize);
    };

    //show or hide Busy and modal in one step with specific options generic for controls
    jQuery.fn.showControlBusyModal = function (showBusy, extendedOptions)
    {
        extendedOptions = $.extend({ overrideAbsolute: true, innerPositions: [{ right: '3px' }] }, extendedOptions);
        return this.modalize(showBusy, 0, ['control-loading', 'modalizer'], false, true, extendedOptions);
    };

    //show or hide modal with specific options generic for controls
    jQuery.fn.showControlModal = function (showBusy, extendedOptions)
    {
        extendedOptions = $.extend({ overrideAbsolute: true }, extendedOptions);
        return this.modalize(showBusy, 0, ['modalizer'], false, true, extendedOptions);
    };

    //function to update an existing modal
    //can be extended but only supports the innerPosition modification at the moment
    jQuery.fn.updateControlModal = function (options)
    {
        var modalizerId = this.data("modalizerId");
        if (typeof modalizerId === "string")
        {
            var modalElement = $(document.getElementById(modalizerId));
            if (modalElement.length !== 0)
            {
                if (options.innerPositions && options.innerPositions.length)
                {
                    var pl = options.innerPositions.length;
                    var children = modalElement.children();
                    while (pl--)
                    {
                        var child = children.pop();
                        var pos = options.innerPositions.pop();
                        if (checkExists(pos) && checkExists(child) && child.length > 0)
                        {
                            var nativeStyle = child.style;
                            for (var style in pos)
                            {
                                nativeStyle[style] = pos[style];
                            }
                        }
                    }
                }
            }
        }
    };

})(jQuery);
