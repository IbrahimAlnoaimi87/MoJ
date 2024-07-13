(function ($)
{
    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};

    var _rules = SourceCode.Forms.Designers.Rule = {
        busyLoading: false,
        doAutoLoadWhileLoading: false,
        isHiddenDesigner: false,
        ruleNameIsCustom: false,

        //if el(ement) not visible in viewport, scroll to it, check verticle bounds only.
        _scrollTo: function (el)
        {
            var viewport = $("#RulePanelbox .panel-body-wrapper .scroll-wrapper");
            if (!checkExists(viewport) || viewport.length === 0)
            {
                return;
            }
            var elRect = el[0].getBoundingClientRect();
            var vpRect = viewport[0].getBoundingClientRect();
            var elemVisibleTop = (elRect.top >= vpRect.top);
            var elemVisibleBottom = (elRect.bottom <= vpRect.bottom);
            var elHeightGreaterThanViewport = el.height() > viewport.height();

            if (!(elemVisibleTop && elemVisibleBottom))
            {
                var currOffset = $(viewport).scrollTop();
                if ((!elemVisibleTop) || (elHeightGreaterThanViewport && !elemVisibleBottom))//scroll up || place el as first visible element in list
                {
                    $(viewport).scrollTop(currOffset - (vpRect.top - elRect.top));
                }
                else //scroll down
                {
                    $(viewport).scrollTop(currOffset + (elRect.bottom - vpRect.bottom));
                }
            }
        },

        _addRuleDefinitionItem: function (itemID, ruleArea, ruleXml, isCurrentHandler, itemIsEnabled, context, defaultValues, typeClass, ignoreEventDuplicateCheck, handlerToAddTo, appendAfter, insertBefore)
        {
            var jq_ruleArea = jQuery("#" + ruleArea); // Getting Area in Rule Definition

            var currentlySelectedRuleItem = jQuery("#RulePanelbox").find("li.condition.selected, li.action.selected");
            var currentlySelectedHandler = jQuery("#RulePanelbox").find("ul.rulesUl.handler:not(.prefix).selected");
            var currentlySelectedExecutionGroup = jQuery("#RulePanelbox").find("li.action.prefix.selected");
            var currentSelectedRuleItemType = null;
            var appendAfterItemType = null;
            var insertBeforeItemType = null;
            var currentlySelectedRuleItemIsReference = currentlySelectedRuleItem.hasClass("inactive");
            var handlerUl;
            var handlerUlType;
            var newHandlerId;
            var mainRWToolbarWrapper = jQuery("#rwBottomPaneToolbar");

            if (currentlySelectedRuleItem.length > 0 || currentlySelectedHandler.length > 0)
            {
                handlerUl = _rules._getCurrentHandler(currentlySelectedRuleItem);
                if (currentlySelectedRuleItem.hasClass("condition"))
                {
                    currentSelectedRuleItemType = "condition";
                }
                else if (currentlySelectedRuleItem.hasClass("action"))
                {
                    currentSelectedRuleItemType = "action";
                }
                else
                {
                    currentSelectedRuleItemType = "handler";
                    handlerUl = currentlySelectedHandler;
                }
                handlerUlType = _rules._getHandlerType(handlerUl, true);
            }

            var jq_ListItem, listItemId;

            // Appending selected item to Rule Definition Area
            if (typeClass === "handler")
            {
                // TD 0072
                var handlerName = ruleXml.getAttribute("Name");//or DefaultHandlerName?
                if (handlerName === null)
                {
                    handlerName = "IfLogicalHandler";
                }
                handlerUl = _rules._addHandler(handlerName, null, false, "true", "false", null, context, handlerUl, ruleXml, isCurrentHandler, defaultValues);
                newHandlerId = handlerUl.attr("id");
                _rules._setHandlerMobilitySettings(handlerUl, mainRWToolbarWrapper);
            }
            else
            {
                var ruleDescription = ruleXml.selectSingleNode("Description"); // Getting Rule Description
                var defaultHandlerName = ruleXml.getAttribute("DefaultHandlerName"); //If required to add a new handler, add of this type
                ruleDescription = checkExists(ruleDescription) ? ruleDescription.text : "";
                var rulePartsXml = ruleXml.selectNodes("Parts/Part");
                var guid = String.generateGuid(); // Main div id
                var jq_ruleDiv = jQuery("<div id='" + guid + "' style='display:inline;'></div>");
                var spanArray = [];
                var partArray = [];
                jq_ListItem = jQuery("<li></li>");
                var mainDivWrapper = jQuery("<div class='rule-item-wrapper'></div>");
                listItemId = "rule_li_" + String.generateGuid();
                var jq_disableChkbox;
                var toolbarWrapper = jQuery("#rwBottomPaneToolbar");
                var nextItemsCollection, newAddedHandler;

                jq_ListItem.attr("id", listItemId);
                jq_ListItem.addClass(typeClass);
                jq_ListItem.data("eventIsCurrentHandler", isCurrentHandler.toLowerCase());

                if (isCurrentHandler !== 'true') { jq_ListItem.addClass('inactive'); }

                var jq_ImageWrapper = _rules._createToolbarImageWrapper((ruleArea !== 'ruleDefinitionRulesArea'), itemIsEnabled);

                if (ruleArea !== 'ruleDefinitionRulesArea')
                {
                    if (itemIsEnabled === false) { jq_ListItem.addClass('disabled'); }
                    jq_ListItem.addClass(context + '-context');
                }

                jq_ListItem.data("xml", ruleXml);     // Attaching xml data to element
                jq_ListItem.data("name", itemID);


                for (var p = 0; p < rulePartsXml.length; p++)
                {
                    var partID = "rule_part_" + String.generateGuid();  // Part id
                    var jq_Part = jQuery("<a href='javascript:void(0);' id='" + partID + "'>" + rulePartsXml[p].selectSingleNode("Display").text + "</a>");
                    var partName = rulePartsXml[p].getAttribute("Name");
                    var partHidden = rulePartsXml[p].getAttribute("Hidden");

                    jq_Part.data("xml", rulePartsXml[p]);
                    jq_Part.data("name", partName);
                    jq_Part.data("loadPart", rulePartsXml[p].getAttribute("LoadPart"));

                    if (partHidden === "True")
                    {
                        jq_Part.hide();
                    }

                    partArray[p] = jq_Part;
                    spanArray[p] = "<span id='span" + partID + "' name='" + partName + "' Hidden='" + partHidden + "'></span>";
                }

                ruleDescription = ruleDescription.format(spanArray);
                ruleDescription = ruleDescription.replace(/> /gi, ">&nbsp;");

                if (rulePartsXml.length !== 0)
                {
                    jq_ruleDiv.html(ruleDescription);
                }
                else
                {
                    jq_ruleDiv.text(ruleDescription.toString());
                }

                jq_ListItem.append(mainDivWrapper);
                mainDivWrapper = mainDivWrapper.eq(0);
                mainDivWrapper.prepend(jq_ruleDiv);

                if (typeClass === "condition")
                {
                    var handlerType = ruleXml.getAttribute("HandlerType");

                    if (checkExistsNotEmpty(handlerType))
                    {
                        jq_ListItem.addClass(handlerType);
                    }
                    else
                    {
                        jq_ListItem.addClass("If");
                    }

                    /*
                    if handlerToAddTo exists, add item to it else
                        if nothing selected
                            if lastHandler does not contain actions-> append to lastHandler
                            else -> create new "If" handler
                        else user selected action/condition/handler
                            if selectedItemType === "Action"
                                    -> find last condition in selectedItemParentHandler and append new condition after last condition
                            if selecteItemType === "Condition"
                                -> find last condition in selectedItemParentHandler and append new after last condition
                            if selectedItemType === "Handler"
                                -> find last condition in selectedHandler and append new condition after last condition
                    */
                    if (checkExists(handlerToAddTo))
                    {
                        handlerToAddTo.append(jq_ListItem);
                    }
                    else if (appendAfter)
                    {
                        appendAfterItemType = _rules._getCurrentItemType(appendAfter);
                        handlerUl = appendAfter.closest(".rulesUl.handler");
                        switch (appendAfterItemType)
                        {
                            case "Action":
                                if (handlerUl.hasClass("inactive"))
                                {
                                    newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, null, appendAfter, null);
                                    newAddedHandler.append(jq_ListItem);
                                }
                                else
                                {
                                    if (handlerUl.find(">.condition").length === 0)
                                    {
                                        nextItemsCollection = appendAfter.nextAll();

                                        newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, null, handlerUl, null);
                                        newAddedHandler.append(jq_ListItem);

                                        newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, null, newAddedHandler, null);
                                        newAddedHandler.append(nextItemsCollection);
                                    }
                                    else
                                    {
                                        newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, null, appendAfter, null);
                                        newAddedHandler.append(jq_ListItem);
                                    }
                                }

                                break;
                            case "HandlerAction":
                            case "Handler":
                                newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, null, appendAfter, null);
                                newAddedHandler.append(jq_ListItem);

                                break;
                            case "Condition":
                                var appendAfterHandlerType = _rules._getHandlerType(appendAfter.closest(".rulesUl.handler"));
                                //if (appendAfterHandlerType === handlerType)
                                //{
                                appendAfter.after(jq_ListItem);
                                //}
                                break;
                        }
                    }
                    else if (insertBefore)
                    {
                        insertBeforeItemType = _rules._getCurrentItemType(insertBefore);
                        handlerUl = _rules._getCurrentHandler(insertBefore);

                        switch (insertBeforeItemType)
                        {
                            case "Action":
                                if (handlerUl.hasClass("inactive"))
                                {
                                    newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, insertBefore, null, null);
                                    newAddedHandler.append(jq_ListItem);
                                }
                                else
                                {
                                    _rules._removeItemPrefixes(handlerUl);
                                    var previousItem = insertBefore.prev(".action, .handler-action, .condition");
                                    var previousItemType = _rules._getCurrentItemType(previousItem);

                                    if (previousItemType.length === 0)
                                    {
                                        handlerUl.find(">.condition-specifier").after(jq_ListItem);
                                    }
                                    else if (previousItemType === "Condition")
                                    {
                                        previousItem.after(jq_ListItem);
                                    }
                                    else if (previousItemType === "HandlerAction")
                                    {
                                        newAddedHandler = _rules._addHandler(defaultHandlerName, null, true,
                                            "true", "false", null, context, null, null, null, previousItem);

                                        newAddedHandler.append(jq_ListItem);
                                    }
                                    else
                                    {
                                        newAddedHandler = _rules._addHandler(defaultHandlerName, null, true,
                                            "true", "false", null, context, null, insertBefore, null, null);

                                        newAddedHandler.append(jq_ListItem);
                                    }
                                }
                                break;
                            case "HandlerAction":
                            case "Handler":
                                newAddedHandler = _rules._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, insertBefore, null, null);
                                newAddedHandler.append(jq_ListItem);
                                break;
                            case "Condition":
                                var insertBeforeHandlerType = _rules._getHandlerType(insertBefore.closest(".rulesUl.handler"));
                                if (insertBeforeHandlerType === handlerType)
                                {
                                    insertBefore.before(jq_ListItem);
                                }
                                break;
                        }
                    }
                    else
                    {
                        switch (currentSelectedRuleItemType)
                        {
                            case "action":
                                if (nestedHandlersFeatureEnabled)
                                {
                                    if (_rules._isRootItem(currentlySelectedRuleItem)
                                        && handlerUl.find(">li.condition").length === 0
                                        && !currentlySelectedRuleItem.prev().hasClass("action"))
                                    {
                                        handlerUl.find(">.rule-item-wrapper").after(jq_ListItem);
                                    }
                                    else
                                    {
                                        if (!currentlySelectedRuleItemIsReference)
                                        {
                                            newAddedHandler =
                                                _rules._addHandler(defaultHandlerName,
                                                    null, true, "true", "false", null,
                                                    context, null, currentlySelectedRuleItem,
                                                    null, null);

                                            newAddedHandler.append(jq_ListItem);
                                            newAddedHandler.append(currentlySelectedRuleItem);
                                        }
                                        else
                                        {
                                            newAddedHandler =
                                                _rules._addHandler(defaultHandlerName,
                                                    null, isCurrentHandler, itemIsEnabled,
                                                    "false", null, context, null, null,
                                                    handlerUl, null);
                                            newAddedHandler.append(jq_ListItem);
                                        }
                                        // force clean on parent handler
                                        handlerUl.addClass("dirty");
                                    }
                                }
                                else
                                {
                                    if (handlerUl.find(">li.condition").length === 0)
                                    {
                                        handlerUl.find(">.condition-specifier").after(jq_ListItem);
                                    }
                                    else
                                    {
                                        var lastCondition = handlerUl.find("li.condition:not(.prefix)").last();
                                        lastCondition.after(jq_ListItem);
                                    }
                                }
                                break;

                            case "condition":
                                currentlySelectedRuleItem.after(jq_ListItem);
                                break;

                            case "handler":
                                var lastHandlerCondition = currentlySelectedHandler.find("li.condition").last();
                                if (lastHandlerCondition.length > 0)
                                {
                                    lastHandlerCondition.after(jq_ListItem);
                                }
                                else
                                {
                                    handlerUl.find(">.condition-specifier").after(jq_ListItem);
                                }
                                break;

                            default:
                                handlerUl = jQuery('#RulePanelbox .handler:last-child');
                                if (handlerUl.length === 0 || handlerUl.find("li.action:not(.prefix)").length !== 0)
                                {
                                    handlerUl = _rules._addHandler(defaultHandlerName, null, isCurrentHandler, itemIsEnabled,
                                        "false", null, context, null, null, null, null);

                                }
                                handlerUlType = _rules._getHandlerType(handlerUl);
                                handlerUl.append(jq_ListItem);
                                break;
                        }
                    }
                }
                else if (typeClass === "action")
                {
                    if (checkExists(handlerToAddTo))
                    {
                        handlerToAddTo.append(jq_ListItem);
                    }
                    else if (appendAfter)
                    {
                        appendAfterItemType = _rules._getCurrentItemType(appendAfter);

                        switch (appendAfterItemType)
                        {
                            case "Action":
                            case "HandlerAction":
                            case "Condition":
                                appendAfter.after(jq_ListItem);
                                break;
                            case "Handler":
                                if (_rules._getHandlerType(appendAfter, true) === "Always")
                                {
                                    appendAfter.append(jq_ListItem);
                                }
                                else
                                {
                                    newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, null, appendAfter, null);
                                    newAddedHandler.append(jq_ListItem);
                                }
                                break;
                        }
                    }
                    else if (insertBefore)
                    {
                        insertBeforeItemType = _rules._getCurrentItemType(insertBefore);

                        switch (insertBeforeItemType)
                        {
                            case "Action":
                            case "HandlerAction":
                                insertBefore.before(jq_ListItem);
                                break;
                            case "Handler":
                                if (_rules._getHandlerType(insertBefore, true) === "Always")
                                {
                                    _rules._prependItemToHandler(jq_ListItem, insertBefore);
                                }
                                else
                                {
                                    newAddedHandler = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, true, "true", "false", null, context, null, insertBefore, null, null);
                                    newAddedHandler.append(jq_ListItem);
                                }
                                break;
                        }
                    }
                    else
                    {
                        switch (currentSelectedRuleItemType)
                        {
                            case "action":
                                currentlySelectedRuleItem.after(jq_ListItem);
                                break;
                            case "condition":
                                var firstActionLi = handlerUl.find("li:not(.condition)").first();
                                if (firstActionLi.length > 0)
                                {
                                    firstActionLi.before(jq_ListItem);
                                }
                                else
                                {
                                    if (handlerUl.length > 0)
                                    {
                                        handlerUl.append(jq_ListItem);
                                    }
                                }
                                break;
                            case "handler":
                                currentlySelectedHandler.append(jq_ListItem);
                                break;
                            default:
                                handlerUl = jQuery('#RulePanelbox .handler:not(.rulesImageWrapper)').last();
                                if (handlerUl.length === 0)
                                {
                                    handlerUl = SourceCode.Forms.Designers.Rule._addHandler(defaultHandlerName, null, isCurrentHandler, itemIsEnabled, "false", null, context, null, null, null, null);
                                }
                                handlerUl.append(jq_ListItem);
                                break;
                        }
                    }
                }
                else
                {
                    jq_ruleArea.children().remove();
                    //insert Event
                    var eventHidden = ruleXml.getAttribute("Hidden");
                    if (eventHidden && eventHidden === "True")
                    {
                        jq_ListItem.hide();
                    }
                    jq_ruleArea.append(jq_ListItem);
                }

                _rules._processPartsArray(partArray, isCurrentHandler, mainDivWrapper, ruleXml, defaultValues);

                if (isCurrentHandler === "true")
                {
                    // Popup remove toolbar button //
                    var jq_DivRemove = jq_ImageWrapper.find('a.toolbar-button.delete');

                    jq_DivRemove.data("containerControlID", listItemId);
                    jq_DivRemove[0].title = Resources.RuleDesigner.lrRemove;

                    jq_DivRemove.on("click", function (event) { _rules._removeRuleDefinitionItem(event, jq_ListItem); });
                    // Popup remove toolbar button //
                }

                mainDivWrapper.append(jq_ImageWrapper);

                // addcomments div
                var jq_DivComment = jq_ImageWrapper.find('a.toolbar-button.comment');
                jq_DivComment[0].title = Resources.Designers.CommentText;

                var jq_commentsDiv = jQuery("<div class='comments'></div>");
                jq_commentsDiv[0].title = Resources.Designers.CommentText;
                mainDivWrapper.append(jq_commentsDiv);

                jq_commentsDiv.on("click", function ()
                {
                    _rules._showCommentPopup(listItemId);
                });

                if (rulePartsXml.length === 0 && typeClass === "event" && ignoreEventDuplicateCheck !== true)
                {
                    _rules._checkForExistingEvent(jq_ListItem);
                }

                // should not be affected if jq_ListItem is an event
                // always mark the handler to which an item was added as dirty
                _rules._getCurrentHandler(jq_ListItem).addClass("dirty");
            }

            // Reset main toolbar events
            if (currentlySelectedExecutionGroup.length > 0)
            {
                _rules._setExecutionGroupMobilitySettings(currentlySelectedExecutionGroup, mainRWToolbarWrapper);
                if (checkExists(jq_ListItem))
                {
                    _rules._executionExpanderChanged(jq_ListItem.closest(".rulesUl.action.prefix"), false, jq_ListItem.prevAll(".execution-expander"));
                }
            }
            else if (currentlySelectedHandler.length > 0)
            {
                _rules._setHandlerMobilitySettings(currentlySelectedHandler, mainRWToolbarWrapper);

                if (checkExists(jq_ListItem) && jq_ListItem.closest(".rulesUl.action.prefix").length > 0)
                {
                    _rules._executionExpanderChanged(jq_ListItem.closest(".rulesUl.action.prefix"), false, jq_ListItem.prevAll(".execution-expander"));
                }

                _rules._handlerExpanderChanged(jq_ListItem.closest(".rulesUl.action:not(.prefix)"), false, currentlySelectedHandler.find(">.handler-expander"));
            }
            else if (currentlySelectedRuleItem.length > 0)
            {
                _rules._setItemMobilitySettings(currentlySelectedRuleItem, mainRWToolbarWrapper);
                if (checkExists(jq_ListItem))
                {
                    _rules._handlerExpanderChanged(jq_ListItem.closest(".rulesUl.action:not(.prefix)"), false, currentlySelectedHandler.find(">.handler-expander"));
                }
            }
            if (checkExists(jq_ListItem))
            {
                if (typeClass === "action")
                {
                    _rules._handlerExpanderChanged(jq_ListItem.closest(".rulesUl:not(.prefix)"), false, jq_ListItem.closest(".rulesUl:not(.prefix)").find(">.handler-expander"), jq_ListItem.closest(".rulesUl.action.prefix"));
                }
                else if (typeClass === "condition")
                {
                    _rules._handlerExpanderChanged(jq_ListItem.closest(".rulesUl:not(.prefix)"), false, jq_ListItem.closest(".rulesUl:not(.prefix)").find(">.handler-expander"));
                }
            }

            SourceCode.Forms.Designers.Rule._toggleEmptyRuleDesignPlaceHolder();
            return typeClass === "handler" ? newHandlerId : listItemId;
        },

        _createHandlerAction: function (actionID, isCurrentHandler, isEnabled, isInherited, actionDefinitionID, context)
        {
            if (!nestedHandlersFeatureEnabled)
            {
                console.log("_createHandlerAction should not be called when nesting is disabled");
            }
            var handlerAction = jQuery("<li class='handler-action'></li>");
            var isReference = false;

            if (checkExists(isCurrentHandler))
            {
                isReference = !(isCurrentHandler === "true" || isCurrentHandler === true);
            }

            if (!checkExists(actionID))
            {
                actionID = String.generateGuid();
            }

            if (checkExists(isCurrentHandler))
            {
                handlerAction.attr("IsReference", isReference);
                isCurrentHandler = isCurrentHandler.toString().toLowerCase();
            }

            if (checkExists(actionDefinitionID))
            {
                handlerAction.attr("DefinitionID", actionDefinitionID);
            }

            if (checkExists(isInherited))
            {
                handlerAction.attr("IsInherited", isInherited);
            }

            if (checkExists(isEnabled))
            {
                handlerAction.attr("isEnabled", isEnabled);
                isEnabled = isEnabled.toString().toUpperCase();
            }

            if (isEnabled !== "TRUE")
            {
                handlerAction.addClass('disabled');
            }

            handlerAction.attr('id', actionID);
            handlerAction.data("ID", actionID);
            handlerAction.data("DefinitionID", actionDefinitionID);
            handlerAction.data("Context", context);
            handlerAction.data("eventIsCurrentHandler", isCurrentHandler);

            if (isReference)
            {
                handlerAction.addClass("inactive");
            }

            return handlerAction;
        },

        _addHandler: function (handlerName, handlerID, isCurrentHandler, isEnabled, isInherited,
            handlerDefinitionID, context, defaultValues, insertBeforeObj, insertAfterObj, appendToObj)
        {
            var handlerHTMLTemplate = "<ul class='rulesUl handler {0} dirty'>" +
                "<div class='handler-expander'></div><div class='handler-specifier'></div>" +
                "<div class='condition-expander'></div><div class='condition-specifier'></div>" +
                "</ul>";

            var DEFAULTHANDLERTYPE = "If";

            // Getting Rule Definition XML
            var handlerXml = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("//RuleDefinitions/Handlers/" +
                "Handler[@Name='" + handlerName + "']");
            var isReference;

            if (checkExists(isCurrentHandler))
            {
                isReference = isCurrentHandler === "true" || isCurrentHandler === true ? false : true;
            }

            var handlerType = handlerXml.getAttribute("HandlerType");
            if (handlerType === null)
            {
                handlerType = DEFAULTHANDLERTYPE;
            }

            // Create handler with expander and border div  and append to document//
            var handlerUl = jQuery(handlerHTMLTemplate.format(handlerType));
            var rulePanelbox = $('#RulePanelbox_RuleArea');
            var handlerAction;

            var currentlySelectedRuleItem = null;
            var currentSelectedRuleItemType = null;
            var currentSelectedHandlerType = null;
            var currentlySelectedHandler = null;

            if (insertBeforeObj === null && insertAfterObj === null && appendToObj === null)
            {
                currentlySelectedRuleItem = jQuery("#RulePanelbox").find("li.condition.selected," +
                    "li.action.selected, ul.rulesUl.handler:not(.prefix).selected, li.action.prefix.selected");

                if (currentlySelectedRuleItem.length > 0)
                {
                    currentSelectedRuleItemType = _rules._getCurrentItemType(currentlySelectedRuleItem);
                }
                currentlySelectedHandler = _rules._getCurrentHandler(currentlySelectedRuleItem);
                currentSelectedHandlerType = _rules._getHandlerType(currentlySelectedHandler);
            }

            if (insertBeforeObj !== undefined && insertBeforeObj !== null && insertBeforeObj.length > 0)
            {
                var insertBeforeObjType = _rules._getCurrentItemType(insertBeforeObj);
                var $parentHandler = _rules._getCurrentHandler(insertBeforeObj);
                var parentHandlerType = _rules._getHandlerType($parentHandler, true);

                if (insertBeforeObjType === "Handler" || !nestedHandlersFeatureEnabled)
                {
                    handlerUl.insertBefore($parentHandler);
                }
                else if (parentHandlerType === "Always")
                {
                    var $itemsToMove = insertBeforeObj.nextAll().addBack();
                    var $newAlwaysHandler = _rules._addHandler("IfLogicalHandler", null, "true", true, "false", null, context, null, null, $parentHandler, null);
                    $newAlwaysHandler.append($itemsToMove);
                    handlerUl.insertAfter($parentHandler);
                }
                else
                {
                    handlerUl = handlerUl.wrap(_rules._createHandlerAction());
                    handlerAction = handlerUl.parent();
                    handlerAction.insertBefore(insertBeforeObj);
                }
            }
            else if (insertAfterObj !== undefined && insertAfterObj !== null && insertAfterObj.length > 0)
            {
                var insertAfterObjType = _rules._getCurrentItemType(insertAfterObj);
                var $insertAfterObjHandler = _rules._getCurrentHandler(insertAfterObj);
                var insertAfterObjHandlerType;

                if (insertAfterObjType === "Handler" || !nestedHandlersFeatureEnabled)
                {
                    handlerUl.insertAfter($insertAfterObjHandler);
                }
                else if (insertAfterObjType === "Action")
                {
                    if (!$insertAfterObjHandler.hasClass("inactive")
                        && ($insertAfterObjHandler.find(">li.condition").length === 0))
                    {
                        var nextItems = insertAfterObj.nextAll(".action, .handler-action");
                        handlerUl.insertAfter($insertAfterObjHandler);
                        var newHandlerUl = jQuery(handlerHTMLTemplate.format(DEFAULTHANDLERTYPE));
                        newHandlerUl.insertAfter(handlerUl);
                        newHandlerUl.append(nextItems);
                        $insertAfterObjHandler.addClass("dirty");
                    }
                    else
                    {
                        var nextItem = insertAfterObj.next(".action, .handler-action");
                        if (_rules._getCurrentItemType(nextItem) === "HandlerAction")
                        {
                            nextItem.prepend(handlerUl);
                        }
                        else
                        {
                            handlerAction = _rules._createHandlerAction(null, true, "TRUE", false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                            handlerAction.append(handlerUl);
                            insertAfterObj.after(handlerAction);
                        }
                    }
                }
            }
            else if (appendToObj !== undefined && appendToObj !== null && appendToObj.length > 0)
            {
                var appendToObjType = _rules._getCurrentItemType(appendToObj);
                if (!nestedHandlersFeatureEnabled)
                {
                    if (appendToObjType === "HandlerAction")
                    {
                        appendToObj.append(handlerUl);
                    }
                    else
                    {
                        appendToObj.after(handlerUl);
                    }
                }
                else
                {
                    switch (appendToObjType)
                    {
                        case "RuleDesignCanvas":
                        case "HandlerAction":
                            appendToObj.append(handlerUl);
                            break;

                        case "Handler":
                            var $handlerLastChild = appendToObj.children("li").last();
                            var handlerLastChildType = _rules._getCurrentItemType($handlerLastChild);
                            if (handlerLastChildType !== "HandlerAction")
                            {
                                $handlerLastChild = _rules._createHandlerAction(null, true, "TRUE", false, null,
                                    SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());
                                appendToObj.append($handlerLastChild);
                                appendToObj.addClass("dirty");
                            }
                            $handlerLastChild.append(handlerUl);
                            break;
                    }
                }
            }
            else if (checkExists(currentlySelectedRuleItem) && currentlySelectedRuleItem.length > 0)
            {
                switch (currentSelectedRuleItemType)
                {
                    case "Action":
                    case "ActionPrefix":
                    case "Condition":
                    case "PrefixHandler":
                    case "HandlerRuleItem":
                    case "Handler":
                        //Add as new next sibling
                        currentlySelectedHandler.after(handlerUl);
                        break;

                    /*case "Handler":
                        if (_rules._isRootItem(currentlySelectedHandler))
                        {
                            //Add as new next sibling
                            currentlySelectedHandler.after(handlerUl);
                        }
                        else
                        {
                            //add as sibling to handler action
                            var handlerAction = _rules._createHandlerAction(null, true, "TRUE", false,	null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());
 
                            handlerAction.append(handlerUl);
                            currentlySelectedHandler.closest(".handler-action").after(handlerAction);
                        }
                        break;*/

                    case "Event":
                    case "EmptyRulePlaceHolder":
                        //Add as first handler
                        rulePanelbox.prepend(handlerUl);
                        break;
                }
            }
            else
            {
                rulePanelbox.append(handlerUl);
            }

            if (!checkExists(handlerID))
            {
                handlerID = String.generateGuid();
            }

            if (checkExists(isCurrentHandler))
            {
                handlerUl.attr("IsReference", isReference);
            }

            if (checkExists(handlerDefinitionID))
            {
                handlerUl.attr("DefinitionID", handlerDefinitionID);
            }

            if (checkExists(isInherited))
            {
                handlerUl.attr("IsInherited", isInherited);
            }

            var isEnabledAsString = isEnabled.toString();
            if (checkExistsNotEmpty(isEnabledAsString))
            {
                handlerUl.attr("isEnabled", isEnabled);
            }

            if (isEnabledAsString.toUpperCase() !== "TRUE")
            {
                handlerUl.addClass('disabled');
            }

            handlerUl.addClass(context + '-context');
            handlerUl.attr('id', handlerID);
            handlerUl.data("Context", context);

            if (isReference === true)
            {
                handlerUl.addClass("inactive");
            }

            handlerUl.on("click", function (event)
            {
                _rules._handlerClicked(event);
            });

            // Add event to handler expander //
            handlerUl.find(".handler-expander").on("click", function (event)
            {
                event.stopPropagation();
                var jq_this = jQuery(this);
                _rules._handlerExpanderChanged(jq_this.closest("ul.handler"), !jq_this.hasClass("collapsed"), jq_this);
            });
            // Add event to handler expander //

            // Add event to condition expander //
            handlerUl.find(".condition-expander").on("click", function (event)
            {
                event.stopPropagation();
                var jq_this = jQuery(this);
                _rules._conditionExpanderChanged(jq_this.closest("ul.handler"), !jq_this.hasClass("collapsed"), jq_this);
            });
            // Add event to condition expander //

            if (checkExists(handlerXml))
            {
                handlerUl.data("xml", handlerXml);
                var mainDivWrapper = jQuery("<div class='rule-item-wrapper'></div>");
                var ruleDescription = handlerXml.selectSingleNode("Description"); // Getting Rule Description
                ruleDescription = checkExists(ruleDescription) ? ruleDescription.text : "";
                var rulePartsXml = handlerXml.selectNodes("Parts/Part");
                var jq_ruleDiv = jQuery("<div id='" + String.generateGuid() + "' style='display:inline;'></div>");
                var spanArray = [];
                var partArray = [];

                var ruleConfigurations = handlerXml.selectSingleNode("Configurations");

                for (var p = 0; p < rulePartsXml.length; p++)
                {
                    var partID = "rule_part_" + String.generateGuid();  // Part id
                    var jq_Part = $("<a href='javascript:void(0);' id='" + partID + "'>" +
                        rulePartsXml[p].selectSingleNode("Display").text + "</a>");
                    var partName = rulePartsXml[p].getAttribute("Name");
                    var partHidden = rulePartsXml[p].getAttribute("Hidden");
                    jq_Part.data("xml", rulePartsXml[p]);
                    jq_Part.data("name", partName);
                    jq_Part.data("loadPart", rulePartsXml[p].getAttribute("LoadPart"));
                    if (partHidden === "True")
                    {
                        jq_Part.hide();
                    }

                    partArray[p] = jq_Part;
                    spanArray[p] = "<span id='span" + partID + "' name='" + partName + "' Hidden='" + partHidden +
                        "'></span>";
                }

                ruleDescription = ruleDescription.format(spanArray);
                ruleDescription = ruleDescription.replace(/> /gi, ">&nbsp;");

                if (rulePartsXml.length !== 0)
                {
                    jq_ruleDiv.html(ruleDescription);
                }
                else
                {
                    jq_ruleDiv.text(ruleDescription.toString());
                }

                mainDivWrapper.prepend(jq_ruleDiv);
                handlerUl.find(">.handler-specifier").after(mainDivWrapper);

                _rules._processPartsArray(partArray, isCurrentHandler, mainDivWrapper, handlerXml, defaultValues);
            }

            var $imageWrapper = _rules._createToolbarImageWrapper(true, isEnabled);
            //disable handler comments
            $imageWrapper.find(".toolbar-button.comment").addClass("disabled");
            handlerUl.find(".rule-item-wrapper").append($imageWrapper);

            return handlerUl;
        },

        _isRootItem: function (jqItem)
        {
            var itemType = _rules._getCurrentItemType(jqItem);
            if (itemType !== "Handler")
            {
                jqItem = _rules._getCurrentHandler(jqItem);
            }
            var $ItemParent = jqItem.parent();
            var result = $ItemParent.attr("id") === "RulePanelbox_RuleArea";
            if (!result && $ItemParent.length > 0 && !nestedHandlersFeatureEnabled)
            {
                console.log("Nesting is disabled, but nested item found: GUID={0}".format(jqItem.attr("id")));
            }
            return result;
        },

        _processPartsArray: function (partArray, isCurrentHandler, mainDivWrapper, ruleXml, defaultValues)
        {
            var jq_configuration = jQuery("<a href='javascript:void(0);'>" + Resources.RuleDesigner.lrConfigureBrackets + "</a>");
            jq_configuration.attr('id', String.generateGuid());
            var autoLoadPart = [];
            for (var x = 0; x < partArray.length; x++)
            {
                var partID = partArray[x].attr("id");
                var jq_Part = jQuery(partArray[x]);
                var partXML = jq_Part.data("xml");
                var isDependent = partXML.getAttribute("IsDependent") !== null ? partXML.getAttribute("IsDependent").toLowerCase() : null;
                var partDefaultValue = partXML.getAttribute("Value");
                var isAutoLoad = partXML.getAttribute("AutoLoad");
                var activatesConfiguration = partXML.getAttribute("ActivateConfiguration");
                var changeInvalidatesConfiguration = partXML.getAttribute("ChangeInvalidatesConfiguration");
                var configurationErrorMsg = partXML.selectSingleNode("ConfigurationErrorMsg");
                var configurationRequiredPartIncompleteMsg = partXML.selectSingleNode("ConfigurationRequiredPartIncompleteMsg");
                var currentPartName = jq_Part.data("name");
                jq_Part.attr("PartName", currentPartName);

                // Check if the current part is dependant on another part.
                var dependantParts = partXML.selectNodes("Parameters/Parameter[@Part]");
                var dependantPartsArray = [];

                if (jQuery("#span" + partID).length > 0)
                { //Check if the number of spans corresponds to the number of parts
                    if (dependantParts.length > 0)
                    {
                        for (var t = 0; t < dependantParts.length; t++)
                        {
                            var dependantPart = dependantParts[t];

                            for (var a = 0; a < partArray.length; a++)
                            {
                                if (partArray[a].data("name") === dependantPart.getAttribute("Part"))
                                {
                                    dependantPartsArray.push(partArray[a].attr("id"));
                                }
                            }
                        }

                        jq_Part.data("dependantPart", dependantPartsArray);
                        //					jq_Part.addClass("disabled");
                    }

                    if (partArray.length > 1)
                    {
                        jq_Part.addClass("disabled");
                    } else
                    {
                        jq_Part.addClass("dependant");
                    }

                    jQuery("#span" + partID).replaceWith(partArray[x]);
                    var partDisplayHidden = jQuery("#" + partID).data("xml").getAttribute("Hidden") ? jQuery("#" + partID).data("xml").getAttribute("Hidden") : null;

                    // Set Default Value
                    if ($chk(partDefaultValue))
                    {
                        jQuery(partArray[x]).data("value", partDefaultValue);
                        jQuery(partArray[x]).text(partDefaultValue);
                    }

                    if (activatesConfiguration === "True")
                    {
                        jQuery(partArray[x]).data("activatesConfiguration", jq_configuration.attr('id'));

                        if (isCurrentHandler === "true")
                        {
                            mainDivWrapper.append(jQuery("<span>&nbsp;</span>"));
                            mainDivWrapper.append(jq_configuration);
                        }
                    }

                    if (changeInvalidatesConfiguration === "True")
                    {
                        jQuery(partArray[x]).data("changeInvalidatesConfiguration", jq_configuration.attr('id'));
                    }

                    if (checkExistsNotEmpty(configurationErrorMsg))
                    {
                        jQuery(partArray[x]).data("configurationErrorMsg", configurationErrorMsg.text);
                    }

                    if (checkExistsNotEmpty(configurationRequiredPartIncompleteMsg))
                    {
                        jQuery(partArray[x]).data("configurationRequiredPartIncompleteMsg", configurationRequiredPartIncompleteMsg.text);
                    }

                    // Check if part must be autoloaded
                    if (isAutoLoad === "True")
                    {
                        autoLoadPart.push(partArray[x]);
                    }

                    if (isDependent === "false")
                    {
                        jq_Part.removeClass("disabled");
                        jq_Part.addClass("dependant");
                    }

                    if (defaultValues && defaultValues.length > 0)
                    {
                        for (var d = 0; d < defaultValues.length; d++)
                        {
                            if (defaultValues[d].getAttribute("Name") === currentPartName)
                            {
                                var templatePartDefaultValue = defaultValues[d].selectSingleNode("Value").text;
                                var templatePartDefaultDisplay = defaultValues[d].selectSingleNode("Display").text;

                                jq_Part.data("value", templatePartDefaultValue);
                                jq_Part.text(templatePartDefaultDisplay);

                                jq_Part.removeClass("disabled");
                                jq_Part.removeClass("dependant");
                                jq_Part.addClass("visited");

                                if (isAutoLoad === "True")
                                {
                                    autoLoadPart.pop();
                                }

                                _rules._getCurrentHandler(jq_Part).addClass("dirty");

                                break;
                            }
                        }
                    }
                }
            }

            if (isCurrentHandler === "true")
            {
                var ruleConfigurations = ruleXml.selectSingleNode("Configurations");
                var jq_errorDiv = jQuery("<div class='rules-wizard-error' title='" + Resources.RuleDesigner.ConfigRequiredMsg + "'></div>");
                mainDivWrapper.append(jq_errorDiv);

                jq_configuration.addClass('mappingConfiguration');
                jq_configuration.addClass("disabled");

                if ($chk(ruleConfigurations))
                {
                    var configurationsNode = ruleConfigurations.selectNodes("Configuration");

                    for (var c = 0; c < configurationsNode.length; c++)
                    {
                        var configurationNode = configurationsNode[c];
                        var configurationType = configurationNode.getAttribute("Type");

                        if ($chk(configurationType))
                        {
                            jq_configuration.data("xml", configurationNode);
                        } else
                        {
                            jq_configuration.hide();
                        }
                    }
                }
                else
                {
                    jq_configuration.hide();
                }

                for (var p = 0; p < autoLoadPart.length; p++)
                {
                    var currentAutoLoadPart = autoLoadPart[p];

                    if (!_rules.busyLoading || _rules.doAutoLoadWhileLoading)
                    {
                        if ($chk(currentAutoLoadPart))
                        {
                            currentAutoLoadPart.addClass("dependant");
                            currentAutoLoadPart.removeClass("disabled");
                            _rules._partClicked(currentAutoLoadPart, true);
                        }
                    }
                }
            }
        },

        _clearSelectedItem: function ()
        {
            jQuery("#RulePanelbox").find(".rulesUl.handler.selected,li.condition.selected, li.action.selected, .rulesUl.action.prefix.selected, li.event").removeClass("selected");
        },

        _createToolbarImageWrapper: function (includeEnableDisableChkbox, checkBoxIsEnabled)
        {
            var jq_disableChkbox;
            if (!checkExists(checkBoxIsEnabled))
            {
                checkBoxIsEnabled = true;
            }

            var imageWrapperHtml = '<div class="rulesImageWrapper"><div class="toolbar floating">' +
                '<div class="toolbar-wrapper">';

            if (includeEnableDisableChkbox)
            {
                var disableChkboxHtml = SourceCode.Forms.Controls.Checkbox.html({ checked: checkBoxIsEnabled, description: Resources.RuleDesigner.EnableDisable });
                imageWrapperHtml += disableChkboxHtml + '<div class="toolbar-divider"></div>';
            }

            imageWrapperHtml += '<a href="javascript:;" class="toolbar-button move-down">' +
                '<span class="button-l"></span>' +
                '<span class="button-c">' +
                '<span class="button-icon"></span>' +
                '</span>' +
                '<span class="button-r"></span>' +
                '</a>' +
                '<div class="toolbar-divider"></div>' +
                '<a href="javascript:;" class="toolbar-button move-up">' +
                '<span class="button-l"></span>' +
                '<span class="button-c">' +
                '<span class="button-icon"></span>' +
                '</span>' +
                '<span class="button-r"></span>' +
                '</a>' +
                '<div class="toolbar-divider"></div>' +
                '<a href="javascript:;" class="toolbar-button delete">' +
                '<span class="button-l"></span>' +
                '<span class="button-c">' +
                '<span class="button-icon"></span>' +
                '</span>' +
                '<span class="button-r"></span>' +
                '</a>' +
                '<div class="toolbar-divider"></div>' +
                '<a href="javascript:;" class="toolbar-button comment">' +
                '<span class="button-l"></span>' +
                '<span class="button-c">' +
                '<span class="button-icon"></span>' +
                '</span>' +
                '<span class="button-r"></span>' +
                '</a>' +
                '</div>' +
                '</div></div>';

            var jq_imageWrapper = jQuery(imageWrapperHtml);
            jq_imageWrapper.attr("id", String.generateGuid());

            if (includeEnableDisableChkbox)
            {
                jq_disableChkbox = jQuery(jq_imageWrapper.find('label.input-control.checkbox')).checkbox().css('float', 'left');
            }

            return jq_imageWrapper;
        },

        _resetToolbarEvents: function ()
        {
            var toolbarWrapper = jQuery("#rwBottomPaneToolbar");

            toolbarWrapper.find("a.toolbar-button.move-up, a.toolbar-button.move-down, a.toolbar-button.delete, a.toolbar-button.comment").addClass("disabled").off("click");

            var jqCheckBox = jQuery("#rwEnableDisableTb").checkbox();
            jqCheckBox.checkbox("uncheck");
            jqCheckBox.checkbox("disable");
            jqCheckBox.find("input").off("click");
        },

        _showCommentPopup: function (itemId)
        {
            var jqTxtComments;
            var jqItem = jQuery("#" + itemId);

            // Assuming that inherrited rules will have the inactive class, and that you should only be able to view the comments of inactive rules
            var allowCommentEditing = !jqItem.hasClass("inactive");

            var helpButton = {
                type: "help",
                click: function () { HelpHelper.runHelp(7068); }
            };

            var okButton = {
                text: Resources.WizardButtons.OKButtonText,
                click: function ()
                {
                    var newValue = jqTxtComments.val();
                    _rules._setCommentValue(itemId, newValue);
                    popupManager.closeLast();
                }
            };

            var cancelButton = {
                id: 'rwCommentsPopupCancel',
                text: Resources.WizardButtons.CancelButtonText,
                click: function ()
                {
                    jqTxtComments.val("");
                }
            };

            var buttons;
            var content;

            if (allowCommentEditing)
            {
                buttons = [helpButton, okButton, cancelButton];
                content = jQuery('#rwcommentsPopupWrapper');
                jqTxtComments = jQuery("#rwTxtComments");
            }
            else
            {
                buttons = [helpButton, cancelButton];
                content = jQuery('#readOnlyCommentsPopupWrapper');
                jqTxtComments = jQuery("#readOnlyTxtComments");
            }

            var options = {
                id: 'rwCommentsPopup',
                buttons: buttons,
                headerText: Resources.Designers.CommentText,
                content: content,
                closeWith: 'rwCommentsPopupCancel',
                width: 310,
                height: 400,
                maximizable: false
            };

            var existingValue = jqItem.data("comments");

            if (checkExistsNotEmpty(existingValue))
            {
                jqTxtComments.val(existingValue);
            }

            popupManager.showPopup(options);

            if (allowCommentEditing) // rather not try focus disabled elements. You never know what IE will do.
            {
                jqTxtComments.trigger("focus");
            }
        },

        _setCommentValue: function (itemId, newValue)
        {
            var jqItem = jQuery("#" + itemId);
            var jqItemCommentDiv = jqItem.find(".comments");
            var jqTxtComments = jQuery("#rwTxtComments");

            if (checkExistsNotEmpty(newValue))
            {
                jqItem.data("comments", newValue);
                var stringLenght = 150;
                var trimmedString = newValue.length > stringLenght ? newValue.substring(0, stringLenght - 3) + "..." : newValue;
                jqItemCommentDiv[0].title = trimmedString;
                jqItemCommentDiv.show();
            }
            else
            {
                jqItem.data("comments", null);
                jqItemCommentDiv.hide();
            }

            jqTxtComments.val("");
        },

        _setItemMobilitySettings: function (ruleItem, toolbarWrapper)
        {
            var settings = {};
            var jq_this = jQuery(ruleItem);
            settings.isEnabled = !jq_this.hasClass("disabled");
            settings.isReference = jq_this.hasClass("inactive");
            var listItemId = jq_this.attr("id");
            settings.thisType = _rules._getCurrentItemType(jq_this).toLowerCase();
            var thisHandler = _rules._getCurrentHandler(jq_this);
            var prevHandler = _rules._getPreviousHandler(thisHandler);
            var nextHandler = _rules._getNextHandler(thisHandler);
            var handlerParentHandler = _rules._getCurrentHandler(thisHandler.parent());
            var jq_thisPrev = jq_this.prevAll("li." + settings.thisType + ":not(.prefix)").eq(0);
            var jq_thisNext = jq_this.nextAll("li." + settings.thisType + ":not(.prefix)").eq(0);
            var jq_thisHandlerConditions = thisHandler.find("li.condition");
            var thisHandlerConditionsLength = jq_thisHandlerConditions.length;
            var jq_thisHandlerActions = thisHandler.find("li.action");
            var upArrow = toolbarWrapper.find('a.toolbar-button.move-up');
            var downArrow = toolbarWrapper.find('a.toolbar-button.move-down');
            var removeButton = toolbarWrapper.find('a.toolbar-button.delete');
            var commentButton = toolbarWrapper.find('a.toolbar-button.comment');
            var jq_disableChkbox = toolbarWrapper.find(".input-control.checkbox").checkbox();
            settings.canMoveUp = false;
            settings.canMoveDown = false;
            var prefixLi = jq_this.parent().closest("li.prefix");
            var thisIsCurrentHandler = jq_this.data("eventIsCurrentHandler");
            var thisHandlerType = _rules._getHandlerType(thisHandler, true);
            var prevHandlerType = _rules._getHandlerType(prevHandler, true);
            var nextHandlerType = _rules._getHandlerType(nextHandler, true);
            var thisTypeIsEvent = jq_this.hasClass("event");

            var currentlySelectedRuleItem = jQuery("#RulePanelbox").find("li.condition.selected, li.action.selected");
            var currentlySelectedToolbarWrapper = jQuery("#rwBottomPaneToolbar");

            // Set to default disabled state
            upArrow.addClass("disabled").off("click");
            downArrow.addClass("disabled").off("click");
            removeButton.addClass("disabled").off("click");
            commentButton.addClass("disabled").off("click");

            jq_disableChkbox.find('input').off("click");

            commentButton.prev(".toolbar-divider").show();
            commentButton.show();

            if (thisTypeIsEvent)
            {
                jq_disableChkbox.checkbox("disable");
                jq_disableChkbox.checkbox("uncheck");
            }
            else
            {
                jq_disableChkbox.checkbox("enable");

                if (settings.isEnabled)
                {
                    jq_disableChkbox.checkbox("check");
                }
                else
                {
                    jq_disableChkbox.checkbox("uncheck");
                }
            }

            if (settings.isReference === false)
            {
                if (settings.thisType === 'action')
                {
                    /*	Move Up
                            The following must be true:
                                TYPEOF(thisHandler) === Always AND EXISTS(previousHandler) OR
                                TYPEOF(thisHandler) !== Always OR
                                TYPEOF(previousSibling) === Action, HandlerAction, ExecutionGroup
                    */
                    var previousSiblingType = _rules._getCurrentItemType(jq_this.prev());
                    if ((thisHandlerType === "Always" && prevHandler.length > 0)
                        || (thisHandlerType !== "Always")
                        || (previousSiblingType === "Action"
                            || previousSiblingType === "HandlerAction"
                            || previousSiblingType === "ActionPrefix"))
                    {
                        upArrow.removeClass("disabled");
                        settings.canMoveUp = true;
                        upArrow.on("click", function (event)
                        {
                            var $anchor = $(event.target).closest('a');
                            if (!$anchor.hasClass('disabled'))
                            {
                                $('.rulesImageWrapper').hide();
                                _rules._moveActionUp(event, jq_this);
                            }

                            if (currentlySelectedRuleItem.length > 0)
                            {
                                _rules._setItemMobilitySettings(currentlySelectedRuleItem,
                                    currentlySelectedToolbarWrapper);
                            }

                            _rules._scrollTo(jq_this);
                        });
                    }
                    // Move Up //

                    /*	Move Down
                            The following must be true:
                                TYPEOF(thisHandler) === Always AND EXISTS(nextHandler) OR
                                TYPEOF(thisHandler) !== Always OR
                                TYPEOF(nextSiblingType) === Action, HandlerAction, ExecutionGroup
                    */
                    var $nextSibling = jq_this.next();
                    var nextSiblingType = _rules._getCurrentItemType($nextSibling);
                    if (nextSiblingType === "Undefined" && jq_this.parent().hasClass("prefix"))
                    {
                        $nextSibling = jq_this.closest("li.prefix").next();
                        nextSiblingType = _rules._getCurrentItemType($nextSibling);
                    }

                    if ((thisHandlerType === "Always" && nextHandler.length > 0)
                        || (thisHandlerType !== "Always")
                        || (nextSiblingType === "Action"
                            || nextSiblingType === "HandlerAction"
                            || nextSiblingType === "ActionPrefix"))
                    {
                        downArrow.removeClass("disabled");
                        settings.canMoveDown = true;
                        downArrow.on("click", function (event)
                        {
                            var $anchor = $(event.target).closest('a');
                            if (!$anchor.hasClass('disabled'))
                            {
                                $('.rulesImageWrapper').hide();
                                _rules._moveActionDown(event, jq_this);
                            }

                            if (currentlySelectedRuleItem.length > 0)
                            {
                                _rules._setItemMobilitySettings(currentlySelectedRuleItem,
                                    currentlySelectedToolbarWrapper);
                            }

                            _rules._scrollTo(jq_this);
                        });
                        // Move Down //
                    }
                }

                if (settings.thisType === 'condition')
                {
                    /*
                        Move Up
                            EXISTS(previousHandler) OR
                            ISNESTED(thisHandler) OR
                            EXISTS(thisCondition.siblings) OR
                            TYPEOF(thisHandler) !== "If"
                    */
                    if (prevHandler.length > 0
                        || thisHandlerType !== "If"
                        || !_rules._isRootItem(jq_this)
                        || jq_this.next("li").length !== 0
                        || jq_this.prev("li").length !== 0)
                    {
                        upArrow.removeClass("disabled");
                        settings.canMoveUp = true;
                        upArrow.on("click", function (event)
                        {
                            _rules._moveConditionUp(event, jq_this);

                            if (currentlySelectedRuleItem.length > 0)
                            {
                                _rules._setItemMobilitySettings(currentlySelectedRuleItem,
                                    currentlySelectedToolbarWrapper);
                            }

                            _rules._scrollTo(jq_this);
                        });
                    }

                    /*
                        Move down
                            EXISTS(nextHandler) OR
                            ISNESTED(thisHandler) OR
                            EXISTS(thisCondition.siblings) OR
                            TYPEOF(thisHandler) !== "If")
                    */
                    if (nextHandler.length > 0
                        || thisHandlerType !== "If"
                        || !_rules._isRootItem(jq_this)
                        || jq_this.next("li").length !== 0
                        || jq_this.prev("li").length !== 0)
                    {
                        downArrow.removeClass("disabled");
                        settings.canMoveDown = true;
                        downArrow.on("click", function (event)
                        {
                            _rules._moveConditionDown(event, jq_this);

                            if (currentlySelectedRuleItem.length > 0)
                            {
                                _rules._setItemMobilitySettings(currentlySelectedRuleItem,
                                    currentlySelectedToolbarWrapper);
                            }

                            _rules._scrollTo(jq_this);
                        });
                    }
                }

                removeButton.removeClass('disabled');
                removeButton.on("click", function (event)
                {
                    event.stopPropagation();
                    if (!checkExists(jq_this.data("eventIsCurrentHandler"))
                        || jq_this.data("eventIsCurrentHandler").toLowerCase() === "true")
                    {
                        var listItemId = jq_this.attr("id");
                        jQuery(this).data("containerControlID", listItemId);
                        SourceCode.Forms.Designers.Rule._removeRuleDefinitionItem(event, jq_this);
                    }
                });
            }

            downArrow.data("containerControlID", listItemId);
            downArrow[0].title = Resources.RuleDesigner.lrMoveDown;

            upArrow.data("containerControlID", listItemId);
            upArrow[0].title = Resources.RuleDesigner.lrMoveUp;

            jq_disableChkbox.find('input').on("click", function (event)
            {
                var jq_thisChkBox = jQuery(this);
                var isChecked = jq_thisChkBox.is(":checked");
                var handler = _rules._getCurrentHandler(jq_this);

                if (isChecked)
                {
                    jq_disableChkbox.checkbox("check");
                }
                else
                {
                    jq_disableChkbox.checkbox("uncheck");
                }

                if (handler.hasClass("Error") || handler.hasClass("Else"))
                {
                    if (jq_this.hasClass("condition") && (jq_this.hasClass("Error") || jq_this.hasClass("Else")))
                    {
                        _rules._changeHandlerState(handler, isChecked, isChecked);
                    }
                    else
                    {
                        if (isChecked)
                        {
                            var conditionItem = handler.find("li.condition").first();
                            _rules._changeItemState(conditionItem, isChecked);
                            _rules._changeHandlerState(handler, isChecked, isChecked);
                        }
                    }
                }

                _rules._changeItemState(jq_this, isChecked);
            });

            commentButton.removeClass('disabled');
            commentButton.on("click", function (event)
            {
                var itemId = jq_this.attr("id");
                _rules._showCommentPopup(itemId);
            });

            return settings;
        },

        _setExecutionGroupMobilitySettings: function (executionGroup, toolbarWrapper)
        {
            var settings = {};
            var jq_this = jQuery(executionGroup);
            settings.isReference = jq_this.hasClass("inactive");
            settings.isEnabled = !jq_this.hasClass("disabled");
            var listItemId = jq_this.attr("id");
            var thisHandler = _rules._getCurrentHandler(jq_this);
            var prevHandler = _rules._getPreviousHandler(thisHandler);
            var nextHandler = _rules._getNextHandler(thisHandler);
            var prevExecutionGroup = jq_this.prev("li.action.prefix");
            var nextExecutionGroup = jq_this.next("li.action.prefix");
            var jq_disableChkbox = toolbarWrapper.find(".input-control.checkbox").checkbox();
            var upArrow = toolbarWrapper.find('a.toolbar-button.move-up');
            var downArrow = toolbarWrapper.find('a.toolbar-button.move-down');
            var removeButton = toolbarWrapper.find('a.toolbar-button.delete');
            var commentButton = toolbarWrapper.find('a.toolbar-button.comment');
            var inactiveActions = executionGroup.find("li.action.inactive");
            var inactiveActionsLength = inactiveActions.length;
            var thisHandlerType = _rules._getHandlerType(thisHandler, true);
            var prevHandlerType = _rules._getHandlerType(prevHandler, true);
            var nextHandlerType = _rules._getHandlerType(nextHandler, true);

            settings.canMoveUp = false;
            settings.canMoveDown = false;

            jq_disableChkbox.checkbox("enable");
            jq_disableChkbox.find('input').off("click");

            // Set buttons to default disabled state
            upArrow.addClass("disabled").off("click");
            downArrow.addClass("disabled").off("click");
            removeButton.addClass("disabled").off("click");
            commentButton.addClass("disabled").off("click");

            commentButton.prev(".toolbar-divider").hide();
            commentButton.hide();

            if (settings.isEnabled)
            {
                jq_disableChkbox.checkbox("check");
            }
            else
            {
                jq_disableChkbox.checkbox("uncheck");
            }

            if (settings.isReference === false)
            {
                if (inactiveActionsLength === 0 && executionGroup.closest('body').length > 0)
                {
                    if (!(thisHandlerType === "Always" && _rules._isRootItem(jq_this) && prevHandler.length === 0)
                        || prevExecutionGroup.length > 0)
                    {
                        settings.canMoveUp = true;
                        upArrow.removeClass("disabled");
                        upArrow.on("click", function (event)
                        {
                            _rules._moveExecutionGroupUp(event, executionGroup);
                        });
                    }

                    if (!(thisHandlerType === "Always" && _rules._isRootItem(jq_this) && nextHandler.length === 0)
                        || nextExecutionGroup.length > 0)
                    {
                        settings.canMoveDown = true;
                        downArrow.removeClass("disabled");
                        downArrow.on("click", function (event)
                        {
                            _rules._moveExecutionGroupDown(event, executionGroup);
                        });
                    }

                    removeButton.removeClass("disabled");
                    removeButton.on("click.executionGroupRemove", { executionGroup: executionGroup },
                        _rules._removeButtonClickedForExecutionGroup.bind(_rules));
                }
                else
                {
                    if (executionGroup.closest('body').length === 0)
                    {
                        jq_disableChkbox.checkbox("uncheck");
                        jq_disableChkbox.checkbox("disable");
                    }
                }
            }

            jq_disableChkbox.find('input').on("click", function ()
            {
                var jq_thisChkBox = jQuery(this);
                var isChecked = jq_thisChkBox.is(":checked");

                _rules._changeExecutionGroupState(executionGroup, isChecked);
                _rules._setExecutionGroupMobilitySettings(executionGroup, toolbarWrapper);
            });

            return settings;
        },

        _setHandlerMobilitySettings: function (handler, toolbarWrapper)
        {
            var settings = {};
            handler = jQuery(handler);
            settings.isReference = handler.hasClass("inactive");
            settings.isRootItem = _rules._isRootItem(handler);
            var prevHandler = handler.prev("ul.handler:not(.rulesImageWrapper)");
            var nextHandler = handler.next("ul.handler:not(.rulesImageWrapper)");
            var jq_thisHandlerConditions = handler.find("li.condition");
            var thisHandlerConditionsLength = jq_thisHandlerConditions.length;
            var jq_thisHandlerActions = handler.find("li.action");
            var upArrow = toolbarWrapper.find('a.toolbar-button.move-up');
            var downArrow = toolbarWrapper.find('a.toolbar-button.move-down');
            var removeButton = toolbarWrapper.find('a.toolbar-button.delete');
            var commentButton = toolbarWrapper.find('a.toolbar-button.comment');
            var jqCheckBox = toolbarWrapper.find(".input-control.checkbox").checkbox();
            settings.isEnabled = !handler.hasClass("disabled");
            settings.canMoveUp = false;
            settings.canMoveDown = false;

            // Set buttons to default disabled state
            upArrow.addClass("disabled").off("click");
            downArrow.addClass("disabled").off("click");
            removeButton.addClass("disabled").off("click");
            commentButton.off("click");

            if (settings.isEnabled)
            {
                jqCheckBox.checkbox("check");
            }
            else
            {
                jqCheckBox.checkbox("uncheck");
            }

            jqCheckBox.find('input').off("click");
            jqCheckBox.checkbox("enable");
            /*
                Movement, both up and down, and removal of handler is disabled for inherited items
            */
            if (settings.isReference === false)
            {
                if (!(prevHandler.length === 0 && settings.isRootItem))
                {
                    settings.canMoveUp = true;
                    upArrow.removeClass('disabled');
                    upArrow.on("click", function (event)
                    {
                        var jq_this = jQuery(this);
                        if (!jq_this.hasClass("disabled"))
                        {
                            _rules._moveHandlerUp(event, handler);
                            jq_this.closest(".rulesImageWrapper").css("display", "none");

                            _rules._setHandlerMobilitySettings(handler, toolbarWrapper);
                            _rules._scrollTo(handler);
                        }
                    });
                }

                if (!(nextHandler.length === 0 && settings.isRootItem))
                {
                    settings.canMoveDown = true;
                    downArrow.removeClass('disabled');
                    downArrow.on("click", function (event)
                    {
                        var jq_this = jQuery(this);
                        if (!jq_this.hasClass("disabled"))
                        {
                            _rules._moveHandlerDown(event, handler);
                            jq_this.closest(".rulesImageWrapper").css("display", "none");

                            _rules._setHandlerMobilitySettings(handler, toolbarWrapper);
                            _rules._scrollTo(handler);
                        }
                    });
                }

                removeButton.removeClass('disabled');

                removeButton.on("click.handlerRemove", { handler: handler }, _rules._removeButtonClickedForHandler.bind(_rules));
            }

            jqCheckBox.find('input').on("click", function ()
            {
                var jq_thisChkBox = jQuery(this);
                var isChecked = jq_thisChkBox.is(":checked");

                var selectedItem = jQuery(".rulesUl.handler.selected,li.condition.selected, li.action.selected");
                var selectedItemIsHandler = selectedItem.hasClass("rulesUl handler");

                if (isChecked)
                {
                    jqCheckBox.checkbox("check");
                }
                else
                {
                    jqCheckBox.checkbox("uncheck");
                }

                if (selectedItemIsHandler)
                {
                    SourceCode.Forms.Designers.Rule._changeHandlerState(selectedItem, isChecked, false);
                }
                else
                {
                    SourceCode.Forms.Designers.Rule._changeItemState(selectedItem, isChecked);
                }

                _rules._setHandlerMobilitySettings(selectedItem, toolbarWrapper);
            });
            commentButton.prev(".toolbar-divider").hide();
            commentButton.hide();
            //TODO: re-add when handlers can have comments
            /*commentButton.removeClass('disabled');
            commentButton.on("click", function (event)
            {
                var itemId = handler.attr("id");
                _rules._showCommentPopup(itemId);
            });*/

            return settings;
        },

        _removeButtonClickedForHandler: function (e)
        {
            var removeButton = $(e.target);
            if (!removeButton.hasClass("disabled") && checkExists(e.data) && checkExists(e.data.handler))
            {
                var handler = e.data.handler;
                var handlerChildren = handler.find("li:not(.prefix, .condition)");
                if (_rules._getHandlerType(handler) === "If")
                {
                    _rules._notifyHandlerDependenciesAndRemoveHandler(handler, handlerChildren);
                }
                else
                {
                    var context = SourceCode.Forms.WizardContainer.currentRuleWizardContext.toLowerCase();
                    var newContentHandler = _rules._addHandler("IfLogicalHandler", null, "true", true,
                        "false", null, context, null, null, handler, null);

                    newContentHandler.append(handler.children(":not(div)"));
                    handler.remove();
                    _rules._mergeHandlerActions(newContentHandler);
                    _rules._refreshSelectedItemToolbarState();
                    _rules._dirtyHandlerCleanup();
                }
            }
        },

        _removeButtonClickedForExecutionGroup: function (e)
        {
            var removeButton = $(e.target);
            if (removeButton.hasClass("disabled") || !checkExists(e.data) || !checkExists(e.data.executionGroup))
            {
                return;
            }

            var jq_executionGroupLi = e.data.executionGroup;
            var actions = jq_executionGroupLi.find("li.action");
            var ruleDataCollection = [];

            for (var a = 0; a < actions.length; a++)
            {
                var childItem = jQuery(actions[a]);

                if (!childItem.hasClass("inactive"))
                {
                    var itemType = childItem.data("xml").getAttribute("Type");

                    if (itemType === 'Popup' || itemType === 'Open')
                    {
                        //Handler child is an open subform/view action, need to be checked for dependencies
                        var ruleData =
                            {
                                itemId: childItem.data("ID"),
                                itemType: SourceCode.Forms.DependencyHelper.ReferenceType.Action
                            };
                        ruleDataCollection.push(ruleData);
                    }
                }
            }

            var actionGroupDependencies = [];
            if (ruleDataCollection.length > 0)
            {
                //References must be found and removed from the tmpContextDefintion, not the designer defition xml
                var dependencyData =
                    {
                        xmlDef: _rules.tmpContextDefinition
                    };
                actionGroupDependencies = SourceCode.Forms.Designers.getDependencies(ruleDataCollection, dependencyData);
            }

            var removeExecutionGroupCallBackFn = function (notifierContext)
            {
                //Pass notifierContext to prevent dependency checking when calling function that removes child actions
                _rules._removeExecutionGroup(e, jq_executionGroupLi, notifierContext);
            };

            if (actionGroupDependencies.length > 0)
            {
                //For subform/view dependencies, Keep or Remove options should not be available on notifier
                var notifierOptions =
                    {
                        references: actionGroupDependencies,
                        deletedItemDisplayName: "",
                        deleteItemType: SourceCode.Forms.DependencyHelper.ReferenceType.ExecutionGroup,
                        removeObjFn: removeExecutionGroupCallBackFn,
                        showSimpleNotifier: true,
                        removeConfirmationMessage: Resources.RuleDesigner.wrnHandlerHasChildrenRemoveMsg
                    };
                SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
            }
            else
            {
                if (actions.length === 0)
                {
                    //No sub actions, remove group (this should be prevented by UI, group should be removed with last action)
                    removeExecutionGroupCallBackFn();
                }
                else
                {
                    //Warn user that nested items will be removed
                    var options = ({
                        message: Resources.RuleDesigner.wrnHandlerHasChildrenRemoveMsg,
                        onAccept: function ()
                        {
                            removeExecutionGroupCallBackFn();
                            popupManager.closeLast();
                        },
                        onCancel: function ()
                        {
                            popupManager.closeLast();
                        },
                        draggable: true,
                        type: 'warning'
                    });

                    popupManager.showConfirmation(options);
                }
            }

        },

        _removeExecutionGroup: function (event, jq_executionGroupLi, notifierContext)
        {
            var actions = jq_executionGroupLi.find("li.action");
            var actionsLength = actions.length;

            for (var a = 0; a < actions.length; a++)
            {
                var childItem = jQuery(actions[a]);

                if (!childItem.hasClass("inactive"))
                {
                    SourceCode.Forms.Designers.Rule._removeRuleDefinitionItem(event, childItem, notifierContext);
                }
            }
        },

        _getHandlerType: function (handler, includeAlwaysCheck)
        {
            var handlerType = "";
            if (handler.length > 0)
            {
                //Get handler type//
                if (handler.hasClass("Error"))
                {
                    handlerType = 'Error';
                }
                else if (handler.hasClass("Else"))
                {
                    handlerType = 'Else';
                }
                else if (handler.hasClass("ForEach"))
                {
                    handlerType = 'ForEach';
                }
                else
                {
                    handlerType = 'If';
                    if (includeAlwaysCheck)
                    {
                        var handlerConditionsLength = handler.find(">li.condition").length;
                        if (handlerConditionsLength === 0)
                        {
                            handlerType = "Always";
                        }
                    }
                }
                //Get handler type//
            }
            return handlerType;
        },

        _handlerExpanderChanged: function (jq_handler, collapse, jq_expander, executionGroupToExpand)
        {
            var handlerType = _rules._getHandlerType(jq_handler, true);
            if (handlerType === "Always" || handlerType === "If")
            {
                _rules._conditionExpanderChanged(jq_handler, collapse, jq_expander, executionGroupToExpand);
            }
            else
            {
                var handlerActions = jq_handler.find(">li.action:not(.rulesImageWrapper,.prefix)");
                var handlerActionsPrefix = jq_handler.find(">li.action.prefix");
                var handlerConditions = jq_handler.find(">li.condition");
                if (collapse !== true)
                {
                    jq_expander.removeClass("collapsed");
                    handlerConditions.show();
                    if (jq_expander.hasClass("handler-expander") && handlerConditions.length > 0)
                    {
                        jq_handler.find(".condition-expander, .condition-specifier").show();
                    }
                    if (!jq_handler.find(".condition-expander").hasClass("collapsed"))
                    {
                        handlerActionsPrefix.show();
                        handlerActions.show();
                    }
                    jq_handler.find(".handler-specifier").removeClass("no-border");
                }
                else
                {
                    jq_expander.addClass("collapsed");
                    if (jq_expander.hasClass("handler-expander"))
                    {
                        jq_handler.find(".condition-expander, .condition-specifier").hide();
                    }
                    handlerConditions.hide();
                    handlerActionsPrefix.hide();
                    handlerActions.hide();
                    jq_handler.find(".handler-specifier").addClass("no-border");
                }
            }
        },

        _conditionExpanderChanged: function (jq_handler, collapse, jq_expander, executionGroupToExpand)
        {
            var handlerActions = jq_handler.find(">li.action:not(.rulesImageWrapper,.prefix), >li.action.prefix>ul.rulesUl>>li.action:not(.rulesImageWrapper,.prefix)");
            var handlerActionsPrefix = jq_handler.find(">li.action.prefix");
            var handlerConditions = jq_handler.find(">li.condition");
            var currentActionExecutionGroupExpander;

            if (collapse !== true)
            {
                jq_expander.removeClass("collapsed");
                handlerActionsPrefix.show();

                if (!checkExists(executionGroupToExpand))
                {
                    for (var j = 0; j < handlerActions.length; j++)
                    {
                        var currentAction = handlerActions.eq(j);
                        var currentActionExecutionGroup = currentAction.closest(".rulesUl.action.prefix");

                        if (currentActionExecutionGroup.length > 0)
                        {
                            currentActionExecutionGroupExpander = currentActionExecutionGroup.find(".execution-expander");
                            var currentActionExecutionGroupIsCollapsed = currentActionExecutionGroupExpander.hasClass("collapsed");

                            _rules._executionExpanderChanged(currentActionExecutionGroup, currentActionExecutionGroupIsCollapsed, currentActionExecutionGroupExpander);
                        }
                        else
                        {
                            currentAction.show();
                        }
                    }
                }
                else
                {
                    currentActionExecutionGroupExpander = executionGroupToExpand.find(".execution-expander");

                    _rules._executionExpanderChanged(executionGroupToExpand, false, currentActionExecutionGroupExpander);
                }

                if (jq_expander.hasClass("condition-expander"))
                {
                    jq_handler.find(".condition-specifier").removeClass("no-border");
                }
                else
                {
                    jq_handler.find(".handler-specifier").removeClass("no-border");
                }
            }
            else
            {
                jq_expander.addClass("collapsed");
                if (jq_expander.hasClass("condition-expander"))
                {
                    jq_handler.find(".condition-specifier").addClass("no-border");
                }
                else
                {
                    jq_handler.find(".handler-specifier").addClass("no-border");
                }

                if (handlerActionsPrefix.length > 0)
                {
                    handlerActionsPrefix.hide();
                }
                else
                {
                    handlerActions.hide();
                }
            }
        },

        _executionExpanderChanged: function (jq_executionGroup, collapse, jq_expander)
        {
            var handlerActions = jq_executionGroup.find("li.action:not(.rulesImageWrapper,.prefix)");
            var handlerActionsPrefix = jq_executionGroup.find("li.action.prefix");
            var handlerConditions = jq_executionGroup.find("li.condition");

            if (collapse !== true)
            {
                jq_expander.removeClass("collapsed");
                handlerActions.show();
                jq_executionGroup.find(".execution-specifier").removeClass("no-border");
            } else
            {
                if (handlerActions.length > 0)
                {
                    jq_expander.addClass("collapsed");
                    handlerActions.hide();
                    jq_executionGroup.find(".execution-specifier").addClass("no-border");
                }
            }
        },

        _handlerClicked: function (event)
        {
            var jq_this = jQuery(event.target);
            var jq_li = jq_this.closest("li.action:not(.prefix),li.condition:not(.prefix), li.event");
            var jq_ul = _rules._getCurrentHandler(jq_this);
            var jq_prefixLi = jq_this.closest("li.action.prefix");
            var toolbarWrapper = jQuery("#rwBottomPaneToolbar");
            var thisIsCurrentlySelected = jq_this.hasClass("selected") ? true : false;

            if (!thisIsCurrentlySelected)
            {
                if (!jq_this.hasClass("execution-expander"))
                {
                    _rules._resetToolbarEvents();
                    _rules._clearSelectedItem();
                }

                if (jq_this.is("a") && !jq_this.hasClass("rule-part-inactive"))
                {
                    event.stopPropagation();
                    if (jq_this.hasClass("mappingConfiguration"))
                    {
                        var configurationNode = jq_this.data("xml");

                        _rules._setupConfiguration(configurationNode, jq_this, false);
                    }
                    else
                    {
                        if (jq_this.hasClass("execTypeGroup"))
                        {
                            jq_prefixLi.addClass("selected");
                            _rules._setExecutionGroupMobilitySettings(jq_prefixLi, toolbarWrapper);

                            if (!jq_this.hasClass("inactive"))
                            {
                                _rules._showExecTypeGroupContextMenu(event, jq_this);
                            }
                        }
                        else
                        {
                            jq_li.addClass("selected");
                            if (!jq_this.hasClass("rule-part-inactive") && !jq_this.hasClass("inactive"))
                            {
                                _rules._partClicked(jq_this, false);

                                if (jq_li.length > 0)
                                {
                                    _rules._setItemMobilitySettings(jq_li, toolbarWrapper);
                                }
                                else
                                {
                                    _rules._resetToolbarEvents();
                                }
                            }
                        }
                    }
                }
                else if (jq_this.hasClass("execution-expander"))
                {
                    event.stopPropagation();

                    _rules._executionExpanderChanged(jq_this.closest(".rulesUl.action.prefix"), !jq_this.hasClass("collapsed"), jq_this);
                }
                else if (jq_this.hasClass("rule-item-wrapper") && jq_this.parent().is(".rulesUl,.handler"))
                {
                    jq_ul.addClass("selected");
                    _rules._setHandlerMobilitySettings(jq_ul, toolbarWrapper);
                }
                else if (jq_li.length > 0)
                {
                    toolbarWrapper = jQuery("#rwBottomPaneToolbar");
                    var thisTypeIsEvent = jq_li.hasClass("event");

                    jq_li.addClass("selected");
                    _rules._setItemMobilitySettings(jq_li, toolbarWrapper);
                }
                else if (jq_prefixLi.length > 0)
                {
                    jq_prefixLi.addClass("selected");
                    _rules._setExecutionGroupMobilitySettings(jq_prefixLi, toolbarWrapper);
                }
                else if (jq_ul.length > 0)
                {
                    jq_ul.addClass("selected");
                    _rules._setHandlerMobilitySettings(jq_ul, toolbarWrapper);
                }
                else
                {
                    _rules._resetToolbarEvents();
                }
            }
        },

        _changeHandlerState: function (handler, isEnabled, skipChildren)
        {
            if (skipChildren !== true)
            {
                // Disable nested Handlers
                var nestedHandlerChildren = handler.find(">li.handler-action>.handler");
                var nestedHandlerChildrenLength = nestedHandlerChildren.length;

                for (var ha = 0; ha < nestedHandlerChildrenLength; ha++)
                {
                    _rules._changeHandlerState($(nestedHandlerChildren[ha]), isEnabled, skipChildren);
                }
            }

            if (isEnabled)
            {
                handler.removeClass("disabled");
            }
            else
            {
                handler.addClass("disabled");
            }

            if (skipChildren !== true)
            {
                // Disable all execution groups
                var handlerExecutionGroups = handler.find(">li.action.prefix");
                var handlerExecutionGroupsLength = handlerExecutionGroups.length;

                for (var e = 0; e < handlerExecutionGroupsLength; e++)
                {
                    var executionGroup = jQuery(handlerExecutionGroups[e]);
                    _rules._changeExecutionGroupState(executionGroup, isEnabled);
                }

                // Disable direct conditions and actions
                var handlerChildren = handler.find(">li.condition, >li.action:not(.prefix)");
                var handlerChildrenLength = handlerChildren.length;

                for (var h = 0; h < handlerChildrenLength; h++)
                {
                    var currentChild = jQuery(handlerChildren[h]);
                    _rules._changeItemState(currentChild, isEnabled);
                }
            }
        },

        _changeExecutionGroupState: function (executionGroup, isEnabled)
        {
            if (isEnabled)
            {
                executionGroup.removeClass("disabled");
            }
            else
            {
                executionGroup.addClass("disabled");
            }

            var executionGroupChildren = executionGroup.find("li.action:not(.prefix)");
            var executionGroupChildrenLength = executionGroupChildren.length;

            for (var h = 0; h < executionGroupChildrenLength; h++)
            {
                var currentChild = jQuery(executionGroupChildren[h]);
                _rules._changeItemState(currentChild, isEnabled);
            }
        },

        _changeItemState: function (item, isEnabled, dontCheck)
        {
            var jqCheckBox = jQuery("#rwEnableDisableTb").checkbox();
            var handler = _rules._getCurrentHandler(item);
            var itemIsErrorCondition = item.hasClass("Error");

            if (isEnabled)
            {
                item.removeClass("disabled");
                jqCheckBox.checkbox("check");
            }
            else
            {
                item.addClass("disabled");
                jqCheckBox.checkbox("uncheck");
            }

            if (!checkExists(dontCheck))
            {
                _rules._checkExecutionGroupState(handler);
            }
        },

        _checkExecutionGroupState: function (handler)
        {
            var executionGroups = handler.find(">li.action.prefix");
            var executionGroupsLength = executionGroups.length;

            for (var e = 0; e < executionGroupsLength; e++)
            {
                var executionGroup = executionGroups.eq(e);
                var executionGroupChildren = executionGroup.find(">ul>li.action:not(.disabled)");
                var executionGroupChildrenLength = executionGroupChildren.length;

                if (executionGroupChildrenLength > 0)
                {
                    executionGroup.removeClass("disabled");
                }
                else
                {
                    executionGroup.addClass("disabled");
                }
            }

            _rules._checkHandlerState(handler);
        },

        _checkHandlerState: function (handler)
        {
            var handlerChildren = handler.find("li.action:not(.disabled, .prefix), li.condition:not(.disabled), " +
                "li.handler-action>ul.handler:not(.disabled)");
            var handlerChildrenLength = handlerChildren.length;
            var handlerType = _rules._getHandlerType(handler);

            if (handlerChildrenLength > 0)
            {
                _rules._changeHandlerState(handler, true, true);
            }
            else if (!_rules.disableHandlerDisabling || handlerType === "If")
            {
                _rules._changeHandlerState(handler, false, true);
            }
        },

        _notifyHandlerDependenciesAndRemoveHandler: function (handler, handlerChildren)
        {
            //Handler has no children and can have no dependencies, remove:
            if (handlerChildren.length === 0)
            {
                _rules._removeHandler(handler);
            }
            var ruleDataCollection = [];

            for (var i = 0; i < handlerChildren.length; i++)
            {
                var childItem = handlerChildren.eq(i);
                var itemXML = childItem.data("xml");
                var itemType = "";
                if (checkExists(itemXML))
                {
                    itemType = itemXML.getAttribute("Type");
                    if (itemType === 'Popup' || itemType === 'Open')
                    {
                        //Handler child is an open subform/view action, need to be checked for dependencies
                        var ruleData =
                            {
                                itemId: childItem.data("ID"),
                                itemType: "Action"
                            };
                        ruleDataCollection.push(ruleData);
                    }
                }
            }

            var actionGroupDependencies = [];
            if (ruleDataCollection.length > 0)
            {
                //References must be found and removed from the tmpContextDefintion, not the designer defition xml
                var dependencyData =
                    {
                        xmlDef: _rules.tmpContextDefinition
                    };
                actionGroupDependencies = SourceCode.Forms.Designers.getDependencies(ruleDataCollection, dependencyData);
            }

            if (actionGroupDependencies.length > 0)
            {
                var removeHandlerCallBackFn = function ()
                {
                    _rules._removeHandler(handler);
                };
                //For subform/view dependencies, Keep or Remove options should not be available on notifier
                var notifierOptions =
                    {
                        references: actionGroupDependencies,
                        deletedItemDisplayName: "",
                        deleteItemType: SourceCode.Forms.DependencyHelper.ReferenceType.Handler,
                        removeObjFn: removeHandlerCallBackFn,
                        showSimpleNotifier: true,
                        removeConfirmationMessage: Resources.RuleDesigner.lrRemoveSubFormDependenciesMsg
                    };
                SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
            }
            else
            {
                var options = ({
                    message: Resources.RuleDesigner.wrnHandlerHasChildrenRemoveMsg,
                    onAccept: function ()
                    {
                        _rules._removeHandler(handler);
                        popupManager.closeLast();
                    },
                    onCancel: function ()
                    {
                        popupManager.closeLast();
                    },
                    draggable: true,
                    type: 'warning'
                });

                popupManager.showConfirmation(options);
            }
        },

        _removeHandler: function (handler)
        {
            jQuery('.rulesImageWrapper').hide();

            var previousHandler = _rules._getPreviousHandler(handler);
            var nextHandler = _rules._getNextHandler(handler);

            handler.remove();

            if (previousHandler.length > 0 && nextHandler.length > 0)
            {
                _rules._mergeHandlerActions(previousHandler);
            }
            _rules._dirtyHandlerCleanup();
            _rules._toggleEmptyRuleDesignPlaceHolder();

            _rules._resetToolbarEvents();
        },

        _removeItemPrefixes: function ($handler)
        {
            /*
                flatten and clean model to make movement easier.
            */
            // Flag handler as dirty
            $handler.addClass("dirty");

            // Remove all prefix items
            var $handlerPrefixItems = $handler.find(">li.action.prefix");
            var handlerPrefixItemsLength = $handlerPrefixItems.length;
            for (var p = 0; p < handlerPrefixItemsLength; p++)
            {
                var $crtPrefixItem = $handlerPrefixItems.eq(p);
                var $crtPrefixItemChildren = $crtPrefixItem.find(">ul.rulesUl.prefix>li");

                $crtPrefixItemChildren.insertAfter($crtPrefixItem);
                $crtPrefixItem.remove();
            }

            // Remove all prefix elements
            $handler.children("li.condition").find(">.rule-item-wrapper>.condition.prefix").remove();

            // Flatten nested Always Handlers
            $handler.find(">li.handler-action").each(function (idx, handlerAction)
            {
                var $handlerAction = $(handlerAction);
                var $handler = _rules._getHandlerActionHandler($handlerAction);
                if (_rules._getHandlerType($handler, true) === "Always")
                {
                    var $itemsToMerge = $handler.find(">li");
                    $handlerAction.after($itemsToMerge);
                    $handlerAction.remove();
                }
            });
        },

        _prependItemToHandler: function ($item, $handler)
        {
            $handler.addClass("dirty");
            var itemType = _rules._getCurrentItemType($item);
            switch (itemType)
            {
                case "ActionPrefix":
                case "Action":
                    // Insert before first action/execution group/ handler action
                    var $targetActions = $handler.find(">li.action, >li.handler-action");
                    if ($targetActions.length > 0)
                    {
                        $targetActions.first().before($item);
                    }
                    else
                    {
                        // Insert after last condition
                        var $targetConditions = $handler.find(">li.condition");
                        if ($targetConditions.length > 0)
                        {
                            $targetConditions.last().after($item);
                        }
                        else
                        {
                            // Handler has no children
                            $handler.append($item);
                        }
                    }
                    break;

                case "Handler":
                    var $handlerChildrenNotConditions = $handler.children("li:not(.condition)");
                    var $handlerFirstChildNotCondition = $handlerChildrenNotConditions.first();
                    var firstChildItemType = _rules._getCurrentItemType($handlerFirstChildNotCondition);
                    switch (firstChildItemType)
                    {
                        case "Action":
                        case "ActionPrefix":
                        case "Undefined":
                            var $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE",
                                false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                            $newHandlerAction.append($item);
                            if (firstChildItemType === "Undefined")
                            {
                                $handler.find(">div").last().after($newHandlerAction);
                            }
                            else
                            {
                                $handlerFirstChildNotCondition.before($newHandlerAction);
                            }
                            break;

                        case "HandlerAction":
                            $handlerFirstChildNotCondition.prepend($item);
                            break;
                    }

                    break;
                case "Condition":
                    $handler.find(">div").last().after($item);
                    break;
            }
        },

        _moveHandlerUp: function (event, $handler)
        {
            var $previousHandler = _rules._getPreviousHandler($handler);
            var $newHandlerAction;
            if (!nestedHandlersFeatureEnabled)
            {
                $previousHandler.before($handler);
                _rules._mergeHandlerActions($previousHandler);
            }
            else if ($previousHandler.length > 0)
            {
                _rules._removeItemPrefixes($previousHandler);
                var $lastItem = $previousHandler.find(">li").last();
                var previousHandlerType = _rules._getHandlerType($previousHandler, true);
                if (previousHandlerType === "Always")
                {
                    var $nextHandler = _rules._getNextHandler($handler);
                    if (_rules._getHandlerType($nextHandler, true) !== "Always")
                    {
                        $nextHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, null,
                            $handler, null);
                    }

                    _rules._prependItemToHandler($lastItem, $nextHandler);
                    $nextHandler.addClass("dirty");
                    if ($previousHandler.children("li").length === 0)
                    {
                        $previousHandler.remove();
                    }
                }
                else
                {
                    if (previousHandlerType !== "If" && $previousHandler.children("li.condition").length > 0)
                    {
                        $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE", false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                        var $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, null,
                            null, $newHandlerAction);

                        $newHandler.append($previousHandler.children("li"));
                        $newHandlerAction.append($handler);
                        $previousHandler.append($newHandlerAction);
                    }
                    else if ($lastItem.length === 0 && _rules._getHandlerType($handler) === "If")
                    {
                        $previousHandler.append($handler.children("li"));
                        $handler.remove();
                    }
                    else if (_rules._getCurrentItemType($lastItem) === "HandlerAction")
                    {
                        $lastItem.append($handler);
                    }
                    else
                    {
                        $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE", false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                        $previousHandler.append($newHandlerAction);
                        $newHandlerAction.append($handler);
                    }
                }

                $previousHandler.addClass("dirty");
            }
            else
            {
                var $handlerAction = _rules._getCurrentHandlerAction($handler);
                var $grandparentHandler = _rules._getCurrentHandler($handlerAction);
                _rules._removeItemPrefixes($grandparentHandler);
                var $previousItem = $handlerAction.prev("li");

                switch (_rules._getCurrentItemType($previousItem))
                {
                    case "Action":
                        $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE", false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());
                        $previousItem.before($newHandlerAction);
                        $newHandlerAction.append($handler);
                        break;

                    case "HandlerAction": //possible but shouldnt happen from the designer.
                        var previousHandlerActionIsCurrent = !$previousItem.hasClass("inactive");
                        var thisHandlerActionIsCurrent = !$handlerAction.hasClass("inactive");
                        var $childrenToMove;
                        if (previousHandlerActionIsCurrent && !thisHandlerActionIsCurrent)
                        {
                            $childrenToMove = $previousItem.children();
                            $handlerAction.prepend($childrenToMove);
                        }
                        else
                        {
                            $childrenToMove = $handlerAction.children();
                            $previousItem.append($childrenToMove);
                        }
                        _rules._moveHandlerUp(event, $handler);
                        break;

                    default:
                        // Expected that _rules._getCurrentItemType($previousItem) === "Condition" should come in here as well.
                        $grandparentHandler.before($handler);
                        break;
                }

                //cleanup
                if ($handlerAction.find(">ul").length === 0)
                {
                    $handlerAction.remove();
                }

                _rules._mergeHandlerActions($grandparentHandler);
                $handler.addClass("dirty");
                $grandparentHandler.addClass("dirty");
            }
            _rules._dirtyHandlerCleanup();
            jQuery('.rulesImageWrapper').hide();
        },

        _moveHandlerDown: function (event, $handler)
        {
            var $nextHandler = _rules._getNextHandler($handler);
            var $newHandlerAction;

            if (!nestedHandlersFeatureEnabled)
            {
                $nextHandler.after($handler);
                _rules._mergeHandlerActions($nextHandler);
            }
            else if ($nextHandler.length > 0)
            {
                var nextHandlerType = _rules._getHandlerType($nextHandler, true);
                _rules._removeItemPrefixes($nextHandler);
                var nextHandlerConditions = $nextHandler.find(">li.condition");
                if (nextHandlerType === "Always")
                {
                    var $previousHandler = _rules._getPreviousHandler($handler);
                    if (_rules._getHandlerType($previousHandler, true) !== "Always")
                    {
                        $previousHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, $handler, null, null);
                    }
                    else
                    {
                        $previousHandler.addClass("dirty");
                    }

                    var $firstAction = $nextHandler.find(">li.action").first();
                    $previousHandler.append($firstAction);
                    if ($nextHandler.children("li").length === 0)
                    {
                        $nextHandler.remove();
                    }
                }
                else if (nextHandlerConditions.length > 0)
                {
                    if (nextHandlerType !== "If")
                    {
                        $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE", false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                        $newHandlerAction.append($handler);

                        var $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, null,
                            null, $newHandlerAction);

                        $newHandler.append($nextHandler.children("li"));
                        $nextHandler.append($newHandlerAction);
                    }
                    else
                    {
                        var $lastCondition = nextHandlerConditions.last();
                        var $firstNonConditionItem = $lastCondition.next();
                        if (_rules._getCurrentItemType($firstNonConditionItem) === "HandlerAction")
                        {
                            $firstNonConditionItem.prepend($handler);
                        }
                        else
                        {
                            $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE", false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                            $nextHandler.find(">li.condition").last().after($newHandlerAction);
                            $newHandlerAction.append($handler);
                        }
                    }
                }
                else
                {
                    _rules._prependItemToHandler($handler, $nextHandler);
                }
            }
            else
            {
                var $handlerAction = _rules._getCurrentHandlerAction($handler);
                var $grandparentHandler = _rules._getCurrentHandler($handlerAction);
                _rules._removeItemPrefixes($grandparentHandler);
                var $nextItem = $handlerAction.next("li");

                switch (_rules._getCurrentItemType($nextItem))
                {
                    case "Action":
                        $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE",
                            false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                        $nextItem.after($newHandlerAction);
                        $newHandlerAction.append($handler);
                        break;

                    case "HandlerAction": //possible but shouldnt happen from the designer.
                        var nextHandlerActionIsCurrent = !$nextItem.hasClass("inactive");
                        var thisHandlerActionIsCurrent = !$handlerAction.hasClass("inactive");
                        var $childrenToMove;

                        if (!nextHandlerActionIsCurrent && thisHandlerActionIsCurrent)
                        {
                            $childrenToMove = $handlerAction.children();
                            $nextItem.prepend($childrenToMove);
                        }
                        else
                        {
                            $childrenToMove = $nextItem.children();
                            $handlerAction.append($childrenToMove);
                        }

                        _rules._moveHandlerDown(event, $handler);
                        break;

                    default:
                        $grandparentHandler.after($handler);
                        break;
                }

                $handler.addClass("dirty");
                $grandparentHandler.addClass("dirty");
            }
            _rules._dirtyHandlerCleanup();
            jQuery('.rulesImageWrapper').hide();
        },

        _moveActionUp: function (event, $action)
        {
            // $action my be either a single Action or a collection of Actions

            var $thisHandler = _rules._getCurrentHandler($action);
            var $prevHandler = _rules._getPreviousHandler($thisHandler);
            var thisHandlerType = _rules._getHandlerType($thisHandler, true);

            _rules._removeItemPrefixes($thisHandler);

            var $previousItem = $action.first().prev("li");
            var previousItemType = _rules._getCurrentItemType($previousItem);

            switch (previousItemType)
            {
                case "Action":
                    $previousItem.before($action);
                    break;

                case "HandlerAction":
                    var $handlerActionHandler = _rules._getHandlerActionHandler($previousItem).last();
                    $handlerActionHandler.append($action);
                    $handlerActionHandler.addClass("dirty");
                    break;

                default:
                    // Expect previousItemType === "Condition" to come in here
                    if (!_rules._isRootItem($action) && $prevHandler.length === 0)
                    {
                        var $parentHandlerAction = _rules._getCurrentHandlerAction($thisHandler);
                        $parentHandlerAction.before($action);
                        //cleanup
                        var $parentHandlerActionHandler = _rules._getCurrentHandler($parentHandlerAction);
                        $parentHandlerActionHandler.addClass("dirty");
                    }
                    else if (_rules._getHandlerType($prevHandler, true) === "Always" || thisHandlerType === "Always")
                    {
                        $prevHandler.append($action);
                        //cleanup
                        $prevHandler.addClass("dirty");
                    }
                    else
                    {
                        var context = SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext();
                        var defaultHandlerName = $action.data("xml").getAttribute("DefaultHandlerName");
                        var $newHandler = _rules._addHandler(defaultHandlerName, null, true, "true", "false", null,
                            context, null, $thisHandler, null, null);

                        $newHandler.append($action);
                    }
                    break;
            }

            //cleanup
            if ((thisHandlerType === "If" || thisHandlerType === "Always")
                && $thisHandler.find(">li.action, >li.condition, >li.handler-action").length === 0)
            {
                $thisHandler.remove();
            }

            _rules._dirtyHandlerCleanup();
            _rules._checkMovedItemState($action);
        },

        _moveActionDown: function (event, $action)
        {
            // $action my be either a single Action or a collection of Actions

            var $thisHandler = _rules._getCurrentHandler($action);
            var $nextHandler = _rules._getNextHandler($thisHandler);
            var thisHandlerType = _rules._getHandlerType($thisHandler, true);
            var $targetHandler;

            _rules._removeItemPrefixes($thisHandler);

            var $nextItem = $action.last().next("li");
            var nextItemType = _rules._getCurrentItemType($nextItem);

            switch (nextItemType)
            {
                case "Action":
                    $nextItem.after($action);
                    break;

                case "HandlerAction":
                    $targetHandler = _rules._getHandlerActionHandler($nextItem).first();
                    _rules._prependItemToHandler($action, $targetHandler);
                    break;

                default:
                    if (!_rules._isRootItem($action) && $nextHandler.length === 0)
                    {
                        var $parentHandlerAction = _rules._getCurrentHandlerAction($thisHandler);
                        $parentHandlerAction.after($action);
                        //cleanup
                        $targetHandler = _rules._getCurrentHandler($parentHandlerAction);
                        $targetHandler.addClass("dirty");
                    }
                    else if (_rules._getHandlerType($nextHandler, true) === "Always" || thisHandlerType === "Always")
                    {
                        _rules._prependItemToHandler($action, $nextHandler);
                    }
                    else
                    {
                        var context = SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext();
                        var defaultHandlerName = $action.data("xml").getAttribute("DefaultHandlerName");
                        var $newHandler = _rules._addHandler(defaultHandlerName, null, true, "true", "false", null,
                            context, null, null, $thisHandler, null);

                        $newHandler.append($action);
                    }
                    break;
            }

            //cleanup
            if ((thisHandlerType === "If" || thisHandlerType === "Always")
                && $thisHandler.find(">li.action, >li.condition, >li.handler-action").length === 0)
            {
                $thisHandler.remove();
            }

            _rules._dirtyHandlerCleanup();
            _rules._checkMovedItemState($action);
        },

        _moveConditionUp: function (event, $condition)
        {
            var $thisHandler = _rules._getCurrentHandler($condition);
            var $prevHandler = _rules._getPreviousHandler($thisHandler);
            var thisHandlerType = _rules._getHandlerType($thisHandler, true);
            var $newHandler, $newHandlerAction;
            var $expander;

            if (thisHandlerType === "If")
            {
                $expander = $thisHandler.children(".handler-expander");
            }
            else
            {
                $expander = $thisHandler.children(".condition-expander");
            }

            if ($expander.hasClass("collapsed") && $thisHandler.find(">li.condition").length === 1)
            {
                _rules._conditionExpanderChanged($thisHandler, false, $expander);
            }

            _rules._removeItemPrefixes($thisHandler);

            var $previousItem = $condition.prev("li");
            var previousItemType = _rules._getCurrentItemType($previousItem);

            if (previousItemType === "Condition")
            {
                $previousItem.before($condition);
            }
            else if (!_rules._isRootItem($condition) && $prevHandler.length === 0)
            {
                var $parentHandlerAction = _rules._getCurrentHandlerAction($condition);
                var $grandparentHandler = _rules._getCurrentHandler($parentHandlerAction);

                if ($thisHandler.find(">li").length === 1)
                {
                    _rules._removeItemPrefixes($grandparentHandler);

                    var $parentHandlerActionPreviousSibling = $parentHandlerAction.prev("li");
                    var parentHandlerActionPreviousSiblingType = _rules._getCurrentItemType($parentHandlerActionPreviousSibling);

                    switch (parentHandlerActionPreviousSiblingType)
                    {
                        case "Action":
                            $newHandlerAction = _rules._createHandlerAction(null, true, true, false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                            $parentHandlerActionPreviousSibling.before($newHandlerAction);
                            $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, null, null, $newHandlerAction);

                            _rules._prependItemToHandler($condition, $newHandler);
                            break;

                        case "HandlerAction":
                            var previousHandlerActionIsCurrent = !$parentHandlerActionPreviousSibling.hasClass("inactive");
                            var thisHandlerActionIsCurrent = !$parentHandlerAction.hasClass("inactive");
                            var $childrenToMove;
                            if (previousHandlerActionIsCurrent && !thisHandlerActionIsCurrent)
                            {
                                $childrenToMove = $parentHandlerActionPreviousSibling.children();
                                $parentHandlerAction.prepend($childrenToMove);
                            }
                            else
                            {
                                $childrenToMove = $parentHandlerAction.children();
                                $parentHandlerActionPreviousSibling.append($childrenToMove);
                            }

                            _rules._moveConditionUp(event, $condition);
                            break;

                        case "Condition":
                            $parentHandlerAction.before($condition);
                            //cleanup
                            $parentHandlerAction.remove();
                            break;

                        default:
                            _rules._prependItemToHandler($condition, $grandparentHandler);
                            break;
                    }
                }
                else //has siblings
                {
                    $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                        SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, $thisHandler, null, null);

                    $newHandler.append($condition);
                }
            }
            else if ($thisHandler.find(">li").length === 1) //if thisHandler has only 1 child -> thisCondition
            {
                _rules._removeItemPrefixes($prevHandler);
                var $prevHandlerLastChild = $prevHandler.find(">li").last();
                var prevHandlerLastChildType = _rules._getCurrentItemType($prevHandlerLastChild);
                switch (prevHandlerLastChildType)
                {
                    case "Action":
                        if (nestedHandlersFeatureEnabled)
                        {
                            $newHandlerAction = _rules._createHandlerAction(null, true, true, false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                            $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, null, null, $newHandlerAction);

                            $prevHandler.append($newHandlerAction);
                            $newHandler.append($condition);
                        }
                        else
                        {
                            if ($prevHandler.children("li.condition").length > 0)
                            {
                                $prevHandler.children("li.condition").last().after($condition);
                            }
                            else
                            {
                                _rules._prependItemToHandler($condition, $prevHandler);
                            }
                        }
                        break;

                    case "HandlerAction":
                        $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, $thisHandler, null, null);

                        $prevHandlerLastChild.append($newHandler);
                        $newHandler.append($condition);
                        break;

                    case "Condition":
                        $prevHandlerLastChild.after($condition);
                        break;

                    default:
                        _rules._prependItemToHandler($condition, $prevHandler);
                        break;
                }
            }
            else //has siblings
            {
                $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                    SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, $thisHandler, null, null);

                _rules._prependItemToHandler($condition, $newHandler);
                _rules._mergeHandlerActions($thisHandler);
            }

            //cleanup
            if ((thisHandlerType === "If" || thisHandlerType === "Always")
                && $thisHandler.find(">li.action, >li.condition, >li.handler-action").length === 0)
            {
                $thisHandler.remove();
            }

            _rules._dirtyHandlerCleanup();
            _rules._checkMovedItemState($condition);
        },

        _moveConditionDown: function (event, $condition)
        {
            var $thisHandler = _rules._getCurrentHandler($condition);
            var $nextHandler = _rules._getNextHandler($thisHandler);
            var thisHandlerType = _rules._getHandlerType($thisHandler, true);
            var $newHandler, $newHandlerAction;
            var $expander;

            if (thisHandlerType === "If")
            {
                $expander = $thisHandler.children(".handler-expander");
            }
            else
            {
                $expander = $thisHandler.children(".condition-expander");
            }

            if ($expander.hasClass("collapsed") && $thisHandler.find(">li.condition").length === 1)
            {
                _rules._conditionExpanderChanged($thisHandler, false, $expander);
            }

            _rules._removeItemPrefixes($thisHandler); //sanitize

            var $nextItem = $condition.next("li");
            var nextItemType = _rules._getCurrentItemType($nextItem);

            if (nextItemType !== "Condition" && !nestedHandlersFeatureEnabled)
            {
                nextItemType = "NestingDisabled - Perform default behaviour";
            }

            switch (nextItemType)
            {
                case "Condition":
                    $nextItem.after($condition);
                    break;

                case "Action":
                    var context = SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext();
                    $newHandlerAction = _rules._createHandlerAction(null, true, true, false, null, context);
                    $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                        context, null, null, null, $newHandlerAction);

                    $condition.after($newHandlerAction);
                    _rules._prependItemToHandler($condition, $newHandler);
                    break;

                case "HandlerAction":
                    var $firstHandler = _rules._getHandlerActionHandler($nextItem).first();
                    $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                        context, null, $firstHandler, null, null);

                    $newHandler.append($condition);
                    break;

                default:
                    var $thisHandlerAction = _rules._getCurrentHandlerAction($condition);
                    if (!_rules._isRootItem($condition)
                        && $nextHandler.length === 0
                        && $thisHandler.find(">li").length === 1
                        && thisHandlerType === "If")
                    {
                        var $grandParentHandler = _rules._getCurrentHandler($thisHandlerAction);
                        var grandParentHandlerType = _rules._getHandlerType($grandParentHandler);

                        _rules._removeItemPrefixes($grandParentHandler); //sanitize
                        var $thisHandlerActionNextSibling = $thisHandlerAction.next();
                        var thisHandlerActionNextSiblingType =
                            _rules._getCurrentItemType($thisHandlerActionNextSibling);

                        switch (thisHandlerActionNextSiblingType)
                        {
                            case "Action":
                                if ($thisHandlerAction.children(".rulesUl").length === 1)
                                {
                                    $thisHandlerActionNextSibling.after($thisHandlerAction);
                                }
                                else
                                {
                                    $newHandlerAction = _rules._createHandlerAction(null, true, true, false, null, context);

                                    $thisHandlerActionNextSibling.after($newHandlerAction);
                                    $newHandlerAction.append($thisHandler);
                                }
                                break;

                            case "HandlerAction":
                                var nextHandlerActionIsCurrent = !$thisHandlerActionNextSibling.hasClass("inactive");
                                var thisHandlerActionIsCurrent = !$thisHandlerAction.hasClass("inactive");
                                var $childrenToMove;

                                if (!nextHandlerActionIsCurrent && thisHandlerActionIsCurrent)
                                {
                                    $childrenToMove = $thisHandlerAction.children();
                                    $thisHandlerActionNextSibling.prepend($childrenToMove);
                                }
                                else
                                {
                                    $childrenToMove = $thisHandlerActionNextSibling.children();
                                    $thisHandlerAction.append($childrenToMove);
                                }

                                _rules._moveConditionDown(event, $condition);
                                break;

                            default:
                                $grandParentHandler.after($thisHandler);
                                break;
                        }
                    }
                    else
                    {
                        $nextHandler = $thisHandler.next("ul");
                        var nextHandlerType = _rules._getHandlerType($nextHandler, true);
                        var $targetHandler;
                        if ($thisHandler.find(">li").length === 1
                            && $nextHandler.length > 0
                            && thisHandlerType === "If")
                        {
                            //move into next handler
                            $targetHandler = $nextHandler;
                        }
                        else
                        {
                            //move below current handler, but not into next yet.
                            $targetHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false, null,
                                SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext(), null, null, $thisHandler, null);
                        }

                        _rules._prependItemToHandler($condition, $targetHandler);
                    }
                    break;
            }

            //cleanup
            if ((thisHandlerType === "If" || thisHandlerType === "Always")
                && $thisHandler.find(">li.action, >li.condition, >li.handler-action").length === 0)
            {
                $thisHandler.remove();
            }

            _rules._dirtyHandlerCleanup();
            _rules._checkMovedItemState($condition);
        },

        _moveExecutionGroupUp: function (event, $executionGroup)
        {
            /*
                Moved execution group is just moving a collection of actions.
                So the same rules should apply.
            */
            var $actionList = $executionGroup.find("li.action");
            _rules._moveActionUp(event, $actionList);
            //restore selection
            $executionGroup = $actionList.closest("li.action.prefix");
            $executionGroup.addClass("selected");
            _rules._scrollTo($executionGroup);
            _rules._setExecutionGroupMobilitySettings($executionGroup, $("#rwBottomPaneToolbar"));
        },

        _moveExecutionGroupDown: function (event, $executionGroup)
        {
            /*
                Moved execution group is just moving a collection of actions.
                So the same rules should apply.
            */
            var $actionList = $executionGroup.find("li.action");
            _rules._moveActionDown(event, $actionList);
            //restore selection
            $executionGroup = $actionList.closest("li.action.prefix");
            $executionGroup.addClass("selected");
            _rules._scrollTo($executionGroup);
            _rules._setExecutionGroupMobilitySettings($executionGroup, $("#rwBottomPaneToolbar"));
        },

        _getCombinedSettings: function (settingsNode)
        {
            //don't merge just override mreging doesnt make sense
            var existingCollections = settingsNode.selectSingleNode("Collections");
            if (!checkExists(existingCollections))
            {
                var ownerDocument = settingsNode.ownerDocument;
                var settingResultName = settingsNode.getAttribute("ResultName");
                var resultNamePart = "not(@ResultName)";
                if (checkExists(settingResultName) && settingResultName !== "")
                    resultNamePart = "@ResultName='{0}'".format(settingResultName);
                var xpath = "RuleDefinitions/Settings/Setting[{0}]/Collections".format(resultNamePart);

                var settingsConfiguration = ownerDocument.documentElement.selectSingleNode(xpath);

                if (checkExists(settingsConfiguration)) settingsNode.appendChild(settingsConfiguration.cloneNode(true));
            }

            return settingsNode;
        },

        _setupConfiguration: function (configurationNode, jq_this, silentMap)
        {
            if (jq_this.hasClass('disabled') === false)
            {
                jQuery("#ruleWizardPopup").modalize(true).showBusy(true);
                setTimeout(function ()
                {
                    var configWidget = configurationNode.getAttribute("Widget");
                    var configMethod = configurationNode.getAttribute("Method");
                    var jq_ListItem = jq_this.closest("li");

                    var widgetParametersNode = configurationNode.selectSingleNode("Parameters");

                    var ruleConfigWidgetObj = eval(configWidget);
                    configWidget = new ruleConfigWidgetObj();

                    var configurationValue = jq_this.data("value");

                    if (configurationValue)
                    {
                        configWidget.value = configurationValue;
                    }

                    var containerData = jq_ListItem.data();
                    if (checkExists(containerData))
                    {
                        configWidget.containerData = containerData;
                    }

                    var settingsArray = [];

                    var settingNodes = configurationNode.selectNodes("Settings/Setting");
                    var settingNodesLength = settingNodes.length;

                    for (s = 0; s < settingNodesLength; s++)
                    {
                        var settingsObj = {};
                        var currentSetting = _rules._getCombinedSettings(settingNodes[s]);

                        settingsObj.Name = currentSetting.getAttribute("Name");
                        settingsObj.ResultName = currentSetting.getAttribute("ResultName");
                        settingsObj.Collections = currentSetting.selectSingleNode("Collections");

                        //***Settings Target***//
                        var settingsTarget = {};
                        var settingTargetNode = currentSetting.selectSingleNode("Target");

                        if (settingTargetNode !== null)
                        {
                            var settingsTargetWidget = settingTargetNode.getAttribute("Widget");
                            var settingsTargetWidgetMethod = settingTargetNode.getAttribute("Method");

                            settingsTarget.Widget = settingsTargetWidget;
                            settingsTarget.Method = settingsTargetWidgetMethod;
                            //***Settings Target***//

                            //***Settings Target Parameters***//
                            var settingsTargetParameters = _rules._createParameters(settingTargetNode.selectSingleNode("Parameters"), jq_ListItem);
                            //***Settings Target Parameters***//

                            //***Settings Contexts***//
                            if (settingsTargetParameters === false)
                            {
                                jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                                return false;
                            }

                            settingsObj.Target = settingsTarget;
                            settingsTarget.Parameters = settingsTargetParameters;
                        }

                        //var settingsContextsNode = configurationNode.selectSingleNode("Settings/Setting/Contexts");
                        var settingsContextsNode = currentSetting.selectSingleNode("Contexts");


                        if ($chk(settingsContextsNode))
                        {
                            _rules._createPartContexts(settingsObj, settingsContextsNode, jq_ListItem);
                        }
                        //***Settings Contexts***//

                        settingsArray.push(settingsObj);
                    }

                    configWidget.Settings = settingsArray;

                    with (configWidget)
                    {
                        var fn = eval(configMethod).bind(configWidget);
                        _rules._createWidgetParameters(configWidget, widgetParametersNode, jq_this);

                        configWidget.silentMap = silentMap;

                        try
                        {
                            var result = fn.call();
                        }
                        catch (e)
                        {
                            jQuery("#ruleWizardPopup").modalize(false).showBusy(false);
                            alert("Widget Error:" + e.message);
                            throw e;
                        }
                    }
                }, 50);
            }
        },

        _loadRuleDefinition: function (ruleID, ignoreConditionsActions, ignoreEventDuplicateCheck)
        {
            var currentRuleXML = _rules.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + ruleID + "']");
            if ($chk(currentRuleXML))
            {
                var ruleInvalidAttr = currentRuleXML.getAttribute("Invalid");
                _rules.ruleContainsError = ruleInvalidAttr === null ? false : ruleInvalidAttr === "true";
                _rules.tmpContextDefinition = SourceCode.Forms.Designers.Rule.contextDefinition;
                _rules.tmpConfiguredRulesDefinitionXML = parseXML(SourceCode.Forms.Designers.Rule.configuredRulesDefinitionXML.xml);

                var currentRuleEventsXML = currentRuleXML.selectNodes("Events/Event");
                _rules.busyLoading = true;
                //Rule Properties
                var isSingleSpinnerNode = currentRuleXML.selectSingleNode("SingleSpinner");
                SourceCode.Forms.Designers.Rule.Properties.isSingleSpinner = isSingleSpinnerNode !== null ? isSingleSpinnerNode.text.toLowerCase() === "true" : false;

                // Set Rule Name & Description
                var ruleNameNode = currentRuleXML.selectSingleNode("Name");
                var ruleFriendlyNameNode = currentRuleXML.selectSingleNode("FriendlyName");
                var ruleDescriptionNode = currentRuleXML.selectSingleNode("Description");
                SourceCode.Forms.Designers.Rule.ruleName = ruleNameNode === undefined ? "" : ruleNameNode.text;
                SourceCode.Forms.Designers.Rule.ruleFriendlyName = ruleFriendlyNameNode === undefined ? "" : ruleFriendlyNameNode.text;
                SourceCode.Forms.Designers.Rule.ruleDescription = ruleDescriptionNode === undefined ? "" : ruleDescriptionNode.text;

                var isCustomNameNode = currentRuleXML.selectSingleNode("IsCustomName");
                var isCustomName = checkExists(isCustomNameNode) ? isCustomNameNode.text.toLowerCase() === "true" : false;

                //Adding existing events
                var eventsLength = currentRuleEventsXML.length;
                for (var e = 0; e < eventsLength; e++)
                {
                    var currentEventXML = currentRuleEventsXML[e];
                    var transformFailed = currentEventXML.getAttribute("TransformFailed") !== null ? true : false;

                    if (!transformFailed)
                    {
                        var eventName = currentEventXML.getAttribute("Name");
                        var eventIsCurrentHandler = currentEventXML.getAttribute("IsCurrentHandler").toLowerCase();
                        var eventParts = currentEventXML.selectNodes("Parts/Part");
                        var eventPartsLength = eventParts.length;
                        var eventIsInvalid = currentEventXML.getAttribute("Invalid") !== null ? true : false; // Validation

                        var eventIsEnabled = true;
                        var ignoreSettingTabText = true;
                        var listItemID = SourceCode.Forms.Designers.Rule.Events._eventClicked(eventName, eventIsCurrentHandler, eventIsEnabled, null, ignoreEventDuplicateCheck, ignoreSettingTabText);
                        var jq_listItem = jQuery("#" + listItemID);
                        var invalidEventPartsArray = []; // Validation
                        var definitionID = currentEventXML.getAttribute("DefinitionID");
                        var eventCommentsNode = currentEventXML.selectSingleNode("Comments");
                        var eventComments = eventCommentsNode !== null ? eventCommentsNode.text : null;

                        if (checkExistsNotEmpty(eventComments))
                        {
                            _rules._setCommentValue(listItemID, eventComments);
                        }

                        if (definitionID !== null)
                        {
                            SourceCode.Forms.WizardContainer.definitionID = definitionID;
                        }

                        jq_listItem.data("ID", currentEventXML.getAttribute("ID"));
                        jq_listItem.data("DefinitionID", currentEventXML.getAttribute("DefinitionID"));
                        jq_listItem.data("handlerXml", currentEventXML);
                        if (eventIsInvalid === true)
                        {
                            jq_listItem.addClass("in-error");
                            var validationMessage = currentEventXML.getAttribute("ValidationMessage");
                            if (checkExistsNotEmpty(validationMessage))
                            {
                                var analyzerService = SourceCode.Forms.Services.AnalyzerResourcesService();
                                var eventTitle = analyzerService.getValidationMessages(validationMessage);
                                if (!checkExistsNotEmpty(eventTitle))
                                {
                                    var eventText = jq_listItem.data("xml").selectSingleNode("Message").text;
                                    eventTitle = Resources.RuleDesigner.ErrorEventPartNotConfigured.format(eventText);
                                }

                                if (eventIsCurrentHandler === "false")
                                {
                                    eventTitle.push(Resources.RuleDesigner.InheritedRuleItemInErrorToolTip);
                                }

                                eventTitle = eventTitle.join(".\n");

                                jq_listItem.attr("title", eventTitle);
                            }
                        }

                        for (var p = 0; p < eventPartsLength; p++)
                        {
                            var currentPart = eventParts[p];
                            var currentPartName = currentPart.getAttribute("Name");
                            var currentPartDisplay = currentPart.selectSingleNode("Display").text;
                            var currentPartValue = currentPart.selectSingleNode("Value").text;
                            var loadPartName = ""; // Validation
                            var loadPart; // Validation
                            var currentDataValue = currentPart.selectSingleNode("Data") !== null ? currentPart.selectSingleNode("Data/*") : null;
                            var listItemParts = jq_listItem.find("a:not(.toolbar-button)");
                            var listItemPartsLength = listItemParts.length;
                            var partIsInvalid = currentPart.getAttribute("Invalid") !== null ? true : false;

                            for (var l = 0; l < listItemPartsLength; l++)
                            {
                                var jq_part = jQuery(listItemParts[l]);
                                loadPartName = jq_part.data("xml").getAttribute("LoadPart") !== null ? jq_part.data("xml").getAttribute("LoadPart") : ""; // Validation
                                loadPart = jq_listItem.find("a[PartName='" + loadPartName + "']"); // Validation

                                if (jq_part.data("name") === currentPartName)
                                {
                                    if ($chk(currentPartValue))
                                    {
                                        var setValue = true; // Validation
                                        for (var q = 0; q < invalidEventPartsArray.length; q++)// Validation
                                        {// Validation
                                            if (invalidEventPartsArray[q] === jq_part.attr("id"))// Validation
                                            {
                                                setValue = false; // Validation
                                                break; // Validation
                                            } // Validation
                                        } // Validation

                                        if (setValue === true)// Validation
                                        {
                                            jq_part.text(currentPartDisplay);
                                            jq_part.data("value", currentPartValue);
                                            jq_part.data("data", currentDataValue);

                                            if (!partIsInvalid)
                                            {
                                                jq_part.addClass("visited");
                                                jq_part.removeClass("dependant");
                                                jq_part.removeClass("disabled");
                                            } else
                                            {
                                                jq_part.removeClass("visited");
                                                jq_part.removeClass("disabled");
                                                jq_part.addClass("dependant");
                                                jq_part.addClass("rule-invalid");
                                                jq_part.addClass("in-error");
                                            }
                                        } // Validation
                                    } else
                                    {
                                        if (loadPart.length > 0)// Validation
                                        {
                                            invalidEventPartsArray.push(loadPart.attr("id"));
                                        } // Validation

                                        jq_part.addClass("dependant"); // Validation
                                        jq_part.removeClass("disabled"); // Validation
                                    }

                                    if (eventIsCurrentHandler !== 'true')
                                    {
                                        jq_part.addClass("rule-part-inactive");
                                    }

                                    break;
                                }
                            }
                        }
                    } else
                    {
                        popupManager.showWarning(Resources.RuleDesigner.EventTransformationFailedMsg);
                    }
                }

                if (checkExists(ignoreConditionsActions) && ignoreConditionsActions === true)
                {
                    _rules.busyLoading = false;
                }
                else
                {
                    var handlerElements = currentRuleXML.selectNodes("Handlers/Handler");
                    var handlersLength = handlerElements.length;

                    for (var h = 0; h < handlersLength; h++)
                    {
                        _rules._loadRuleHandler(handlerElements[h]);
                    }
                }

                SourceCode.Forms.Designers.Rule.Wizard.setRuleTabText(SourceCode.Forms.Designers.Rule.ruleName, isCustomName);
                SourceCode.Forms.Designers.Rule.Wizard._setRuleTabBadging(_rules.ruleContainsError);
                SourceCode.Forms.WizardContainer.setRuleSettingsState();
            }

            _rules._dirtyHandlerCleanup();
            _rules.busyLoading = false;
        },

        _loadRuleHandler: function (currentHandler, parentObj)
        {
            // Create handler and set properties //
            var currentHandlerID = currentHandler.getAttribute("ID");
            var handlerType = currentHandler.getAttribute("HandlerType");
            var handlerIsReference = currentHandler.getAttribute("IsReference");
            handlerIsReference = handlerIsReference === "False" ? false : true;
            var handlerDefinitionID = currentHandler.getAttribute("DefinitionID");
            var handlerIsInherited = currentHandler.getAttribute("IsInherited");
            var handlerIsEnabled = currentHandler.getAttribute("IsEnabled").toLowerCase() === "true" ? true : false;
            var handlerIsCurrent = handlerIsReference === true ? "false" : "true";
            var handlerContext = currentHandler.getAttribute("Context").toLowerCase();


            var handlerName = currentHandler.getAttribute("Name");
            if (!checkExistsNotEmpty(handlerName))
            {
                handlerName = "IfLogicalHandler";
            }
            //(handlerName, handlerID, isCurrentHandler, isEnabled, isInherited, handlerDefinitionID, context, defaultValues, insertBeforeObj, insertAfterObj, appendToObj)
            var $handlerUl = SourceCode.Forms.Designers.Rule._addHandler(handlerName, currentHandlerID, handlerIsCurrent, handlerIsEnabled, handlerIsInherited, handlerDefinitionID, handlerContext, null, null, null, parentObj);

            // Create handler and set properties //

            var transformFailed = currentHandler.getAttribute("TransformFailed") !== null ? true : false;

            if (!transformFailed)
            {

                var handlerParts = currentHandler.selectNodes("Parts/Part");
                var handlerPartsLength = handlerParts.length;
                var invalidHandlerPartsArray = [];

                for (var p = 0; p < handlerPartsLength; p++)
                {
                    var currentPart = handlerParts[p];
                    var currentPartName = currentPart.getAttribute("Name");
                    var currentPartDisplay = currentPart.selectSingleNode("Display").text;
                    var currentPartValue = currentPart.selectSingleNode("Value").text;
                    var currentDataValue = currentPart.selectSingleNode("Data") !== null ? currentPart.selectSingleNode("Data/*") : null;
                    var loadPartName = ""; // Validation
                    var loadPart; // Validation
                    var listItemParts = $handlerUl.find("a:not(.toolbar-button)");
                    var listItemPartsLength = listItemParts.length;
                    var partIsInvalid = currentPart.getAttribute("Invalid") !== null ? true : false;

                    for (var l = 0; l < listItemPartsLength; l++)
                    {
                        var $part = $(listItemParts[l]);
                        loadPartName = checkExists($part.data("xml")) ? $part.data("xml").getAttribute("LoadPart") : ""; // Validation

                        if (checkExistsNotEmpty(loadPartName))
                        {
                            loadPart = $handlerUl.find("a[PartName='" + loadPartName + "']"); // Validation
                        }

                        if ($part.data("name") === currentPartName)
                        {
                            if ($chk(currentPartValue))
                            {
                                var setValue = true; // Validation
                                for (var q = 0; q < invalidHandlerPartsArray.length; q++)// Validation
                                {// Validation
                                    if (invalidHandlerPartsArray[q] === $part.attr("id"))// Validation
                                    {
                                        setValue = false; // Validation
                                        break; // Validation
                                    } // Validation
                                } // Validation

                                if (setValue === true)// Validation
                                {
                                    $part.text(currentPartDisplay);
                                    $part.data("value", currentPartValue);
                                    $part.data("data", currentDataValue);

                                    if (!partIsInvalid)
                                    {
                                        $part.addClass("visited");
                                        $part.removeClass("dependant");
                                        $part.removeClass("disabled");
                                    }
                                    else
                                    {
                                        $part.removeClass("visited");
                                        $part.removeClass("disabled");
                                        $part.addClass("dependant");
                                        $part.addClass("rule-invalid");
                                        $part.addClass("in-error");

                                        $part.closest("ul.rulesUl").addClass("in-error");
                                    }
                                } // Validation
                            }
                            else
                            {
                                if (checkExists(loadPart) && loadPart.length > 0)// Validation
                                {
                                    invalidHandlerPartsArray.push(loadPart.attr("id"));
                                } // Validation

                                $part.addClass("dependant"); // Validation
                                $part.removeClass("disabled"); // Validation
                                $part.closest("ul.rulesUl").addClass("in-error");
                            }

                            if (handlerIsCurrent !== 'true')
                            {
                                $part.addClass("rule-part-inactive");
                            }

                            break;
                        }
                    }
                }

                var handlerCommentsNode = currentHandler.selectSingleNode("Comments");
                var handlerComments = handlerCommentsNode !== null ? handlerCommentsNode.text : null;

                if (checkExistsNotEmpty(handlerComments))
                {
                    // TODO: Do not remove as this will be implemented once handlers and nested ifs are implemented
                    //_rules._setCommentValue($handlerUl);
                }
            }
            else
            {
                popupManager.showWarning(Resources.RuleDesigner.HandlerTransformationFailedMsg);
            }

            //Adding existing conditions
            var currentRuleConditionsXML = currentHandler.selectNodes("Conditions/Condition");
            var conditionsLength = currentRuleConditionsXML.length;
            for (var c = 0; c < conditionsLength; c++)
            {
                var currentConditionXML = currentRuleConditionsXML[c];
                _rules._loadRuleConditions(currentConditionXML, currentHandler, $handlerUl);
            }

            //Adding existing actions
            var currentRuleActionsXML = currentHandler.selectNodes("Actions/Action");
            var actionsLength = currentRuleActionsXML.length;
            for (var a = 0; a < actionsLength; a++)
            {
                var currentActionXML = currentRuleActionsXML[a];
                _rules._loadRuleActions(currentActionXML, currentHandler, $handlerUl);
            }

            return $handlerUl;
        },

        _loadRuleActions: function (currentActionXML, currentHandler, handlerUL)
        {
            var invalidActionPartsArray = []; // Validation			
            var transformFailed = currentActionXML.getAttribute("TransformFailed") !== null ? true : false;

            if (!transformFailed)
            {
                var actionName = currentActionXML.getAttribute("Name");
                var actionIsCurrentHandler = currentActionXML.getAttribute("IsCurrentHandler").toLowerCase();
                var actionParts = currentActionXML.selectNodes("Parts/Part");
                var actionPartsLength = actionParts.length;
                var actionIsInvalid = currentActionXML.getAttribute("Invalid") !== null ? true : false; // Validation
                var actionIsEnabled = currentActionXML.getAttribute("Enabled").toLowerCase() === "true" ? true : false;
                var context = currentActionXML.getAttribute("Context") ? currentActionXML.getAttribute("Context") : SourceCode.Forms.WizardContainer.currentRuleWizardContext;
                var actionID = currentActionXML.getAttribute("ID");
                var actionDefinitionID = currentActionXML.getAttribute("DefinitionID");
                var invalidPartEnablesConfig = false;
                var jq_listItem;
                var configurationErrorMsg;

                if (actionName === "HandlerAction")
                {
                    var handlerElements = currentActionXML.selectNodes("Handlers/Handler");
                    var handlersLength = handlerElements.length;
                    var handlerAction = _rules._createHandlerAction(actionID, actionIsCurrentHandler,
                        actionIsEnabled, null, actionDefinitionID, context);

                    handlerAction.data("handlerXml", currentActionXML);
                    handlerUL.append(handlerAction);

                    for (var h = 0; h < handlersLength; h++)
                    {
                        _rules._loadRuleHandler(handlerElements[h], handlerAction);
                    }
                }
                else
                {
                    var listItemID = SourceCode.Forms.Designers.Rule.Actions._actionClicked(actionName,
                        actionIsCurrentHandler, actionIsEnabled, context.toLowerCase(), null, handlerUL);

                    jq_listItem = jQuery("#" + listItemID);
                    jq_listItem.data("ID", actionID);
                    jq_listItem.data("DefinitionID", actionDefinitionID);
                    jq_listItem.data("handlerXml", currentActionXML);
                    jq_listItem.data("Context", context);

                    if (actionIsInvalid === true)
                    {
                        var actionText = jq_listItem.data("xml").selectSingleNode("Message").text;
                        jq_listItem.addClass("in-error");
                        var title = Resources.RuleDesigner.ErrorActionPartNotConfigured.format(actionText);
                        jq_listItem.attr("title", title);
                    }

                    var actionCommentsNode = currentActionXML.selectSingleNode("Comments");
                    var actionComments = null;
                    if (actionCommentsNode !== null)
                    {
                        actionComments = actionCommentsNode.text;
                    }

                    if (checkExistsNotEmpty(actionComments))
                    {
                        _rules._setCommentValue(listItemID, actionComments);
                    }

                    for (var p = 0; p < actionPartsLength; p++)
                    {
                        var currentPart = actionParts[p];
                        var currentPartName = currentPart.getAttribute("Name");
                        var currentPartDisplay = currentPart.selectSingleNode("Display").text;
                        var currentPartValue = currentPart.selectSingleNode("Value").text;
                        var currentDataValue = null;
                        if (currentPart.selectSingleNode("Data") !== null)
                        {
                            currentDataValue = currentPart.selectSingleNode("Data/*");
                        }
                        var loadPartName = ""; // Validation
                        var loadPart; // Validation
                        var listItemParts = jq_listItem.find("a:not(.toolbar-button)");
                        var listItemPartsLength = listItemParts.length;
                        var partIsInvalid = currentPart.getAttribute("Invalid") !== null ? true : false;

                        for (var l = 0; l < listItemPartsLength; l++)
                        {
                            var jq_part = jQuery(listItemParts[l]);
                            loadPartName = "";
                            if (jq_part.data("xml").getAttribute("LoadPart") !== null)
                            {
                                jq_part.data("xml").getAttribute("LoadPart"); // Validation
                            }
                            loadPart = jq_listItem.find("a[PartName='" + loadPartName + "']"); // Validation									

                            if (jq_part.data("name") === currentPartName)
                            {
                                if (checkExists(currentPartValue))
                                {
                                    jq_part.text(currentPartDisplay);
                                    jq_part.data("value", currentPartValue);
                                    jq_part.data("data", currentDataValue);

                                    if (!partIsInvalid)
                                    {
                                        jq_part.addClass("visited");
                                        jq_part.removeClass("dependant");
                                        jq_part.removeClass("disabled");
                                    }
                                    else
                                    {
                                        jq_part.removeClass("visited");
                                        jq_part.removeClass("disabled");
                                        jq_part.addClass("dependant");
                                        jq_part.addClass("rule-invalid");
                                        jq_part.addClass("in-error");

                                        if (checkExistsNotEmpty(jq_part.data("activatesConfiguration")))
                                        {
                                            configurationErrorMsg = jq_part.data("configurationErrorMsg");
                                            invalidPartEnablesConfig = true;
                                        }
                                    }
                                } else
                                {
                                    if (loadPart.length > 0)// Validation
                                    {
                                        invalidActionPartsArray.push(loadPart.attr("id"));
                                    } // Validation

                                    jq_part.addClass("dependant"); // Validation
                                    jq_part.removeClass("disabled"); // Validation
                                }

                                if (actionIsCurrentHandler !== 'true')
                                {
                                    jq_part.addClass("rule-part-inactive");
                                }

                                break;
                            }
                        }
                    }

                    //Set configuration
                    var mappings = currentActionXML.selectSingleNode("Mappings");
                    var jq_mappingElement = jq_listItem.find(".mappingConfiguration").eq(0);

                    if (jq_mappingElement.length > 0)
                    {
                        jq_mappingElement.removeClass("disabled");

                        var mappingsExist = checkExists(mappings);
                        if (mappingsExist)
                        {
                            jq_mappingElement.data("value", mappings.xml);
                            jq_mappingElement.addClass("visited");
                            jq_mappingElement.removeClass("dependant");
                        }

                        if (mappingsExist && mappings.getAttribute("Invalid") === "true")
                        {
                            jq_mappingElement.addClass("in-error");
                            jq_listItem.addClass("in-error");
                        }
                        else if (!mappingsExist)
                        {
                            jq_mappingElement.addClass("dependant");
                            jq_mappingElement.removeClass("visited");

                            if (invalidPartEnablesConfig)
                            {
                                jq_listItem.addClass("in-error");
                                jq_mappingElement.addClass("in-error");
                                jq_mappingElement.addClass("disabled");
                            }
                        }

                        if (invalidPartEnablesConfig === true)
                        {
                            jq_mappingElement.addClass("disabled");
                        }
                    }

                    if (checkExistsNotEmpty(configurationErrorMsg))
                    {
                        jq_listItem.attr("title", configurationErrorMsg);

                        if (jq_mappingElement.length > 0)
                        {
                            jq_mappingElement.attr("title", configurationErrorMsg);
                        }
                    }
                }
                return jq_listItem;
            }
            else
            {
                popupManager.showWarning(Resources.RuleDesigner.ActionTransformationFailedMsg);
            }
        },

        _loadRuleConditions: function (currentConditionXML, currentHandler, handlerUL)
        {
            var transformFailed = currentConditionXML.getAttribute("TransformFailed") !== null ? true : false;

            if (!transformFailed)
            {
                var conditionName = currentConditionXML.getAttribute("Name");
                var conditionIsCurrentHandler = currentConditionXML.getAttribute("IsCurrentHandler").toLowerCase();
                var conditionParts = currentConditionXML.selectNodes("Parts/Part");
                var conditionIsInvalid = currentConditionXML.getAttribute("Invalid") !== null ? true : false; // Validation
                var conditionPartsLength = conditionParts.length;
                var conditionIsEnabled = currentConditionXML.getAttribute("Enabled").toLowerCase() === "true" ? true : false;
                var context = currentConditionXML.getAttribute("Context") ? currentConditionXML.getAttribute("Context") : SourceCode.Forms.WizardContainer.currentRuleWizardContext;
                var listItemID = SourceCode.Forms.Designers.Rule.Conditions._conditionClicked(conditionName, conditionIsCurrentHandler, conditionIsEnabled, context.toLowerCase(), null, handlerUL);
                var jq_listItem = jQuery("#" + listItemID);
                var invalidConditionPartsArray = []; // Validation
                var invalidPartEnablesConfig = false;

                jq_listItem.data("ID", currentConditionXML.getAttribute("ID"));
                jq_listItem.data("DefinitionID", currentConditionXML.getAttribute("DefinitionID"));
                jq_listItem.data("handlerXml", currentConditionXML);
                jq_listItem.data("Context", context);
                if (conditionIsInvalid === true)
                {
                    var conditionText = jq_listItem.data("xml").selectSingleNode("Message").text;
                    jq_listItem.addClass("in-error");
                    jq_listItem.attr("title", Resources.RuleDesigner.ErrorConditionPartNotConfigured.format(conditionText));
                }

                var conditionCommentsNode = currentConditionXML.selectSingleNode("Comments");
                var conditionComments = conditionCommentsNode !== null ? conditionCommentsNode.text : null;

                if (checkExistsNotEmpty(conditionComments))
                {
                    _rules._setCommentValue(listItemID, conditionComments);
                }

                for (var p = 0; p < conditionPartsLength; p++)
                {
                    var currentPart = conditionParts[p];
                    var currentPartName = currentPart.getAttribute("Name");
                    var currentPartDisplay = currentPart.selectSingleNode("Display").text;
                    var currentPartValue = currentPart.selectSingleNode("Value").text;
                    var currentDataValue = currentPart.selectSingleNode("Data") !== null ? currentPart.selectSingleNode("Data/*") : null;
                    var loadPartName = ""; // Validation
                    var loadPart; // Validation
                    var listItemParts = jq_listItem.find("a:not(.toolbar-button)");
                    var listItemPartsLength = listItemParts.length;
                    var partIsInvalid = currentPart.getAttribute("Invalid") !== null ? true : false;

                    for (var l = 0; l < listItemPartsLength; l++)
                    {
                        var jq_part = jQuery(listItemParts[l]);
                        loadPartName = jq_part.data("xml").getAttribute("LoadPart") !== null ? jq_part.data("xml").getAttribute("LoadPart") : ""; // Validation
                        loadPart = jq_listItem.find("a[PartName='" + loadPartName + "']"); // Validation									

                        if (jq_part.data("name") === currentPartName)
                        {
                            if ($chk(currentPartValue))
                            {
                                var setValue = true; // Validation
                                for (var q = 0; q < invalidConditionPartsArray.length; q++)// Validation
                                {// Validation
                                    if (invalidConditionPartsArray[q] === jq_part.attr("id"))// Validation
                                    {
                                        setValue = false; // Validation
                                        break; // Validation
                                    } // Validation
                                } // Validation

                                if (setValue === true)// Validation
                                {
                                    jq_part.text(currentPartDisplay);
                                    jq_part.data("value", currentPartValue);
                                    jq_part.data("data", currentDataValue);

                                    if (!partIsInvalid)
                                    {
                                        jq_part.addClass("visited");
                                        jq_part.removeClass("dependant");
                                        if (!invalidPartEnablesConfig)
                                        {
                                            jq_part.removeClass("disabled");
                                        }
                                    }
                                    else
                                    {
                                        jq_part.removeClass("visited");
                                        jq_part.removeClass("disabled");
                                        jq_part.addClass("dependant");
                                        jq_part.addClass("rule-invalid");
                                        jq_part.addClass("in-error");

                                        if (currentPartName === "Activity")
                                        {
                                            invalidPartEnablesConfig = true;
                                        }
                                    }
                                } // Validation
                            } else
                            {
                                if (loadPart.length > 0)// Validation
                                {
                                    invalidConditionPartsArray.push(loadPart.attr("id"));
                                } // Validation

                                jq_part.addClass("dependant"); // Validation
                                jq_part.removeClass("disabled"); // Validation
                            }

                            if (conditionIsCurrentHandler !== 'true')
                            {
                                jq_part.addClass("rule-part-inactive");
                            }

                            break;
                        }
                    }
                }

                return jq_listItem;
            }
            else
            {
                popupManager.showWarning(Resources.RuleDesigner.ConditionTransformationFailedMsg);
            }
        },

        _doAutoSelects: function ()
        {
            var events = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectNodes("SourceCode.Forms/RuleDefinitions/Events/Event");
            var actions = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectNodes("SourceCode.Forms/RuleDefinitions/Actions/Action");
            var context = "form";
            if (events.length === 1)
            {
                var eventName = events[0].getAttribute("Name");
                var eventIsEnabled = true;
                _rules.Events._eventClicked(eventName, "true", eventIsEnabled);
            }

            if (actions.length === 1)
            {
                var actionName = actions[0].getAttribute("Name");
                var actionIsEnabled = true;
                _rules.Actions._actionClicked(actionName, "true", actionIsEnabled, context);
            }
        },

        _createPartTarget: function (widget, settingsTargetsNode, jq_ListItem)
        {
            if (checkExists(settingsTargetsNode))
            {
                var settingsTarget = {};
                var settingsTargetWidget = settingsTargetsNode.getAttribute("Widget");
                var settingsTargetWidgetMethod = settingsTargetsNode.getAttribute("Method");
                var settingsTargetParameters = _rules._createParameters(settingsTargetsNode.selectSingleNode("Parameters"), jq_ListItem);

                settingsTarget.Parameters = settingsTargetParameters;
                settingsTarget.Widget = settingsTargetWidget;
                settingsTarget.Method = settingsTargetWidgetMethod;

                widget.Target = settingsTarget;
            }
        },

        _createPartContexts: function (widget, settingsContextsNode, jq_ListItem)
        {
            if ($chk(settingsContextsNode))
            {
                var settingsContextsArray = [];

                var settingsContextsNodes = settingsContextsNode.selectNodes("Context");
                var extendedParameters = settingsContextsNode.selectSingleNode("ExtendEventContextParameters/Parameters");

                for (var c = 0; c < settingsContextsNodes.length; c++)
                {
                    var settingsContext = {};
                    var settingsContextPlugIn = settingsContextsNodes[c].getAttribute("PlugIn");
                    var settingsContextPlugInMethod = settingsContextsNodes[c].getAttribute("Method");
                    var settingsContextParameters = _rules._createParameters(settingsContextsNodes[c].selectSingleNode("Parameters"), jq_ListItem);

                    settingsContext.Parameters = settingsContextParameters;
                    settingsContext.PlugIn = settingsContextPlugIn;
                    settingsContext.Method = settingsContextPlugInMethod;

                    settingsContextsArray.push(settingsContext);
                }

                //***Rule Context***//
                if ($chk(settingsContextsNode.getAttribute("IncludeEventContexts")) && settingsContextsNode.getAttribute("IncludeEventContexts") !== "False")
                {
                    for (var l = 0; l < jQuery("#ruleDefinitionRulesArea").children(":not(.event-placeHolder)").length; l++)
                    {
                        var jq_ruleListItem = jQuery(jQuery("#ruleDefinitionRulesArea").children()[l]);
                        var ruleDataXml = jq_ruleListItem.data("xml");
                        var ruleSettingsContextsNodes = ruleDataXml.selectNodes("Configurations/Configuration/Settings/Setting/Contexts/Context");

                        for (var b = 0; b < ruleSettingsContextsNodes.length; b++)
                        {
                            var ruleSettingsContext = {};
                            var extendedParametersCollection = {};
                            var ruleSettingsContextNode = ruleSettingsContextsNodes[b];
                            var ruleSettingsContextPlugIn = ruleSettingsContextNode.getAttribute("PlugIn");
                            var ruleSettingsContextPlugInMethod = ruleSettingsContextNode.getAttribute("Method");
                            var ruleSettingsContextParameters = _rules._createParameters(ruleSettingsContextNode.selectSingleNode("Parameters"), jq_ruleListItem);

                            if (extendedParameters !== null)
                            {
                                extendedParametersCollection = _rules._createParameters(extendedParameters, jq_ruleListItem);
                            }

                            $.extend(ruleSettingsContextParameters, extendedParametersCollection);

                            ruleSettingsContext.Parameters = ruleSettingsContextParameters;
                            ruleSettingsContext.PlugIn = ruleSettingsContextPlugIn;
                            ruleSettingsContext.Method = ruleSettingsContextPlugInMethod;

                            settingsContextsArray.push(ruleSettingsContext);
                        }
                    }
                }
                //***Rule Context***//

                widget.Contexts = settingsContextsArray;
            }
        },

        _createWidgetParameters: function (widget, parametersNode, _this, thisPartValue)
        {
            var jq_this = jQuery(_this);
            var jq_ListItem = jq_this.closest("li");
            var thisPartId = jq_this.attr("id");
            var params = parametersNode.selectNodes("Parameter");
            var parameterSetName = parametersNode.getAttribute("Set");
            var dependantCounter = 0;
            var paramName, context, path, jq_depControl, dependantPartText, errorMsg;

            if ($chk(parameterSetName))
            {
                var parameterSet = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("//ParameterSets/ParameterSet[@Name='" + parameterSetName + "']");

                if ($chk(parameterSet))
                {
                    var parameterSetParameters = parameterSet.selectNodes("Parameter");
                    var parameterSetLength = parameterSetParameters.length;

                    for (var s = 0; s < parameterSetLength; s++)
                    {
                        var parameterSetParameter = parameterSetParameters[s];
                        paramName = parameterSetParameter.getAttribute("Name");
                        context = parameterSetParameter.getAttribute("Context") === "PartControl" ? thisPartId : ""; //Might need some rework.
                        path = parameterSetParameter.getAttribute("Path");

                        if (parameterSetParameter.getAttribute("Part"))
                        {
                            if (path)
                            {
                                val = jQuery("#" + jq_this.data("dependantPart")[dependantCounter]).data("data").selectSingleNode(path).text;
                            }
                            else
                            {
                                jq_depControl = jQuery("#" + jq_this.data("dependantPart")[dependantCounter]);
                                val = jq_depControl.data("value");

                                if ($chk(val) === false)
                                {
                                    dependantPartText = "'" + jq_depControl.text() + "'";
                                    errorMsg = Resources.RuleDesigner.PartDependantError.format(dependantPartText);

                                    popupManager.showNotification(errorMsg);

                                    return;
                                }
                            }

                            dependantCounter++;
                        } else
                        {
                            if (context)
                            {
                                val = context;
                            } else
                            {
                                val = parameterSetParameter.text;
                            }
                        }

                        widget[paramName] = val;
                    }
                }
            }

            for (var p = 0; p < params.length; p++)
            {
                var val;
                paramName = params[p].getAttribute("Name");
                context = params[p].getAttribute("Context") === "PartControl" ? thisPartId : ""; //Might need some rework.
                path = params[p].getAttribute("Path");
                var setPart = params[p].getAttribute("Part");
                var xPath = params[p].getAttribute("XPath");
                var xPathAttribute = params[p].getAttribute("XPathAttribute");

                if (setPart)
                {
                    if (path)
                    {
                        val = jQuery("#" + jq_this.data("dependantPart")[dependantCounter]).data("data").selectSingleNode(path).text;
                    }
                    else
                    {
                        if (jq_this.data("dependantPart"))
                        {
                            jq_depControl = jQuery("#" + jq_this.data("dependantPart")[dependantCounter]);
                            val = jq_depControl.data("value");

                            if ($chk(val) === false)
                            {
                                if ($chk(thisPartValue) === false)
                                {
                                    dependantPartText = "<b>" + jq_depControl.text() + "</b>";
                                    errorMsg = Resources.RuleDesigner.PartDependantError.format(dependantPartText);

                                    popupManager.showNotification(errorMsg);
                                } else
                                {
                                    _this.text(_this.data("xml").selectSingleNode("Display").text);
                                    _this.data("value", null);
                                    _this.data("data", null);

                                    _this.addClass("dependant");
                                    _this.removeClass("visited");
                                    _this.removeClass("disabled");
                                }

                                return;
                            }
                        } else
                        {
                            var setParts = jq_ListItem.find("div.rule-item-wrapper>div:first-child").children("a");

                            for (var r = 0; r < setParts.length; r++)
                            {
                                var jq_setPart = jQuery(setParts[r]);
                                if (jq_setPart.data("xml").getAttribute("Name") === setPart)
                                {
                                    if ($chk(xPath))
                                    {
                                        xPathValueNode = jq_setPart.data("data").selectSingleNode(xPath);
                                        if ($chk(xPathAttribute))
                                        {
                                            if (xPathValueNode !== null)
                                            {
                                                val = xPathValueNode.getAttribute(xPathAttribute);
                                            }
                                        } else
                                        {
                                            if (xPathValueNode !== null)
                                            {
                                                val = xPathValueNode.text;
                                            }
                                        }
                                    } else
                                    {
                                        if ($chk(xPathAttribute))
                                        {
                                            val = jq_setPart.data("data").getAttribute(xPathAttribute);
                                        } else
                                        {
                                            val = jq_setPart.data("value");
                                        }
                                    }

                                    var partText = jq_this.text();

                                    if ($chk(val) === false)
                                    {
                                        errorMsg = Resources.RuleDesigner.PartDependantError.format(partText);

                                        popupManager.showNotification(errorMsg);

                                        return false;
                                    }
                                }
                            }
                        }
                    }

                    dependantCounter++;
                } else
                {
                    if (context)
                    {
                        val = context;
                    } else
                    {
                        val = params[p].text;
                    }
                }

                widget[paramName] = val;
            }

            widget.PopupHeading = this._getHeadingText(widget.PopupHeading, jq_this);
            return true;
        },

        _getHeadingText: function (oldHeading, jq_this)
        {

            var jqListItem = jq_this.closest("li");
            var clonedItem = jqListItem.clone(true);
            var partsDiv = clonedItem.find("div.rule-item-wrapper>div:first-child");

            partsDiv.children("a").each(function (index)
            {
                var jqPart = jQuery(this);
                if (jqPart[0].style.display === "none" || jqPart.data("xml").getAttribute("Name") === "ExecutionType")
                {
                    jqPart.remove();
                }
            });
            var headingText = partsDiv.text();
            headingText = headingText.trim();

            if (headingText !== "")
            {
                return String.properCase(headingText);
            }
            else
                return oldHeading;
        },

        _createParameters: function (parametersNode, jq_ListItem)
        {
            var parametersObj = {};
            var params = parametersNode.selectNodes("Parameter");
            var parameterSetName = parametersNode.getAttribute("Set");
            var value, partText, errorMsg;

            if ($chk(parameterSetName))
            {
                var parameterSet = SourceCode.Forms.Designers.Rule.Wizard.rulesXml.selectSingleNode("//ParameterSets/ParameterSet[@Name='" + parameterSetName + "']");

                if ($chk(parameterSet))
                {
                    var parameterSetParameters = parameterSet.selectNodes("Parameter");
                    var parameterSetLength = parameterSetParameters.length;

                    for (var s = 0; s < parameterSetLength; s++)
                    {
                        var parameterSetParam = parameterSetParameters[s];
                        var setName = parameterSetParam.getAttribute("Name");
                        var setPart = parameterSetParam.getAttribute("Part");

                        if ($chk(setPart))
                        {
                            var setParts = jq_ListItem.find("div.rule-item-wrapper>div").children("a");

                            for (var r = 0; r < setParts.length; r++)
                            {
                                var jq_setPart = jQuery(setParts[r]);
                                if (jq_setPart.data("xml").getAttribute("Name") === setPart)
                                {
                                    value = jq_setPart.data("value");

                                    partText = jq_Part.text();

                                    if ($chk(value) === false)
                                    {
                                        errorMsg = Resources.RuleDesigner.PartDependantError.format(partText);

                                        popupManager.showNotification(errorMsg);

                                        return false;
                                    }
                                }
                            }
                        } else
                        {
                            value = parameterSetParam.text;
                        }

                        parametersObj[setName] = value;
                    }
                }
            }

            for (var p = 0; p < params.length; p++)
            {
                var name = params[p].getAttribute("Name");
                var part = params[p].getAttribute("Part");
                var xPath = params[p].getAttribute("XPath");
                var xPathAttribute = params[p].getAttribute("XPathAttribute");
                value = null; // reset the value, in case it's not found below

                if ($chk(part))
                {
                    var parts = jq_ListItem.find("div.rule-item-wrapper>div").children("a");

                    for (var q = 0; q < parts.length; q++)
                    {
                        var jq_Part = jQuery(parts[q]);
                        var xPathValueNode = null;

                        if (jq_Part.data("xml").getAttribute("Name") === part)
                        {
                            if ($chk(xPath))
                            {
                                var partData = jq_Part.data("data");
                                if (partData !== null)
                                {
                                    xPathValueNode = partData.selectSingleNode(xPath);
                                    if ($chk(xPathAttribute))
                                    {
                                        if (xPathValueNode !== null)
                                        {
                                            value = xPathValueNode.getAttribute(xPathAttribute);
                                        }
                                    }
                                    else
                                    {
                                        if (xPathValueNode !== null)
                                        {
                                            value = xPathValueNode.text;
                                        }
                                        else
                                        {
                                            value = params[p].text;
                                        }
                                    }
                                }
                            }
                            else
                            {
                                if ($chk(xPathAttribute))
                                {
                                    value = jq_Part.data("data").getAttribute(xPathAttribute);
                                }
                                else
                                {
                                    value = jq_Part.data("value");
                                }
                            }

                            partText = jq_Part.text();

                            if ($chk(value) === false)
                            {
                                var errorNode = jq_Part.data("xml").selectSingleNode("Parameters/Parameter[@Name='errorMessage']");
                                errorMsg = Resources.RuleDesigner.PartDependantError.format(partText);

                                if (errorNode !== null && errorNode.text !== '')
                                {
                                    errorMsg = errorNode.text;
                                }

                                popupManager.showWarning(errorMsg);

                                return false;
                            }
                        }
                    }
                } else
                {
                    value = params[p].text;
                }

                parametersObj[name] = value;
            }

            return parametersObj;
        },

        _partClicked: function (_this, forcedClick)
        {
            var jq_thisPart = $(_this);

            if (jq_thisPart.hasClass("disabled"))
            {
                return;
            }

            var thisPartId = jq_thisPart.attr("id");
            var partXML = jq_thisPart.data("xml");
            var partWidget = partXML.getAttribute("Widget");
            var partMethod = partXML.getAttribute("Method");
            var jq_listItem = jq_thisPart.closest("li, ul.rulesUl.handler");
            var listItemIsDisabled = jq_listItem.hasClass('disabled');

            if (forcedClick === false && listItemIsDisabled === true)
            {
                return;
            }
            var thisPartValue = jq_thisPart.data("value");
            SourceCode.Forms.Designers.Rule._partOldValue = thisPartValue;
            if (jq_thisPart.closest("ul#ruleDefinitionRulesArea").length > 0 && typeof jq_thisPart.data("onWidgetCompleted") === "undefined")
            {
                jq_thisPart.data("onWidgetCompleted", function (control)
                {
                    if (
                        $(control).data("value") !== SourceCode.Forms.Designers.Rule._partOldValue &&
                        (SourceCode.Forms.Designers.Rule.ruleNameIsCustom !== true || !checkExistsNotEmpty(SourceCode.Forms.Designers.Rule.ruleName))
                    )
                    {
                        SourceCode.Forms.Designers.Rule.Wizard.setRuleTabText("", false);
                    }
                });
            }

            var widgetPartParametersNode = partXML.selectSingleNode(".//Parameters");
            var widgetPartContextsNode = partXML.selectSingleNode(".//Contexts");
            var widgetPartTargetNode = partXML.selectSingleNode(".//Target");

            var ruleWidgetObj = eval(partWidget);
            var widget = new ruleWidgetObj();

            with (widget)
            {
                var fn = eval(partMethod).bind(widget);
                var success = _rules._createWidgetParameters(widget, widgetPartParametersNode, _this, thisPartValue);
                var settingObj = {};

                if ($chk(success) === false)
                {
                    return;
                }

                if (checkExists(widgetPartTargetNode))
                {
                    success = _rules._createPartTarget(settingObj, widgetPartTargetNode, jq_listItem);

                    widget.Settings = settingObj;
                }

                if ($chk(widgetPartContextsNode))
                {
                    success = _rules._createPartContexts(settingObj, widgetPartContextsNode, jq_listItem);

                    widget.Settings = settingObj;
                }

                if ($chk(thisPartValue) === true)
                {
                    widget.value = thisPartValue;
                }

                if (forcedClick === true)
                {
                    widget.forcedClick = true;
                }
                else
                {
                    widget.forcedClick = false;
                }

                if (partXML.getAttribute("Hidden") !== null)
                {
                    widget.isHidden = true;
                }

                try
                {
                    var result = fn.call();
                }
                catch (e)
                {
                    alert("Widget Error:" + e.message);
                    throw e;
                }
            }
        },

        onWidgetCompleted: function (widget, error)
        {
            var $control = $("#" + widget.controlID);
            var $elem = $control.closest("li, ul.rulesUl.handler");
            var $elemHandler = $elem.closest(".handler");
            var elemTagName = $elem.data("xml").tagName;
            var errorsArray, jq_errorDiv;
            var value = widget.value;

            if (!$chk(error) && widget.validationStatus !== "Missing")
            {
                var previousValue = $control.data("value");
                var previousData = $control.data("data");
                var display = widget.display;
                var data = widget.data;
                var loadPart, partText;
                var doSilentMap = true;
                var subformID = null;
                var instanceID = null;
                var prevSubformID = null;
                var prevInstanceID = null;
                var configurationIsValid = true;
                var configElem;

                if ($chk(value) === false)
                {
                    $control.removeClass("visited");

                    partText = $control.data("xml").selectSingleNode("Display").text;
                    _rules._setPartValues(partText, null, null, $control);
                    loadPart = $control.data("loadPart");
                }
                else
                {
                    if ($chk(data) && $chk(data.xml))
                    {
                        var instanceIDElement = data.selectSingleNode(".//InstanceID");
                        subformID = data.getAttribute("SubFormID");
                        instanceID = instanceIDElement !== null ? instanceIDElement.text : null;
                    }

                    if ($chk(previousData) && $chk(previousData.xml))
                    {
                        var prevInstanceIDElement = previousData.selectSingleNode(".//InstanceID");
                        prevSubformID = previousData.getAttribute("SubFormID");
                        prevInstanceID = prevInstanceIDElement !== null ? prevInstanceIDElement.text : null;
                    }

                    if (!$chk(previousValue) || previousValue !== value || (previousValue === value && prevSubformID !== subformID) || (previousValue === value && prevSubformID === subformID && prevInstanceID !== instanceID) || (previousValue === value && $control.hasClass('in-error')))
                    {
                        $control.addClass("visited");
                        $control.removeClass("dependant");
                        $control.removeClass("disabled");
                        $control.removeClass("rule-invalid");
                        $control.removeClass("in-error");

                        _rules._setPartValues(display, value, data, $control);

                        loadPart = $control.data("loadPart");

                        if ($chk($elem.data("errorsArray")))
                        {
                            errorsArray = $elem.data("errorsArray");
                            for (var e = 0; e < errorsArray.length; e++)
                            {
                                var errorItemID = errorsArray[e];

                                if (errorItemID === widget.controlID)
                                {
                                    errorsArray.splice(e, 1);
                                    $elem.data("errorsArray", errorsArray);
                                }
                            }

                            if (errorsArray.length === 0)
                            {
                                jq_errorDiv = $elem.find(".rules-wizard-error").css("display", "none");
                            }
                        }

                        configElem = $elem.find("#" + $control.data("changeInvalidatesConfiguration"));

                        if (checkExists($control.data("changeInvalidatesConfiguration")) && checkExists(previousValue) && checkExistsNotEmpty(configElem.data("value")))
                        {
                            configurationIsValid = false;

                            if (checkExists($control.data("configurationErrorMsg")))
                            {
                                configElem.attr("title", $control.data("configurationErrorMsg"));
                            }
                        }
                    }
                    else
                    {
                        doSilentMap = false;
                    }
                }

                var partArray = $elem.children("div.rule-item-wrapper").find("a:not(.toolbar-button)");

                //Check if this part can load a next part value
                if (loadPart)
                {
                    for (var a = 0; a < partArray.length; a++)
                    {
                        var jq_partToLoad = jQuery(partArray[a]);
                        if (jq_partToLoad.data("name") === loadPart)
                        {
                            // Clear next part value
                            partText = jq_partToLoad.data("xml").selectSingleNode("Display").text;
                            _rules._setPartValues(partText, null, null, jq_partToLoad);

                            jq_partToLoad.removeClass("disabled");
                            jq_partToLoad.addClass("dependant");
                            _rules._partClicked(jq_partToLoad, true);
                        }
                    }
                }
                else
                {
                    if (checkExists($control.data("activatesConfiguration")) && !$control.hasClass("rule-part-inactive"))
                    {
                        configElem = $elem.find("#" + $control.data("activatesConfiguration"));
                        configElem.removeClass("disabled").addClass("dependant");
                    }
                    else if (checkExists($control.data("changeInvalidatesConfiguration")))
                    {
                        configElem = $elem.find("#" + $control.data("changeInvalidatesConfiguration"));
                    }
                    else if ($control.data("name") === "ConfigureCondition")
                    {
                        configElem = $control;
                    }
                    else
                    {
                        configElem = $elem.find("a.mappingConfiguration");
                    }

                    // Validation
                    var allValidationPartAreConfigured = true;
                    var validationPartArray = $elem.find("a:not(.toolbar-button,.mappingConfiguration)");
                    for (var vpa = 0; vpa < validationPartArray.length; vpa++)
                    {
                        if (!validationPartArray.eq(vpa).data("value"))
                        {
                            allValidationPartAreConfigured = false;
                            break;
                        }
                    }

                    configurationIsValid = configurationIsValid && value.indexOf("Invalid=\"true\"") < 0 && value.indexOf("ValidationStatus=\"Missing\"") < 0;

                    if (configurationIsValid && allValidationPartAreConfigured && (!checkExists(configElem) || !configElem.hasClass("in-error")))
                    {
                        configElem.attr("title", "");
                        $elem.removeClass("in-error");
                        $elem.attr("title", "");
                    }
                    else if (checkExists(configElem) && !configurationIsValid)
                    {
                        configElem.removeClass("visited");
                        configElem.removeClass("dependant");
                        configElem.removeClass("disabled");
                        configElem.removeClass("rule-invalid");
                        configElem.addClass("in-error");
                        $elem.addClass("in-error");
                    }
                    // Validation

                    if (elemTagName === "Event")
                    {
                        var allPartAreConfigured = true;
                        for (var pa = 0; pa < partArray.length; pa++)
                        {
                            if (!partArray.eq(pa).data("value"))
                            {
                                allPartAreConfigured = false;
                                break;
                            }
                        }

                        if (allPartAreConfigured)
                        {
                            var duplicatesExist = _rules._checkForExistingEvent($elem);

                            if (duplicatesExist === false && $elem.data("eventIsCurrentHandler").toLowerCase() === "false")
                            {
                                _rules._clearEvent($elem);
                            }
                        }
                    }
                }

                // ExecutionType grouping/display within the ruleArea
                // in this case, its faster to call _ruleUlManipulation directly rather than set a 
                // class, search and loop through cleaning dirty handlers
                if (widget.filterTypes === "ActionExecutionType") { _rules._ruleUlManipulation($elemHandler); }

                var onWidgetCompleted = $control.data("onWidgetCompleted");
                if (typeof onWidgetCompleted === "function")
                {
                    onWidgetCompleted($control);
                }
            }
            else
            {
                if ($control.css("display") === "none")
                {
                    if (checkExists($control.data("activatesConfiguration")) && !$control.hasClass("rule-part-inactive"))
                    {
                        var configurationRequiredPartIncompleteMsg = $control.data("configurationRequiredPartIncompleteMsg");
                        var configurationErrorMsg = $control.data("configurationErrorMsg");

                        configElem = $elem.find(".mappingConfiguration");
                        configElem.addClass("disabled");
                        $elem.addClass("in-error");

                        if (checkExistsNotEmpty(value) && checkExistsNotEmpty(configurationErrorMsg))
                        {
                            configElem.attr("title", configurationErrorMsg);
                            $elem.attr("title", configurationErrorMsg);
                        }
                        else
                        {
                            if (checkExistsNotEmpty(configurationRequiredPartIncompleteMsg))
                            {
                                configElem.attr("title", configurationRequiredPartIncompleteMsg);
                                $elem.attr("title", configurationRequiredPartIncompleteMsg);
                            }
                        }
                    }
                }
            }

            if (_rules._getCurrentItemType($elem) === "Handler")
            {
                _rules._resetConditionSpecifierHeight($elem);
            }

            if (_rules._getCurrentItemType($elem) === "Event" && SourceCode.Forms.Designers.Rule.ruleNameIsCustom === false)
            {
                var name = _rules.getRuleNameByEvent();
                SourceCode.Forms.Designers.Rule.Wizard.setRuleTabText(name, false);
            }
            _rules.checkRuleState();
        },

        checkRuleState: function ()
        {
            var errorParts = SourceCode.Forms.WizardContainer._rulesDialog.find("a.in-error");
            _rules.ruleContainsError = errorParts.length > 0;
            SourceCode.Forms.Designers.Rule.Wizard._setRuleTabBadging(_rules.ruleContainsError);
        },

        onWidgetCancelled: function (widget, error)
        {
            var jq_control = jQuery("#" + widget.controlID);
            var onWidgetCompleted = jq_control.data("onWidgetCompleted");
            if (typeof onWidgetCompleted === "function")
            {
                onWidgetCompleted();
            }
        },

        getRuleNameByEvent: function ()
        {
            var $elem = $("#RulePanelbox_RuleArea").find("li.event");
            if ($elem.length > 0)
            {
                var value;
                var elemData = $elem.data("xml");

                if (elemData !== null)
                {
                    var eventDescriptionElem = elemData.selectSingleNode("Description");

                    if (eventDescriptionElem !== null)
                    {
                        var eventDescription = eventDescriptionElem.text;

                        if (checkExistsNotEmpty(eventDescription))
                        {
                            var eventAnchors = $elem.find(">div.rule-item-wrapper>div>a");
                            var eventAnchorsLength = eventAnchors.length;
                            var eventTokens = [];
                            if (eventAnchorsLength > 0)
                            {
                                for (var a = 0; a < eventAnchorsLength; a++)
                                {
                                    var eventAnchor = eventAnchors.eq(a);
                                    var eventAnchorXml = eventAnchor.data("xml");
                                    var anchorText = "";
                                    var anchorIsHidden = false;
                                    if (eventAnchorXml !== null)
                                    {
                                        var anchorHiddenAttr = eventAnchorXml.getAttribute("Hidden");
                                        if (checkExistsNotEmpty(anchorHiddenAttr) && anchorHiddenAttr.toUpperCase() === "TRUE")
                                        {
                                            anchorIsHidden = true;
                                        }
                                    }

                                    if (!checkExistsNotEmpty(eventAnchor.data("value"))) { return; } // If value has not been set return as all part need to be configured to continue

                                    if (!anchorIsHidden)
                                    {
                                        anchorText = eventAnchor.text();
                                    }

                                    eventTokens.push(anchorText);
                                }

                                value = eventDescription.format(eventTokens);
                            }
                            else
                            {
                                value = eventDescription;
                            }

                            return value;
                        }
                    }
                }
            }
        },

        _clearEvent: function (jq_listItem)
        {
            var eventGuid = String.generateGuid();
            var eventID = "rule_li_" + eventGuid;
            jq_listItem.data("eventIsCurrentHandler", "True");
            jq_listItem.data("DefinitionID", "");
            jq_listItem.data("ID", "");

            jq_listItem.attr('id', eventID);
            SourceCode.Forms.WizardContainer.ruleID = eventGuid;
        },

        _checkForDuplicateRuleNameInCurrentContext: function (name, showPrompt, force, callback)
        {
            // do not validate the default name, this will be changed in 4.7 TFS512734
            if (SourceCode.Forms.Designers.Rule.ruleNameIsCustom !== true && !force)
            {
                return false;
            }

            //Rule names should be unique per form/view. IFF a form has multiple states, the rule name should be unique per state. If rule is on base, it should be unique on all states.
            //Cannot create a rule on base that exists on a substate with the same name.
            //MVI on a form should also be unique per view instance
            var ruleID = SourceCode.Forms.WizardContainer.ruleID;
            var currentRule = ruleID ? _rules.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='{0}']".format(ruleID)) : null;
            var currentRuleEventNode = currentRule !== null ? currentRule.selectSingleNode("Events/Event") : null;
            var currentRuleDefinitionID = currentRuleEventNode !== null ? currentRuleEventNode.getAttribute("DefinitionID") : null;
            var currentEventInstanceIdNode = currentRule !== null ? currentRule.selectSingleNode("Events/Event/Parts/Part[@Name='View']/Data/Item[@ItemType='View']/InstanceID") : null;
            var currentEventInstanceId = currentEventInstanceIdNode !== null ? currentEventInstanceIdNode.text : null;
            var currentEventSubformIdNode = currentRule !== null ? currentRule.selectSingleNode("Events/Event/Parts/Part[@Name='View' or @Name='Form']/Data/Item[@ItemType='View' or @ItemType='Form']") : null;
            var currentEventSubformId = currentEventSubformIdNode !== null ? currentEventSubformIdNode.getAttribute("SubFormID") : null;
            var duplicateEventID = null;
            var currentStateID = SourceCode.Forms.WizardContainer.stateID; // If undefined, it is the base state

            var rwContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext;
            var xPath = rwContext === "View" || rwContext === "Control" ? "//View" : "//Form/States/State";

            if (currentStateID !== undefined)
            {
                xPath += "[@ID='" + currentStateID + "']";
            }

            xPath += "/Events/Event[(@Type='User'";

            if (currentRuleDefinitionID !== null)
            {
                xPath += " and @DefinitionID!='{0}'".format(currentRuleDefinitionID);
            }

            xPath += ")]";

            var events = SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectNodes(xPath);

            //find first occurance of rule with same case insensitive name, using XPath 1.0 so have to do it this way, also Translate isnt generic enough
            var regex = new RegExp("^{0}$".format(name.escapeRegExp().trim()), "gi");
            var existingEvents = [];
            $.each(events, function (index, value)
            {
                var nameNode = value.selectSingleNode("Properties/Property[Name='RuleFriendlyName']/Value");
                var nameNodeVal = nameNode !== null ? nameNode.text : null;
                var comparisonResult = nameNodeVal.match(regex);
                if (comparisonResult !== null)
                {
                    var existingEventID = value.getAttribute("ID");
                    var existingEventInstanceIdNode = value.selectSingleNode("@InstanceID");
                    var existingEventInstanceId = existingEventInstanceIdNode !== null ? existingEventInstanceIdNode.text : null;
                    var existingEventSubformIdNode = value.selectSingleNode("@SubFormID");
                    var existingEventSubformId = existingEventSubformIdNode !== null ? existingEventSubformIdNode.text : null;
                    //if different rule ID's AND (same instance ID || same subform ID)-> duplicate
                    if ((ruleID !== existingEventID) && (currentEventInstanceId === existingEventInstanceId) && (currentEventSubformId === existingEventSubformId))
                    {
                        duplicateEventID = existingEventID;
                        existingEvents.push(value);
                        return false;
                    }
                }
            });

            if (duplicateEventID !== null && (showPrompt === true || typeof showPrompt === "undefined"))
            {
                var options = ({
                    message: Resources.RuleDesigner.lrLoadExistingEventMsg,
                    onAccept: function ()
                    {
                        //If the user accepts - Open the other rule (with the same name)
                        //i.e. they want to cancel building this rule and go an edit the rule of the same name.

                        popupManager.closeLast();
                        if ($("#RuleSettingsDialogTemplate")[0].style.display !== "none")
                        {
                            popupManager.closeLast();
                        }

                        //Remove existing conditions and actions
                        _rules._removeAllActionsCondition();
                        SourceCode.Forms.Designers.Rule.Wizard._setRulesWizardToDefault();

                        // load the rules xml
                        _eventHelper.transformRuleEventXmlToAuthoringEventXml({ eventsXml: existingEvents });
                        // Set wizard ruleID
                        SourceCode.Forms.WizardContainer.ruleID = duplicateEventID;

                        _rules._loadRuleDefinition(duplicateEventID, false, true);

                        SourceCode.Forms.Designers.Rule.suspendValidation = true;
                        $("#rwTabbedRuleItemActionsTab").trigger("click");
                        $('#ruleWizardPopup #RuleEditorTabBox a.tab.selected input').trigger("blur");

                        if (typeof callback === "function") callback("navigatedAway");
                    },
                    onDecline: function ()
                    {
                        //If the user declines - the user wants to stay in this rule, and just change the name
                        //i.e. they are aware of the duplicate, but this rule needs to have a unique name

                        popupManager.closeLast();

                        if (typeof callback === "function") callback("duplicate");

                    },
                    draggable: true
                });
                popupManager.showConfirmation(options);
            }
            else
            {
                if (typeof callback === "function") callback("unique");
            }
            return duplicateEventID !== null;
        },

        _checkForExistingEvent: function (jq_li)
        {
            var liXML = jq_li.data("xml");
            var eventName = liXML.getAttribute("Name");
            var duplicateExists = false;
            if (eventName !== "Rule")
            {
                var eventParts = liXML.selectNodes("Parts/Part");
                var eventPartsLength = eventParts.length;
                var liAnchors = jq_li.find("a:not(.toolbar-button)");
                var liAnchorsLength = liAnchors.length;
                var ignoreMergeToBase = false;
                var userMessage = Resources.RuleDesigner.lrLoadExistingEventMsg;
                var eventData =
                    {
                        EventName: eventName,
                        CurrentRuleWizardContext: SourceCode.Forms.WizardContainer.currentRuleWizardContext
                    };

                for (var p = 0; p < eventPartsLength; p++)
                {
                    var currentEventPart = eventParts[p];
                    var eventPartName = currentEventPart.getAttribute("Name");
                    var eventPartValue;

                    for (var l = 0; l < liAnchorsLength; l++)
                    {
                        var currentLiAnchor = liAnchors.eq(l);
                        var liAnchorName = currentLiAnchor.data("name");
                        if (liAnchorName === eventPartName)
                        {
                            eventPartValue = currentLiAnchor.data("value");
                            eventData[eventPartName] = eventPartValue;
                            var data = currentLiAnchor.data("data");
                            if (checkExists(data) && typeof data === "object" && checkExistsNotEmpty(data.xml))
                            {
                                if (data.selectSingleNode("InstanceID"))
                                {
                                    var instanceID = data.selectSingleNode("InstanceID").text;
                                    eventData.InstanceID = instanceID;
                                }

                                if (data.getAttribute("SubFormID"))
                                {
                                    var subformID = data.getAttribute("SubFormID");
                                    eventData.SubFormID = subformID;
                                }
                            }
                            break;
                        }
                    }
                }

                var allEvents = _eventHelper.findEventFromRuleEventData(eventData);
                //IE specific code Defect 710556
                if (typeof allEvents.filter !== "function")
                {
                    var newArray = [];
                    for (var z = 0; z < allEvents.length; z++)
                    {
                        newArray.push(allEvents[z]);
                    }
                    allEvents = newArray;
                }
                var existingEvents = allEvents.filter(function (currentEvent, index, fullArray)
                {
                    var include = true;
                    if (SourceCode.Forms.Designers.Common.Context === SourceCode.Forms.Designers.Common.Form)
                    {
                        var parentState = currentEvent.parentNode.parentNode;
                        if (checkExists(SourceCode.Forms.WizardContainer.stateID))
                        {
                            if (parentState.getAttribute("ID") !== SourceCode.Forms.WizardContainer.stateID)
                            {
                                include = false;
                            }
                        }
                        else
                        {
                            var isBase = parentState.getAttribute("IsBase");
                            if (!checkExists(isBase) || isBase.toLowerCase() === "false")
                            {
                                include = false;
                            }
                        }
                    }
                    if (include && checkExists(SourceCode.Forms.WizardContainer.ruleID) && currentEvent.getAttribute("ID") === SourceCode.Forms.WizardContainer.ruleID)
                    {
                        include = false;
                    }
                    return include;
                });

                // if on basestate, verify on non base states if the event exists
                if ((existingEvents === null || existingEvents.length < 1) && !$chk(SourceCode.Forms.WizardContainer.stateID))
                {
                    existingEvents = allEvents.filter(function (currentEvent, index, fullArray)
                    {
                        var include = true;
                        if (include && checkExists(SourceCode.Forms.WizardContainer.ruleID) && currentEvent.getAttribute("ID") === SourceCode.Forms.WizardContainer.ruleID)
                        {
                            include = false;
                        }
                        return include;
                    });
                    ignoreMergeToBase = existingEvents.length > 0 ? true : false;
                    userMessage = Resources.RuleDesigner.lrLoadExistingEventFromSubStateMsg;
                }

                if (checkExists(existingEvents) && existingEvents.length > 0)
                {
                    var existingEventID = existingEvents[0].getAttribute("ID");
                    duplicateExists = true;
                    var options = ({
                        message: userMessage,
                        onAccept: function ()
                        {
                            popupManager.closeLast();

                            SourceCode.Forms.Designers.Rule.Wizard._setRulesWizardToDefault();
                            _eventHelper.transformRuleEventXmlToAuthoringEventXml({ eventsXml: existingEvents });

                            //Remove existing conditions and actions
                            _rules._removeAllActionsCondition();

                            if (ignoreMergeToBase)
                            {
                                existingEventID = _rules._mergeEventsToBaseState(existingEventID, existingEvents);
                            }

                            // Set wizard ruleID
                            SourceCode.Forms.WizardContainer.ruleID = existingEventID;
                            _rules._resetToolbarEvents();
                            _rules._loadRuleDefinition(existingEventID, ignoreMergeToBase, true); // If ignoreMergeToBase to base is true conditions and actions wil not be loaded

                            $("#rwTabbedRuleItemActionsTab").trigger("click");
                        },
                        onDecline: function ()
                        {
                            delete SourceCode.Forms.WizardContainer.ruleID;
                            delete SourceCode.Forms.WizardContainer.definitionID;

                            //Remove existing events
                            jQuery("#ruleDefinitionRulesArea").children().remove();

                            SourceCode.Forms.Designers.Rule.Wizard._setRulesWizardToDefault();
                            SourceCode.Forms.Designers.Rule.Wizard.setRuleTabText("", false);

                            //Remove existing conditions and actions
                            _rules._removeAllActionsCondition();

                            _rules._resetToolbarEvents();
                            $("#Rule").trigger("click");
                            _rules._toggleEmptyRuleDesignPlaceHolder();

                            popupManager.closeLast();
                        },
                        draggable: true
                    });

                    popupManager.showConfirmation(options);
                }
            }
            return duplicateExists;
        },

        _mergeEventsToBaseState: function (ruleID, existingEvents) // existingEvents must be in AuthoringXml definition
        {
            var existingEventsLength = existingEvents.length;
            var currentRuleEvent = _rules.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + ruleID + "']");

            var definitionID;
            var newEventID = String.generateGuid();

            for (var e = 0; e < existingEventsLength; e++)
            {
                var currentDefinitionEvent = existingEvents[e];
                currentDefinitionEvent.setAttribute("IsReference", "True");
                currentDefinitionEvent.setAttribute("IsInherited", "True");
                if (!checkExistsNotEmpty(definitionID))
                {
                    definitionID = currentDefinitionEvent.getAttribute("DefinitionID");
                }
                else
                {
                    currentDefinitionEvent.setAttribute("DefinitionID", definitionID);
                }

            }

            // remove set attributes from main event
            currentRuleEvent.removeAttribute("ParentID");
            currentRuleEvent.removeAttribute("IsReference");
            currentRuleEvent.removeAttribute("StateID");
            currentRuleEvent.setAttribute("ID", newEventID);
            currentRuleEvent.setAttribute("DefinitionID", definitionID);
            //currentRuleEvent.parentNode.parentNode.setAttribute("ID", newEventID);



            SourceCode.Forms.Designers.Rule.contextDefinition = parseXML(SourceCode.Forms.Designers.Rule.tmpContextDefinition.xml); // Need to set original doc to temp doc because org doc is used in _loadRuleDefinition
            SourceCode.Forms.Designers.Rule.configuredRulesDefinitionXML = _rules.tmpConfiguredRulesDefinitionXML;

            return newEventID;
        },

        _getRuleUIActionDisplayDetails: function (dependantActions)
        {
            var displayDetails = [];
            if (checkExists(dependantActions) && dependantActions.length > 0)
            {
                var service = SourceCode.Forms.Services.AnalyzerResourcesService();
                var displayType = service.getReferenceType("Action");
                var icon = service.getReferenceTypeIconClass("ActionRuleSubForm");

                for (var i = 0; i < dependantActions.length; i++)
                {
                    displayDetails.push(
                        {
                            type: "Event",
                            title: SourceCode.Forms.Designers.Rule.ruleFriendlyName,
                            displayType: displayType,
                            descriptionName: null,
                            description: displayType,
                            subTitle: null,
                            icon: icon
                        });

                };
            }
            return displayDetails;
        },

        getRulesUIDependancyDisplayDetails: function (subformID, listItemID)
        {
            var dependantActions = SourceCode.Forms.Designers.Rule._getAllActionsListItems(subformID, listItemID);
            //Filter out UI elements that will be picked up by getDependencies since they exist in the xml
            dependantActions = dependantActions.filter(function (index, item)
            {
                var actionXmlExists = SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectSingleNode("//Action[@ID='{0}']".format($(item).data("ID")));
                return !actionXmlExists;
            });
            return SourceCode.Forms.Designers.Rule._getRuleUIActionDisplayDetails(dependantActions);
        },

        _getAllActionsListItems: function (subformID, listItemID) // Parameter will only return items that have subformIDs;
        {
            var selector = "#RulePanelbox_RuleArea ul.rulesUl li.action:not(.prefix)";
            if (checkExists(listItemID) && listItemID !== '')
            {
                selector = '#RulePanelbox_RuleArea ul.rulesUl li.action[ID!="' + listItemID + '"]:not(.prefix)';
            }

            if (checkExists(subformID) && subformID !== '')
            {
                return jQuery(selector).filter(function ()
                {
                    var currentLi = $(this);
                    var anchors = currentLi.find("a:not(.mappingConfiguration,.toolbar-button)").filter(function ()
                    {
                        var currentAnchor = $(this);
                        var itemData = currentAnchor.data("data");
                        if (checkExists(itemData))
                        {
                            if (itemData.getAttribute("SubFormID") !== null && itemData.getAttribute("SubFormID") === subformID)
                            {
                                return true;
                            } else
                            {
                                return false;
                            }
                        } else
                        {
                            return false;
                        }
                    });

                    if (anchors.length > 0)
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                });
            }
            else
            {
                return jQuery(selector);
            }
        },

        _removeDependentItems: function (subformID, jq_Li)
        {
            _rules._removeSubformEventItems(subformID, jq_Li);
        },

        _removeSubformEventItems: function (subformID, jq_Li)
        {
            var subformEvents = _rules.tmpContextDefinition.selectNodes("//Events/Event[@SubFormID='" + subformID + "']");
            var subformEventsLength = subformEvents.length;
            var currentLiID, actionLiItems, actionLiItemsLength;

            if (subformEventsLength > 0)
            {
                for (var s = 0; s < subformEventsLength; s++)
                {
                    var subformEvent = subformEvents[s];
                    var subformEventType = subformEvent.getAttribute("Type");
                    var subformEventID = subformEvent.getAttribute("ID");
                    var subformEventSubformActions = subformEvent.selectNodes("Handlers/Handler/Actions/Action[((@Type='Open' or @Type='Popup')) and (not(@IsReference) or (@IsReference='False'))]");
                    var subformEventSubformActionsLength = subformEventSubformActions.length;

                    // Get other subviews/subforms that where opened in this event and remove them
                    for (var p = 0; p < subformEventSubformActionsLength; p++)
                    {
                        var subformEventSubformAction = subformEventSubformActions[p];
                        var subformEventSubformActionSubformID = subformEventSubformAction.getAttribute("SubFormID");

                        _rules._removeSubformEventItems(subformEventSubformActionSubformID);
                    }

                    // Remove event from  form/view xmldefinition
                    subformEvent.parentNode.removeChild(subformEvent);

                    // Remove rule from from rule definition
                    if (subformEventType !== "System")
                    {
                        var configuredTmpRule = _rules.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules/Rule[@ID='" + subformEventID + "']");

                        if (configuredTmpRule !== null)
                        {
                            configuredTmpRule.parentNode.removeChild(configuredTmpRule);
                        }
                    }

                    // Remove actions with this subformid from form/view definition
                    var subformActions = _rules.tmpContextDefinition.selectNodes("//Actions/Action[@SubFormID='" + subformID + "']");
                    var subformActionsLength = subformActions.length;

                    for (var q = 0; q < subformActionsLength; q++)
                    {
                        var subformAction = subformActions[q];
                        var subformActionID = subformAction.getAttribute("ID");

                        var subformActionParentNode = subformAction.parentNode;
                        subformActionParentNode.removeChild(subformAction);

                        while (subformActionParentNode.childNodes.length === 0)
                        {
                            var currentNode = subformActionParentNode;
                            subformActionParentNode = currentNode.parentNode;
                            subformActionParentNode.removeChild(currentNode);
                        }
                    }

                    // Remove the actual LI element
                    currentLiID = null;
                    if (checkExists(jq_Li) && jq_Li.length > 0)
                    {
                        currentLiID = jq_Li.attr("ID");
                    }

                    actionLiItems = _rules._getAllActionsListItems(subformID, currentLiID);

                    if (checkExists(actionLiItems) && actionLiItems !== "")
                    {
                        actionLiItemsLength = actionLiItems.length;

                        for (var r = 0; r < actionLiItemsLength; r++)
                        {
                            actionLiItems.eq(r).remove();
                        }
                    }
                }
            }
            else
            {
                // Remove the actual LI element
                currentLiID = null;
                if (checkExists(jq_Li) && jq_Li.length > 0)
                {
                    currentLiID = jq_Li.attr("ID");
                }

                actionLiItems = _rules._getAllActionsListItems(subformID, currentLiID);

                if (checkExists(actionLiItems) && actionLiItems !== "")
                {
                    actionLiItemsLength = actionLiItems.length;

                    for (var ai = 0; ai < actionLiItemsLength; ai++)
                    {
                        actionLiItems.eq(ai).remove();
                    }
                }
            }
        },

        _describePart: function (partName)
        {
            var result = {};

            result.isViewOrForm = partName === "Form" || partName === "View";
            result.isXEvent = partName === "ControlEvent" || partName === "ParameterEvent" || partName === "FormEvent";
            result.isControlOrMethodOrParameter = partName === "ViewControl" || partName === "FormControl" || partName === "ViewMethod" ||
                partName === "FormParameter" || partName === "ViewParameter";

            return result;
        },

        _partTakesPrecedence: function (previousPartName, partNameToTest)
        {
            /*
            //lowest precedence
            - View
            - Form

            //middle
            - FormEvent
            - ControlEvent
            - ParameterEvent
            
            //highest
            - ViewControl
            - FormControl
            - ViewMethod
            - FormParameter
            - ViewParameter
            */

            if (!checkExists(previousPartName))
            {
                return true;
            }

            var previousPart = _rules._describePart(previousPartName);
            var part = _rules._describePart(partNameToTest);

            if (previousPart.isViewOrForm || part.isControlOrMethodOrParameter ||
                (part.isXEvent && !previousPart.isControlOrMethodOrParameter))
            {
                return true;
            }

            return false;
        },

        _getPartForSourceName: function (parts)
        {
            var result = {};
            for (var p = 0; p < parts.length; p++)
            {
                var $part = parts.eq(p);
                var partName = $part.data("name");
                if (_rules._partTakesPrecedence(result.partName, partName))
                {
                    result.partName = partName;
                    result.partValue = $part.data("value");
                    result.partDisplayValue = $part.text();
                }
            }
            return result;
        },

        _setPartValues: function (display, value, data, jq_part)
        {
            jq_part.text(display);
            jq_part.data("value", value);
            jq_part.data("data", data);
        },
        //returns a new node if the node was not found or returns a reference to existing node after clearing the child content
        _getCleanRuleElement: function (rulesDocument, ruleID, stateID)
        {
            var ruleElement = null;
            ruleElement = rulesDocument.selectSingleNode("Rules/Rule[@ID='" + ruleID + "']");
            if (checkExists(ruleElement))
            {
                var ruleChildren = ruleElement.selectNodes("*");
                var ruleChildrenLength = ruleChildren.length;

                for (var r = 0; r < ruleChildrenLength; r++)
                {
                    ruleElement.removeChild(ruleChildren[r]);
                }
            }
            else
            {
                ruleElement = rulesDocument.createElement("Rule");
                rulesDocument.documentElement.appendChild(ruleElement);
            }

            if (stateID)
            {
                ruleElement.setAttribute("StateID", stateID);
            }

            return ruleElement;
        },

        saveRuleDefinition: function ()
        {
            var ruleID = SourceCode.Forms.WizardContainer.ruleID ? SourceCode.Forms.WizardContainer.ruleID : String.generateGuid();
            var stateID = SourceCode.Forms.WizardContainer.stateID;
            var currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext;

            if (currentContext.toLowerCase() === "form")
            {
                if (stateID)
                {
                    currentContext = "state";
                }
            }

            var ruleElement = _rules._getCleanRuleElement(_rules.tmpConfiguredRulesDefinitionXML, ruleID, stateID);

            var eventsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Events");
            var handlersElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Handlers");

            //Rule Properties
            var isSingleSpinnerElement = ruleElement.selectSingleNode("SingleSpinner");

            if (isSingleSpinnerElement !== null)
            {
                ruleElement.removeChild(isSingleSpinnerElement);
            }

            if (SourceCode.Forms.Designers.Rule.Properties.isSingleSpinner === true)
            {
                isSingleSpinnerElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("SingleSpinner");
                isSingleSpinnerElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode("True"));
                ruleElement.appendChild(isSingleSpinnerElement);
            }
            //End Rule Properties

            // Set Rule Name & Description
            var ruleNameElement = ruleElement.selectSingleNode("Name");
            var ruleDescriptionElement = ruleElement.selectSingleNode("Description");
            var isCustomNameElement = ruleElement.selectSingleNode("IsCustomName");

            if (ruleNameElement !== null)
            {
                ruleElement.removeChild(ruleNameElement);
            }

            if (ruleDescriptionElement !== null)
            {
                ruleElement.removeChild(ruleDescriptionElement);
            }

            if (checkExists(SourceCode.Forms.Designers.Rule.ruleName))
            {
                ruleNameElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Name");
                ruleNameElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(SourceCode.Forms.Designers.Rule.ruleName));
                ruleElement.appendChild(ruleNameElement);
            }

            if (checkExists(SourceCode.Forms.Designers.Rule.ruleDescription))
            {
                ruleDescriptionElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Description");
                ruleDescriptionElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(SourceCode.Forms.Designers.Rule.ruleDescription));
                ruleElement.appendChild(ruleDescriptionElement);
            }

            if (isCustomNameElement !== null)
            {
                ruleElement.removeChild(isCustomNameElement);
            }

            if (SourceCode.Forms.Designers.Rule.ruleNameIsCustom)
            {
                isCustomNameElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("IsCustomName");
                isCustomNameElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(SourceCode.Forms.Designers.Rule.ruleNameIsCustom.toString()));
                ruleElement.appendChild(isCustomNameElement);
            }

            // Set Rule Name & Description End

            ruleElement.appendChild(eventsElement);
            ruleElement.appendChild(handlersElement);
            ruleElement.setAttribute("ID", ruleID);

            // Save Rules
            for (var l = 0; l < jQuery("#ruleDefinitionRulesArea").children().length; l++)
            {
                var jq_ListItem = jQuery(jQuery("#ruleDefinitionRulesArea").children()[l]);
                var eventIsCurrentHandler = jq_ListItem.data("eventIsCurrentHandler").toLowerCase();
                var eventXml = jq_ListItem.data("xml");
                var eventType = eventXml.getAttribute("Type");
                var eventName = eventXml.getAttribute("Name");
                var eventID = jq_ListItem.data("ID");
                var eventDefinitionID = jq_ListItem.data("DefinitionID");
                var eventComments = jq_ListItem.data("comments");
                var eventElement;

                if (eventIsCurrentHandler === "true")
                {
                    eventElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Event");
                    eventsElement.appendChild(eventElement);

                    if (checkExists(SourceCode.Forms.WizardContainer.definitionID) && SourceCode.Forms.WizardContainer.definitionID !== "")
                    {
                        eventElement.setAttribute("DefinitionID", SourceCode.Forms.WizardContainer.definitionID);
                    }

                    eventElement.setAttribute("Name", eventName);
                    eventElement.setAttribute("IsCurrentHandler", "True");
                    if ($chk(eventID)) { eventElement.setAttribute("ID", eventID); }

                    var parts = jq_ListItem.find("div.rule-item-wrapper>div:first-child").children("a");
                    var partsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Parts");

                    if (parts.length > 0)
                    {
                        var sourcePart = _rules._getPartForSourceName(parts);
                        eventElement.setAttribute("SourceName", sourcePart.partValue);
                        eventElement.setAttribute("SourceDisplayName", sourcePart.partDisplayValue);
                    }
                    else
                    {
                        eventElement.setAttribute("SourceName", eventName);
                        eventElement.setAttribute("SourceDisplayName", _rules.ruleName);
                    }

                    for (var p = 0; p < parts.length; p++)
                    {
                        var jq_Part = jQuery(parts[p]);
                        var partReturnTypeElem = jq_Part.data('xml').selectSingleNode('Parameters/Parameter[@Name="returnType"]');
                        var partReturnType = 'xml';

                        if ($chk(partReturnTypeElem))
                        {
                            partReturnType = partReturnTypeElem.text;
                        }

                        var partElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Part");
                        var valueElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Value");
                        var displayElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Display");
                        var dataElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Data");

                        var partData = jq_Part.data("data");
                        var partValue = jq_Part.data("value");
                        var partName = jq_Part.data("name");

                        partElement.setAttribute("Name", partName);

                        var valueTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(partValue);
                        var displayTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(jq_Part.text());

                        valueElement.appendChild(valueTextNode);
                        displayElement.appendChild(displayTextNode);

                        if ($chk(partData))
                        {
                            if (partReturnType === 'xml')
                            {
                                var clonedNode = partData.cloneNode(true);
                                dataElement.appendChild(clonedNode);
                            }
                            else
                            {
                                dataElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(partData));
                            }
                        }

                        partElement.appendChild(valueElement);
                        partElement.appendChild(displayElement);
                        partElement.appendChild(dataElement);
                        partsElement.appendChild(partElement);
                    }

                    eventElement.appendChild(partsElement);
                } else
                {
                    eventElement = jq_ListItem.data("handlerXml").cloneNode(true);
                    eventElement.setAttribute("IsCurrentHandler", "False");
                    eventsElement.appendChild(eventElement);
                }

                var eventCommentsElement = eventElement.selectSingleNode("Comments");
                if (checkExistsNotEmpty(eventCommentsElement))
                {
                    eventElement.removeChild(eventCommentsElement);
                }

                if (checkExistsNotEmpty(eventComments))
                {
                    eventCommentsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Comments");
                    eventCommentsElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(eventComments));
                    eventElement.appendChild(eventCommentsElement);
                }
            }

            var ruleItems = jQuery("#RulePanelbox_RuleArea").find(">ul.rulesUl.handler");
            _rules._saveRuleItems(ruleItems, ruleElement);

            //getBindingRuleDataElement().value = configuredRulesDefinitionXML.xml;
            SourceCode.Forms.Designers.Rule.AJAXCall.saveRule(ruleID);
        },

        _saveRuleItems: function (jq_ruleItems, parentXmlElement)
        {
            var ruleItemsLength = jq_ruleItems.length;

            for (var r = 0; r < ruleItemsLength; r++)
            {
                var jq_ruleItem = jq_ruleItems.eq(r);
                var currentItemType = _rules._getCurrentItemType(jq_ruleItem);

                switch (currentItemType)
                {
                    case "Handler":
                        // Save handler
                        _rules._saveHandler(jq_ruleItem, parentXmlElement);
                }
            }
        },

        _saveHandler: function (currentHandler, parentXmlElement)
        {
            var handlersElement = parentXmlElement.selectSingleNode("Handlers");
            if (handlersElement === null)
            {
                handlersElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Handlers");
                parentXmlElement.appendChild(handlersElement);
            }

            var handlerType;
            var handlerName;
            var handlerXml = currentHandler.data("xml");
            var handlerID = currentHandler.attr('id');
            var handlerElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Handler");
            var handlerIsReference = currentHandler.attr("IsReference");
            var handlerDefinitionID = currentHandler.attr("DefinitionID");
            var handlerIsInherited = currentHandler.attr("IsInherited");
            var currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext;
            var $part, partReturnTypeElem, partReturnType, partElement, valueElement, displayElement,
                dataElement, partData, partValue, partName, valueTextNode, displayTextNode, clonedNode;

            handlerType = _rules._getHandlerType(currentHandler);
            handlerName = handlerXml.getAttribute("Name");
            handlerElement.setAttribute("Name", handlerName);

            handlerElement.setAttribute("HandlerType", handlerType);
            handlerElement.setAttribute("Context", currentHandler.data("Context"));

            if ($chk(handlerIsReference)) { handlerElement.setAttribute("IsReference", handlerIsReference); }
            if ($chk(handlerDefinitionID)) { handlerElement.setAttribute("DefinitionID", handlerDefinitionID); }
            if ($chk(handlerIsInherited)) { handlerElement.setAttribute("IsInherited", handlerIsInherited); }
            handlerElement.setAttribute("ID", handlerID);
            handlerElement.setAttribute("IsEnabled", (!currentHandler.hasClass("disabled")).toString());
            handlersElement.appendChild(handlerElement);

            //TODO: add back when supported
            /*var handlerCommentsElement = handlerElement.selectSingleNode("Comments");
            if (checkExistsNotEmpty(handlerCommentsElement))
            {
                handlerElement.removeChild(handlerCommentsElement);
            }

            if (checkExistsNotEmpty(handlerComments))
            {
                handlerCommentsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Comments");
                handlerCommentsElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(handlerComments));
                handlerElement.appendChild(handlerCommentsElement);
            }*/

            //#region create handler parts
            handlerXml = currentHandler.data("xml");
            var htmlParts = currentHandler.find(">div.rule-item-wrapper>div").children("a");
            var handlerPartsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Parts");
            for (var p = 0; p < htmlParts.length; p++)
            {
                $part = $(htmlParts[p]);
                partReturnTypeElem = $part.data('xml').selectSingleNode('Parameters/Parameter[@Name="returnType"]');
                partReturnType = "xml";
                if ($chk(partReturnTypeElem))
                {
                    partReturnType = partReturnTypeElem.text;
                }

                partElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Part");
                valueElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Value");
                displayElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Display");
                dataElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Data");

                partData = $part.data("data");
                partValue = $part.data("value");
                partName = $part.data("name");

                partElement.setAttribute("Name", partName);

                valueTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(partValue);
                displayTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode($part.text());

                valueElement.appendChild(valueTextNode);
                displayElement.appendChild(displayTextNode);

                if ($chk(partData))
                {
                    if (partReturnType === 'xml')
                    {
                        clonedNode = partData.cloneNode(true);
                        dataElement.appendChild(clonedNode);
                    }
                    else
                    {
                        dataElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createCDATASection(partData));
                    }
                }

                partElement.appendChild(valueElement);
                partElement.appendChild(displayElement);
                partElement.appendChild(dataElement);
                handlerPartsElement.appendChild(partElement);
            }

            if (htmlParts.length > 0)
            {
                handlerElement.appendChild(handlerPartsElement);
            }
            //endregion create handler parts


            var ruleItems = currentHandler.find(">li");
            var ruleItemsLength = ruleItems.length;

            for (var r = 0; r < ruleItemsLength; r++)
            {
                var jq_ruleItem = ruleItems.eq(r);
                var currentItemType = _rules._getCurrentItemType(jq_ruleItem);

                switch (currentItemType)
                {
                    case "Action":
                        // Save action
                        _rules._saveAction(jq_ruleItem, handlerElement);
                        break;

                    case "HandlerAction":
                        _rules._saveHandlerAction(jq_ruleItem, handlerElement);
                        break;

                    case "Condition":
                        // Save condition
                        _rules._saveCondition(jq_ruleItem, handlerElement);
                        break;

                    case "ActionPrefix":
                        var actionPrefixItems = jq_ruleItem.find(">.rulesUl.prefix").children();
                        var actionPrefixItemsLength = actionPrefixItems.length;

                        //#region create handler parts
                        handlerXml = currentHandler.data("xml");
                        htmlParts = currentHandler.find(">div.rule-item-wrapper>div").children("a");
                        handlerPartsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Parts");
                        for (var partIndex = 0; partIndex < htmlParts.length; partIndex++)
                        {
                            $part = $(htmlParts[partIndex]);
                            partReturnTypeElem = $part.data('xml').selectSingleNode('Parameters/Parameter[@Name="returnType"]');
                            partReturnType = "xml";
                            if ($chk(partReturnTypeElem))
                            {
                                partReturnType = partReturnTypeElem.text;
                            }

                            partElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Part");
                            valueElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Value");
                            displayElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Display");
                            dataElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Data");

                            partData = $part.data("data");
                            partValue = $part.data("value");
                            partName = $part.data("name");

                            partElement.setAttribute("Name", partName);

                            valueTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(partValue);
                            displayTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode($part.text());

                            valueElement.appendChild(valueTextNode);
                            displayElement.appendChild(displayTextNode);

                            if ($chk(partData))
                            {
                                if (partReturnType === 'xml')
                                {
                                    clonedNode = partData.cloneNode(true);
                                    dataElement.appendChild(clonedNode);
                                }
                                else
                                {
                                    dataElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createCDATASection(partData));
                                }
                            }

                            partElement.appendChild(valueElement);
                            partElement.appendChild(displayElement);
                            partElement.appendChild(dataElement);
                            handlerPartsElement.appendChild(partElement);
                        }

                        if (htmlParts.length > 0)
                        {
                            handlerElement.appendChild(handlerPartsElement);
                        }
                        //endregion create handler parts

                        for (var ap = 0; ap < actionPrefixItemsLength; ap++)
                        {
                            var actionPrefixItem = actionPrefixItems.eq(ap);
                            var currentActionPrefixItemType = _rules._getCurrentItemType(actionPrefixItem);

                            switch (currentActionPrefixItemType)
                            {
                                case "Action":
                                    // Save action
                                    _rules._saveAction(actionPrefixItem, handlerElement);
                                    break;

                                case "HandlerAction":
                                    _rules._saveHandlerAction(actionPrefixItem, handlerElement);
                                    break;

                                case "Condition":
                                    // Save condition
                                    _rules._saveCondition(jq_ruleItem, handlerElement, handlerType);
                                    break;
                            }
                        }
                        break;
                }
            }
        },

        _saveHandlerAction: function (jq_ListItem, parentXmlElement)
        {
            var actionsElement = parentXmlElement.selectSingleNode("Actions");
            if (actionsElement === null)
            {
                actionsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Actions");
                parentXmlElement.appendChild(actionsElement);
            }

            var actionIsCurrentHandler = "true";
            if (checkExists(jq_ListItem.data("eventIsCurrentHandler")))
            {
                actionIsCurrentHandler = jq_ListItem.data("eventIsCurrentHandler");
            }

            var actionType = "Handler";
            var actionIsEnabled = (!jq_ListItem.hasClass("disabled")).toString();
            var actionID = jq_ListItem.data("ID");
            var actionDefinitionID = jq_ListItem.data("DefinitionID");
            var currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext;
            var context = jq_ListItem.data("Context") ? jq_ListItem.data("Context") : currentContext;

            if (actionIsCurrentHandler === "true")
            {
                actionElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Action");
                actionsElement.appendChild(actionElement);

                actionElement.setAttribute("Name", "HandlerAction");
                actionElement.setAttribute("Type", actionType);
                actionElement.setAttribute("Enabled", actionIsEnabled);
                actionElement.setAttribute("IsCurrentHandler", "True");

                if (checkExists(actionID)) { actionElement.setAttribute("ID", actionID); }
                if (checkExists(actionDefinitionID)) { actionElement.setAttribute("DefinitionID", actionDefinitionID); }
                if (checkExists(context)) { actionElement.setAttribute("Context", context); }
            }
            else
            {
                actionElement = jq_ListItem.data("handlerXml").cloneNode(true);
                var childHandlersNode = actionElement.selectSingleNode("Handlers");
                if (childHandlersNode !== null)
                {
                    childHandlersNode.remove();
                }
                actionElement.setAttribute("IsCurrentHandler", "False");
                actionElement.setAttribute("Enabled", actionIsEnabled);
                actionsElement.appendChild(actionElement);
            }

            _rules._saveRuleItems(jq_ListItem.find(">ul.rulesUl:not(.prefix)"), actionElement);
        },

        _saveAction: function (jq_ListItem, parentXmlElement)
        {
            var actionsElement = parentXmlElement.selectSingleNode("Actions");
            if (actionsElement === null)
            {
                actionsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Actions");
                parentXmlElement.appendChild(actionsElement);
            }

            var predecessorID = null;
            var actionIsCurrentHandler = jq_ListItem.data("eventIsCurrentHandler");
            var currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext;
            var actionXml = jq_ListItem.data("xml");
            var actionType = actionXml.getAttribute("Type");
            var actionName = actionXml.getAttribute("Name");
            var actionIsEnabled = (!jq_ListItem.hasClass("disabled")).toString();
            var actionID = jq_ListItem.data("ID");
            var actionDefinitionID = jq_ListItem.data("DefinitionID");
            var context = jq_ListItem.data("Context") ? jq_ListItem.data("Context") : currentContext;
            var actionComments = jq_ListItem.data("comments");
            var actionElement, partsElement;

            if (actionIsCurrentHandler === "true")
            {
                actionElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Action");
                actionsElement.appendChild(actionElement);

                actionElement.setAttribute("Name", actionName);
                actionElement.setAttribute("Type", actionType);
                actionElement.setAttribute("Enabled", actionIsEnabled);
                actionElement.setAttribute("IsCurrentHandler", "True");

                if ($chk(actionID)) { actionElement.setAttribute("ID", actionID); }
                if ($chk(actionDefinitionID)) { actionElement.setAttribute("DefinitionID", actionDefinitionID); }
                if (predecessorID !== null) { actionElement.setAttribute("PredeccesorID", predecessorID); }
                if ($chk(context)) { actionElement.setAttribute("Context", context); }

                var parts = jq_ListItem.find("div.rule-item-wrapper>div:first-child").children("a");

                for (var p = 0; p < parts.length; p++)
                {
                    var jq_Part = jQuery(parts[p]);
                    var partReturnTypeElem = jq_Part.data('xml').selectSingleNode('Parameters/Parameter[@Name="returnType"]');
                    var partReturnType = 'xml';

                    if ($chk(partReturnTypeElem))
                    {
                        partReturnType = partReturnTypeElem.text;
                    }

                    if (p === 0)
                    {
                        partsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Parts");
                    }

                    var partElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Part");
                    var valueElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Value");
                    var displayElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Display");
                    var dataElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Data");

                    var partData = jq_Part.data("data");
                    var partValue = jq_Part.data("value");
                    var partName = jq_Part.data("name");

                    partElement.setAttribute("Name", partName);

                    var valueTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(partValue);
                    var displayTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(jq_Part.text());

                    valueElement.appendChild(valueTextNode);
                    displayElement.appendChild(displayTextNode);

                    if ($chk(partData))
                    {
                        if (partReturnType === 'xml')
                        {
                            var clonedNode = partData.cloneNode(true);
                            dataElement.appendChild(clonedNode);
                        }
                        else
                        {
                            dataElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(partData));
                        }
                    }

                    partElement.appendChild(valueElement);
                    partElement.appendChild(displayElement);
                    partElement.appendChild(dataElement);
                    partsElement.appendChild(partElement);
                }

                if (parts.length > 0)
                {
                    actionElement.appendChild(partsElement);
                }

                // Save Configuration
                var configurations = jq_ListItem.find(".mappingConfiguration");
                for (var c = 0; c < configurations.length; c++)
                {
                    var jq_configuration = jQuery(configurations[c]);
                    var configurationValue = jq_configuration.data("value");

                    if ($chk(configurationValue))
                    {
                        var configurationDoc = parseXML(configurationValue).selectSingleNode("/").firstChild;
                        var mappingsNode = configurationDoc.cloneNode(true);

                        actionElement.appendChild(mappingsNode);
                    }
                }

                predecessorID = actionID;
                // Save Configuration   
            } else
            {
                actionElement = jq_ListItem.data("handlerXml").cloneNode(true);
                actionElement.setAttribute("IsCurrentHandler", "False");
                actionElement.setAttribute("Enabled", actionIsEnabled);
                actionsElement.appendChild(actionElement);

                predecessorID = actionElement.getAttribute("ID");
            }

            var actionCommentsElement = actionElement.selectSingleNode("Comments");
            if (checkExistsNotEmpty(actionCommentsElement))
            {
                actionElement.removeChild(actionCommentsElement);
            }

            if (checkExistsNotEmpty(actionComments))
            {
                actionCommentsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Comments");
                actionCommentsElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(actionComments));
                actionElement.appendChild(actionCommentsElement);
            }
        },

        _saveCondition: function (jq_ListItem, parentXmlElement, handlerType)
        {
            var conditionsElement = parentXmlElement.selectSingleNode("Conditions");
            if (conditionsElement === null)
            {
                conditionsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Conditions");
                parentXmlElement.appendChild(conditionsElement);
            }

            var conditionIsCurrentHandler = jq_ListItem.data("eventIsCurrentHandler").toLowerCase();
            var conditionXml = jq_ListItem.data("xml");
            var currentContext = SourceCode.Forms.WizardContainer.currentRuleWizardContext;
            var conditionName = conditionXml.getAttribute("Name");
            var conditionIsEnabled = (!jq_ListItem.hasClass("disabled")).toString();
            var conditionHandlerType = conditionXml.getAttribute("HandlerType");
            var conditionID = jq_ListItem.data("ID");
            var conditionDefinitionID = jq_ListItem.data("DefinitionID");
            var context = jq_ListItem.data("Context") ? jq_ListItem.data("Context") : currentContext;
            var conditionComments = jq_ListItem.data("comments");
            var conditionElement, partsElement;

            if (conditionIsCurrentHandler === "true" || handlerType === "Else")
            {
                conditionElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Condition");
                conditionsElement.appendChild(conditionElement);

                conditionElement.setAttribute("Name", conditionName);
                conditionElement.setAttribute("IsCurrentHandler", "True");
                conditionElement.setAttribute("Enabled", conditionIsEnabled);

                if ($chk(conditionID)) { conditionElement.setAttribute("ID", conditionID); }
                if ($chk(conditionDefinitionID)) { conditionElement.setAttribute("DefinitionID", conditionDefinitionID); }
                if ($chk(context)) { conditionElement.setAttribute("Context", context); }

                var parts = jq_ListItem.find("div.rule-item-wrapper>div").children("a");

                for (var p = 0; p < parts.length; p++)
                {
                    var jq_Part = jQuery(parts[p]);
                    var partReturnTypeElem = jq_Part.data('xml').selectSingleNode('Parameters/Parameter[@Name="returnType"]');
                    var partReturnType = "xml";
                    if ($chk(partReturnTypeElem))
                    {
                        partReturnType = partReturnTypeElem.text;
                    }

                    if (p === 0)
                    {
                        partsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Parts");
                    }

                    var partElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Part");
                    var valueElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Value");
                    var displayElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Display");
                    var dataElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Data");

                    var partData = jq_Part.data("data");
                    var partValue = jq_Part.data("value");
                    var partName = jq_Part.data("name");

                    partElement.setAttribute("Name", partName);

                    var valueTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(partValue);
                    var displayTextNode = _rules.tmpConfiguredRulesDefinitionXML.createTextNode(jq_Part.text());

                    valueElement.appendChild(valueTextNode);
                    displayElement.appendChild(displayTextNode);

                    if (checkExistsNotEmpty(partData))
                    {
                        if (partReturnType === 'xml')
                        {
                            var clonedNode = partData.cloneNode(true);
                            dataElement.appendChild(clonedNode);
                        }
                        else
                        {
                            dataElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createCDATASection(partData));
                        }
                    }

                    partElement.appendChild(valueElement);
                    partElement.appendChild(displayElement);
                    partElement.appendChild(dataElement);
                    partsElement.appendChild(partElement);
                }

                if (parts.length > 0)
                {
                    conditionElement.appendChild(partsElement);
                }
            }
            else
            {
                if (conditionHandlerType !== "Error" && conditionHandlerType !== "Else")
                {
                    conditionElement = jq_ListItem.data("handlerXml").cloneNode(true);
                    conditionElement.setAttribute("IsCurrentHandler", "False");
                    conditionElement.setAttribute("Enabled", conditionIsEnabled);
                    conditionsElement.appendChild(conditionElement);
                }
            }

            var conditionCommentsElement = conditionsElement.selectSingleNode("Comments");
            if (checkExistsNotEmpty(conditionCommentsElement))
            {
                conditionsElement.removeChild(conditionCommentsElement);
            }

            if (checkExistsNotEmpty(conditionComments))
            {
                conditionCommentsElement = _rules.tmpConfiguredRulesDefinitionXML.createElement("Comments");
                conditionCommentsElement.appendChild(_rules.tmpConfiguredRulesDefinitionXML.createTextNode(conditionComments));
                conditionElement.appendChild(conditionCommentsElement);
            }
        },

        _getCurrentItemType: function (jq_item)
        {
            if (jq_item.hasClass("action"))
            {
                if (jq_item.hasClass("rulesUl"))
                {
                    return "PrefixHandler";
                }
                else if (jq_item.hasClass("prefix"))
                {
                    return "ActionPrefix";
                }
                else
                {
                    return "Action";
                }
            }
            else if (jq_item.hasClass("handler-action"))
            {
                return "HandlerAction";
            }
            else if (jq_item.hasClass("condition"))
            {
                return "Condition";
            }
            else if (jq_item.hasClass("rulesUl"))
            {
                return "Handler";
            }
            else if (jq_item.hasClass("scroll-wrapper") || jq_item.attr("id") === "EmptyRuleDesign_Placeholder" || jq_item.hasClass("panel-body-wrapper"))
            {
                return "EmptyRulePlaceHolder";
            }
            else if (jq_item.hasClass("event"))
            {
                return "Event";
            }
            else if (jq_item.attr("id") === "RulePanelbox_RuleArea")
            {
                return "RuleDesignCanvas";
            }
            else if (jq_item.length > 0)
            {
                return "HandlerRuleItem";
            }
            else
            {
                return "Undefined";
            }
        },

        _removeRuleDefinitionItem: function (ev, jq_li, notifierContext)
        {
            var jq_This = jQuery(ev.target);

            if (!jq_This.hasClass('disabled'))
            {
                var eventRemovalSupport = _rules._checkEventRemovalSupportedChildTypes();
                if (_rules._getCurrentItemType(jq_li) === "Event" && !eventRemovalSupport.success)
                {
                    popupManager.showError(eventRemovalSupport.message);
                    return false;
                }
                else
                {
                    _rules._removeRuleItem(jq_li, notifierContext);
                }
            }
        },

        _checkEventRemovalSupportedChildTypes: function ()
        {
            var ruleItems = jQuery("#RulePanelbox").find("li.condition, li.action");
            var ruleItemsSupportedTypes = [];

            if (ruleItems.length === 0) return { success: true, message: "" };

            for (var r = 0; r < ruleItems.length; r++)
            {
                var currentRuleItem = ruleItems.eq(r);
                var ruleItemXml = currentRuleItem.data("xml");
                var supportedParentTypesAttr = ruleItemXml ? ruleItemXml.getAttribute(SourceCode.Forms.Designers.Rule.Wizard.SUPPORTED_PARENT_TYPES) : null;

                if (ruleItemXml && checkExistsNotEmpty(supportedParentTypesAttr))
                {
                    var filterItems = supportedParentTypesAttr.split("|");

                    if (filterItems.indexOf(SourceCode.Forms.Designers.Rule.Wizard.ALL_SUPPORTED_TYPE) === -1)
                    {
                        return {
                            success: false,
                            message: Resources.RuleDesigner.lrRuleMustContainEventErrorMsg
                        };
                    }
                }
            }

            return { success: true, message: "" };
        },

        _checkEventSupportedChildTypes: function (childFilter)
        {
            var ruleItems = jQuery("#RulePanelbox").find("li.condition, li.action");
            var childFilterItems = "";
            if (checkExistsNotEmpty(childFilter))
            {
                childFilterItems = childFilter.split("|");
            }

            if (ruleItems.length === 0) return { success: true, message: "" };

            for (var r = 0; r < ruleItems.length; r++)
            {
                var currentRuleItem = ruleItems.eq(r);
                var ruleItemXml = currentRuleItem.data("xml");
                var supportedParentTypesAttr = ruleItemXml? ruleItemXml.getAttribute(SourceCode.Forms.Designers.Rule.Wizard.SUPPORTED_PARENT_TYPES): null;

                if (ruleItemXml)
                {
                    if (checkExistsNotEmpty(supportedParentTypesAttr))
                    {
                        var filterItems = supportedParentTypesAttr.split("|");

                        if (childFilterItems.length == 0 && filterItems.length > 0 && filterItems.indexOf(SourceCode.Forms.Designers.Rule.Wizard.ALL_SUPPORTED_TYPE) === -1)
                        {
                            return { success: false, message: Resources.RuleDesigner.lrSupportedChildTypeErrorMsg };
                        }

                        if (filterItems.indexOf(SourceCode.Forms.Designers.Rule.Wizard.ALL_SUPPORTED_TYPE) === -1)
                        {
                            for (var f = 0; f < filterItems.length; f++)
                            {
                                if (childFilterItems.indexOf(filterItems[f]) === -1)
                                {
                                    return {
                                        success: false,
                                        message: Resources.RuleDesigner.lrSupportedChildTypeErrorMsg
                                    };
                                }
                            }
                        }
                    }
                    else if (childFilterItems.length > 0 && childFilterItems.indexOf(SourceCode.Forms.Designers.Rule.Wizard.ALL_SUPPORTED_TYPE) === -1)
                    {
                        return {
                            success: false,
                            message: Resources.RuleDesigner.lrSupportedParentTypeErrorMsg
                        };
                    }                    
                }                
            }

            return { success: true, message: "" };
        },

        _doRuleItemRemove: function (jq_li, itemToRemoveType, itemNodeTypeAttr, notifierContext)
        {

            var jq_liHandler = _rules._getCurrentHandler(jq_li);
            var handlerType = _rules._getHandlerType(jq_liHandler);
            var name = jq_li.data("name");
            var jq_thisParent = jQuery("#" + name);
            var currentlySelectedRuleItem = jQuery("#RulePanelbox").find("li.condition.selected, li.action.selected");
            var _dependencyHelper = SourceCode.Forms.DependencyHelper;

            if (itemToRemoveType === _dependencyHelper.ReferenceType.Condition)
            {
                //Remove condition
                jq_li.remove();

                if (_rules._checkHandlerExistanceValid(jq_liHandler))
                {
                    _rules._mergeHandlerActions(jq_liHandler);
                }
            }
            else
            {
                _rules._removeItemFromTmpContextDefintion(jq_li);

                if (itemToRemoveType === _dependencyHelper.ReferenceType.Event)
                {
                    //Remove event
                    //if event removed, replace with unbound rule event
                    $("#Rule").trigger("click");
                }
                else
                {

                    if (jq_thisParent.is(":checked") === true)
                    {
                        if (jq_thisParent.attr("type") === "radio")
                        {
                            jq_thisParent[0].selected = false;
                        }
                        else
                        {
                            jq_thisParent.radioboxbutton("uncheck");
                        }
                    }

                    var handlersToValidate = [];

                    //Check if this was an open subform/view action and remove extended items:
                    if (itemToRemoveType === SourceCode.Forms.DependencyHelper.ReferenceType.Action &&
                        (["Popup", "Open"].indexOf(itemNodeTypeAttr) >= 0))
                    {
                        var openSubFormElement = jq_li.find("a[PartName='View'], a[PartName='Form']").eq(0);
                        if (checkExists(openSubFormElement))
                        {
                            var openSubFormData = openSubFormElement.data("data");
                            if (checkExists(openSubFormData))
                            {
                                var subFormId = openSubFormData.getAttribute("SubFormID");
                                // Remove dependant items from definition to prevent badging, does not affect current Rule
                                _rules._removeNonExtendedSubFormItems(subFormId, jq_li);

                                // Remove Conditions/Actions/Handlers that reference the SubItem from the current Rule
                                var allElements = $("#RulePanelbox_RuleArea").find("li.condition:not(.prefix), li.action:not(.prefix), ul.rulesUl.handler");
                                var elementsToRemove = [];
                                var element = null;

                                for (var i = 0; i < allElements.length; i++)
                                {
                                    element = $(allElements[i]);
                                    var currentItemSubFormAnchor = element.find("> .rule-item-wrapper > div > a[PartName='View'], > .rule-item-wrapper > div > a[PartName='Form']").eq(0); // requires direct decendant or a handler will pick up on an actions subform Item
                                    //Only delete an open action on the current context, so any dependant conditions wont have an InstanceID
                                    if (currentItemSubFormAnchor.length > 0 && checkExists(currentItemSubFormAnchor.data().data) &&
                                        currentItemSubFormAnchor.data().data.getAttribute("SubFormID") === subFormId)
                                    {
                                        elementsToRemove.push(element);
                                        if (!element.is(".handler"))
                                        {
                                            handlersToValidate.push(element.closest(".handler"));
                                        }
                                    }
                                }

                                for (var k = 0; k < elementsToRemove.length; k++)
                                {
                                    $(elementsToRemove[k]).remove();
                                }
                            }
                            else
                            {
                                handlersToValidate.push(jq_liHandler);
                                jq_li.remove();
                            }
                        }
                    }
                    else
                    {
                        //Just remove action
                        jq_li.remove();
                        handlersToValidate.push(jq_liHandler);
                    }

                    // check all affected handlers so that orphans are removed.
                    var currentHandlerToValidate = null;
                    for (var j = 0; j < handlersToValidate.length; j++)
                    {
                        currentHandlerToValidate = handlersToValidate[j];
                        // Check if handler valid AFTER you remove the actions and conditions
                        if (_rules._checkHandlerExistanceValid(currentHandlerToValidate))
                        {
                            currentHandlerToValidate.addClass("dirty");
                        }
                    }
                }
            }

            _rules._dirtyHandlerCleanup();

            if (currentlySelectedRuleItem.length > 0)
            {
                var toolbarWrapper = jQuery("#rwBottomPaneToolbar");
                _rules._setItemMobilitySettings(currentlySelectedRuleItem[0], toolbarWrapper);
            }
            else
            {
                _rules._resetToolbarEvents();
            }

            _rules._toggleEmptyRuleDesignPlaceHolder();
        },

        //This function should be called when any open subform/subview rule is removed
        //Because non-extended submform/subview rules are not dependencies of the removed rule item,
        //they need to be removed seperately and not through DependencyHelper.
        //This function is similar to _removeSubformEventItems, except it only removes non-extended items
        _removeNonExtendedSubFormItems: function (subformID)
        {
            var currentLiID, actionLiItems, actionLiItemsLength;
            var s, t = 0;
            var subformEvent;
            var nonExtendendSubformEvents, extendedChildren;
            var eventsToRemove = [];
            var extendedQry = "[not(@IsReference) or @IsReference='False']";
            var nonExtendedQry = "[@IsReference='True' or @IsInherited='True']";

            //Remove non-extended events that don't contain extended actions, handlers or conditions
            nonExtendendSubformEvents = _rules.tmpContextDefinition.selectNodes(".//Events/Event[@Type='User'][@SubFormID='{0}']{1}".format(subformID, nonExtendedQry));

            for (s = 0; s < nonExtendendSubformEvents.length; s++)
            {
                subformEvent = nonExtendendSubformEvents[s];

                extendedChildren = subformEvent.selectNodes(".//Action{0} | .//Condition{0} | .//Handler{0}".format(extendedQry));
                if (extendedChildren.length === 0)
                {
                    //Event has no extended children, can be removed:
                    eventsToRemove.push(subformEvent);
                }
            }

            for (t = 0; t < eventsToRemove.length; t++)
            {
                eventsToRemove[t].parentNode.removeChild(eventsToRemove[t]);
            }
        },

        _removeRuleItem: function (jq_li, notifierContext)
        {
            //Do not check dependencies if _removeRuleItem was called by a notifier callback function (e.g. _removeExecutionGroup)
            var needToCheckDependencies = !checkExists(notifierContext);
            var itemToRemoveType = SourceCode.Forms.DependencyHelper.ReferenceType.Unknown;
            if (jq_li.hasClass("condition"))
            {
                itemToRemoveType = SourceCode.Forms.DependencyHelper.ReferenceType.Condition;
            }
            else if (jq_li.hasClass("event"))
            {
                itemToRemoveType = SourceCode.Forms.DependencyHelper.ReferenceType.Event;
            }
            else if (jq_li.hasClass("action"))
            {
                itemToRemoveType = SourceCode.Forms.DependencyHelper.ReferenceType.Action;
            }

            var itemNode = jq_li.data("xml");
            if (!checkExists(itemNode))
            {
                return;
            }

            var itemNodeTypeAttr = itemNode.getAttribute("Type");

            if (itemToRemoveType === SourceCode.Forms.DependencyHelper.ReferenceType.Action &&
                (["Popup", "Open"].indexOf(itemNodeTypeAttr) >= 0) && needToCheckDependencies)
            {
                var dependencyData =
                    {
                        xmlDef: _rules.tmpContextDefinition
                    };
                var ruleData =
                    {
                        itemId: jq_li.data("ID"),
                        itemType: itemToRemoveType
                    };

                var actionDependencies = SourceCode.Forms.Designers.getDependencies(ruleData, dependencyData);

                if (actionDependencies.length > 0)
                {
                    //For subform/view dependencies, Keep or Remove options should not be available on notifier
                    var notifierOptions =
                        {
                            references: actionDependencies,
                            deleteItemType: itemToRemoveType,
                            removeObjFn: function (notifierContext)
                            {
                                _rules._doRuleItemRemove(jq_li, itemToRemoveType, itemNodeTypeAttr, notifierContext)
                            },
                            showSimpleNotifier: true,
                            removeConfirmationMessage: Resources.RuleDesigner.lrRemoveSubFormDependenciesMsg
                        };
                    SourceCode.Forms.Designers.showDependencyNotifierPopup(notifierOptions);
                }
                else
                {
                    _rules._doRuleItemRemove(jq_li, itemToRemoveType, itemNodeTypeAttr, notifierContext);
                }
            }
            else
            {
                _rules._doRuleItemRemove(jq_li, itemToRemoveType, itemNodeTypeAttr, notifierContext);
            }
        },

        _removeItemFromTmpContextDefintion: function (jq_li)
        {
            var actualID = jq_li.data("ID"), nodeXml = jq_li.data("xml");
            if (checkExists(nodeXml))
            {
                var nodeName = nodeXml.nodeName;
                var nodeToRemove = _rules.tmpContextDefinition.selectSingleNode("//{0}[@ID='{1}']".format(nodeName, actualID));

                if (nodeToRemove !== null)
                {
                    var parentNode = nodeToRemove.parentNode;
                    parentNode.removeChild(nodeToRemove);

                    while (parentNode.childNodes.length === 0)
                    {
                        var newParentNode = parentNode.parentNode;
                        newParentNode.removeChild(parentNode);

                        parentNode = newParentNode;

                        if (parentNode.nodeName === 'Events')
                        {
                            break;
                        }
                    }
                }
            }
        },

        _checkMovedItemState: function (jq_ruleItem)
        {
            var jq_Handler = _rules._getCurrentHandler(jq_ruleItem);
            var jq_ExecutionGroup = jq_ruleItem.closest(".rulesUl.action.prefix");
            var handlerExpander = jq_Handler.find(">.handler-expander");
            var executionExpander = jq_ExecutionGroup.find(">.execution-expander");
            var handlerActionsCondition = jq_Handler.find(">.condition, >.action");
            var executionActionsCondition = jq_ExecutionGroup.find(">.condition, >.action");

            if (handlerExpander.hasClass("collapsed"))
            {
                handlerExpander.removeClass("collapsed");
                handlerActionsCondition.show();
            }

            executionExpander.removeClass("collapsed");
            executionActionsCondition.show();
        },

        _checkMovedExecutionGroupState: function (jq_executionGroup, thisGroupsNewType)
        {
            var thisExecutionGroupType = _rules._getExecutionGroupType(jq_executionGroup);
            var executionExpander = jq_executionGroup.find(">.rulesUl.action.prefix>.execution-expander");
            var executionActionsCondition = jq_executionGroup.find(".condition, .action");

            var prevExecutionGroup = jq_executionGroup.prevAll(".action.prefix").first();
            var prevExecutionGroupType = _rules._getExecutionGroupType(prevExecutionGroup);
            var prevExecutionExpander = prevExecutionGroup.find(".execution-expander");
            var prevExecutionActionsCondition = prevExecutionGroup.find(".condition, .action");

            var nextExecutionGroup = jq_executionGroup.nextAll(".action.prefix").first();
            var nextExecutionGroupType = _rules._getExecutionGroupType(nextExecutionGroup);
            var nextExecutionExpander = nextExecutionGroup.find(".execution-expander");
            var nextExecutionActionsCondition = nextExecutionGroup.find(".condition, .action");

            var prevAction = jq_executionGroup.prevAll(".action:not(.prefix)");
            var nextAction = jq_executionGroup.nextAll(".action:not(.prefix)");

            if ((prevExecutionGroup.length === 0 && executionExpander.hasClass("collapsed") && prevAction.length > 0) || (nextExecutionGroup.length === 0 && executionExpander.hasClass("collapsed") && nextAction.length > 0))
            {
                executionActionsCondition.show();
                executionExpander.removeClass("collapsed");
            }

            if (((thisExecutionGroupType === prevExecutionGroupType) && (executionExpander.hasClass("collapsed") || prevExecutionExpander.hasClass("collapsed"))) || (checkExistsNotEmpty(thisGroupsNewType) && (thisGroupsNewType === prevExecutionGroupType)))
            {
                executionExpander.removeClass("collapsed");
                prevExecutionExpander.removeClass("collapsed");
                executionActionsCondition.show();
                prevExecutionActionsCondition.show();
            }

            if (((thisExecutionGroupType === nextExecutionGroupType) && (executionExpander.hasClass("collapsed") || nextExecutionExpander.hasClass("collapsed"))) || (checkExistsNotEmpty(thisGroupsNewType) && (thisGroupsNewType === nextExecutionGroupType)))
            {
                executionExpander.removeClass("collapsed");
                nextExecutionExpander.removeClass("collapsed");
                executionActionsCondition.show();
                nextExecutionActionsCondition.show();
            }
        },

        _getExecutionGroupType: function (jq_executionGroup)
        {
            var value = null;
            var jq_executionGroupUl = jq_executionGroup.find(".rulesUl.action.prefix");
            if (jq_executionGroupUl.hasClass("async"))
            {
                value = "async";
            }
            else if (jq_executionGroupUl.hasClass("sync"))
            {
                value = "sync";
            }
            else if (jq_executionGroupUl.hasClass("single"))
            {
                value = "single";
            }
            else if (jq_executionGroupUl.hasClass("parallel"))
            {
                value = "parallel";
            }

            return value;
        },

        _setHandlerType: function (handler, type)
        {
            var handlerCurrentType = _rules._getHandlerType(handler);
            if (handlerCurrentType === "If")
            {
                handler.find("rule-item-wrapper").hide();
            }
            else
            {
                handler.find("rule-item-wrapper").show();
            }
            handler.removeClass("If Else Error ForEach");
            handler.addClass(type);
        },

        _dirtyHandlerCleanup: function ()
        {
            var $dirtyHandlers = $(".handler.dirty");
            for (var i = 0; i < $dirtyHandlers.length; i++)
            {
                _rules._ruleUlManipulation($dirtyHandlers.eq(i));
            }

            if ($(".handler.dirty").length > 0)
            {
                // should only occur when an Always handler is flattened, to ensure that its children are correct.
                // should never recursively call more than once... unless the API messes up.
                _rules._dirtyHandlerCleanup();
            }
        },

        // _ruleUlManipulation should never be called directly anymore 
        _ruleUlManipulation: function (handler)
        {
            var handlerConditionLiArray = handler.find(">li.condition:not(.prefix)");
            _rules._removeItemPrefixes(handler);
            var ruleAreaLiDiv = null;
            handlerType = _rules._getHandlerType(handler);
            var context = SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext();
            var $itemsToMove;

            //remove empty HandlerActions
            handler.find(">li.handler-action:empty").remove();

            //try flatten Handlers that contain a HandlerAction that contains 1 handler
            var $handlerChild = handler.children("li");
            if (!_rules.busyLoading
                && handlerType !== "If" && handlerType !== "Always" &&
                $handlerChild.length === 1 && _rules._getCurrentItemType($handlerChild) === "HandlerAction")
            {
                var $handlerActionHandler = _rules._getHandlerActionHandler($handlerChild);
                if ($handlerActionHandler.length === 1 && _rules._getHandlerType($handlerActionHandler) === "If")
                {
                    var $handlerActionHandlerChildrenToMove = $handlerActionHandler.children("li");
                    handler.append($handlerActionHandlerChildrenToMove);
                    $handlerChild.remove();
                }
            }

            //Test Always Handler Children - if contains only Actions and Handler Actions, flatten structure
            if (handlerType === "If"
                && handler.find(">li.condition").length === 0
                && handler.find(">li.handler-action").length > 0)
            {
                if (_rules._isRootItem(handler))
                {
                    var $firstHandlerAction = handler.find(">li.handler-action").first();
                    $itemsToMove = $firstHandlerAction.nextAll();
                    var $targetHandlers = _rules._getHandlerActionHandler($firstHandlerAction);
                    handler.after($targetHandlers);
                    $firstHandlerAction.remove();
                    $targetHandlers.addClass("dirty");
                    if ($itemsToMove.length > 0)
                    {
                        $newHandler = _rules._addHandler("IfLogicalHandler", null, true, true, false,
                            null, context, null, null, $targetHandlers, null);

                        $newHandler.append($itemsToMove);
                    }
                }
                else
                {
                    $itemsToMove = handler.find(">li.action, >li.handler-action");
                    var $handlerNextSiblings = handler.nextAll();
                    var $handlerAction = _rules._getCurrentHandlerAction(handler);
                    if ($handlerNextSiblings.length > 0)
                    {
                        var $newHandlerAction = _rules._createHandlerAction(null, true, "TRUE", false, null,
                            SourceCode.Forms.Designers.Rule.Wizard._getRulesWizardContext());

                        $handlerAction.after($newHandlerAction);
                        $newHandlerAction.append($handlerNextSiblings);
                    }

                    $handlerAction.after($itemsToMove);
                    var $firstItemToMove = $itemsToMove.first();
                    var $lastItemToMove = $itemsToMove.last();
                    if (_rules._getCurrentItemType($firstItemToMove) === "HandlerAction")
                    {
                        $itemsToMove = $firstItemToMove.children();
                        $handlerAction.append($itemsToMove);
                    }

                    var $lastItemNextSibling = $lastItemToMove.next();
                    if (_rules._getCurrentItemType($lastItemToMove) === "HandlerAction" && _rules._getCurrentItemType($lastItemNextSibling) === "HandlerAction")
                    {
                        $itemsToMove = $lastItemToMove.children();
                        $lastItemNextSibling.prepend($itemsToMove);
                    }

                    _rules._getCurrentHandler($handlerAction).addClass("dirty");
                }
            }

            if (handlerType === "Error")
            {
                //Prefix the first entry with and
                ruleAreaLiDiv = handlerConditionLiArray.eq(0).find(">div.rule-item-wrapper>div:first-child");
                ruleAreaLiDiv.before("<span class='condition prefix visited index'>and&nbsp;</span>");
            }
            else
            {
                //Prefix the first entry with if
                ruleAreaLiDiv = handlerConditionLiArray.eq(0).find(">div.rule-item-wrapper>div:first-child"); // jQuery("#" + ruleArea).children("li:first-child").children("div:first-child")	
                ruleAreaLiDiv.before("<span class='condition prefix visited'>if&nbsp;</span>");
            }
            //Prefix the all following entries with and
            for (var i = 1; i < handlerConditionLiArray.length; i++)
            {
                ruleAreaLiDiv = handlerConditionLiArray.eq(i).find(">div.rule-item-wrapper>div:first-child");
                ruleAreaLiDiv.before("<span class='condition prefix visited index'>and&nbsp;</span>");
            }
            // condition manipulpation

            var handlerChildren = handler.children("li");
            var handlerChildrenLength = handlerChildren.length;

            for (var z = 0; z < handlerChildrenLength; z++)
            {
                var currentChild = handlerChildren.eq(z);
                var currentItemType = _rules._getCurrentItemType(currentChild);
                var previousItem;
                var previousItemType;

                if (z > 0)
                {
                    previousItem = handlerChildren.eq(z - 1);
                    previousItemType = _rules._getCurrentItemType(previousItem);
                }

                if (previousItemType === "Action" && currentItemType === "Action")
                {
                    _rules._addActionToExecutionGroup(currentChild, previousItem);
                }
            }

            // check if main group needs to show handles
            var handlerType = _rules._getHandlerType(handler, true);
            var handlerConditions = handler.find(">li.condition");
            var handlerExecutionGroups = handler.find(">li.action.prefix, >li.handler-action");
            var handlerActions = handler.find(">li.action:not(.prefix)");
            var handlerCollapseElements = handler.find(">.handler-expander, >.handler-specifier");
            var conditionCollapseElements = handler.find(">.condition-expander, >.condition-specifier");

            if (handlerType === "Always")
            {
                handlerCollapseElements.hide();
                handlerExecutionGroups.css("margin-left", "2px");
                handlerExecutionGroups.find(">ul.rulesUl.action.prefix").css("border", "none");
                handler.addClass("handler-no-border");
            }
            else
            {
                handlerCollapseElements.show();
                handler.removeClass("handler-no-border");
            }

            if (handlerType === "If" || handlerConditions.length === 0)
            {
                conditionCollapseElements.hide();
            }
            else if (handlerType !== "If" && (handlerConditions.length > 0))
            {
                conditionCollapseElements.show();
                handler.find(">.condition-specifier").removeClass("no-border");
                handler.find(">.condition-expander").removeClass("collapsed");
            }
            _rules._resetConditionSpecifierHeight(handler);
            _rules._checkExecutionGroupState(handler);

            handler.removeClass("dirty");
        },

        _addActionToExecutionGroup: function (jq_thisLi, previousItem)
        {
            var execTypeClassText = _rules._getItemExecutionTypeClass(jq_thisLi);
            var execTypeAnchorText = _rules._getItemExecutionTypeAnchorText(jq_thisLi);
            var prevExecTypeClassText = _rules._getItemExecutionTypeClass(previousItem);
            var prevExecTypeAnchorText = _rules._getItemExecutionTypeAnchorText(previousItem);
            var previousItemPrefix = previousItem.parent(".rulesUl.action.prefix");
            var previousItemPrefixType;
            var li, handlerUl;

            if (previousItemPrefix.length === 0)
            {
                if (prevExecTypeClassText === execTypeClassText)
                {
                    li = jQuery("<li class='action prefix'><ul class='rulesUl action prefix " + execTypeClassText + "'><div class='execution-expander collapsed'></div><div class='execution-specifier no-border'></div><a class='execTypeGroup' href='javascript:void(0);'>" + execTypeAnchorText + "</a></ul></li>");
                    handlerUl = li.find(">ul.rulesUl.prefix");
                    li.insertBefore(previousItem);
                    previousItem.appendTo(handlerUl);
                    jq_thisLi.appendTo(handlerUl);
                }
                else
                {
                    // Create Group for previous item
                    li = jQuery("<li class='action prefix'><ul class='rulesUl action prefix " + prevExecTypeClassText + "'><div class='execution-expander collapsed'></div><div class='execution-specifier no-border'></div><a class='execTypeGroup' href='javascript:void(0);'>" + prevExecTypeAnchorText + "</a></ul></li>");
                    handlerUl = li.find(">ul.rulesUl.prefix");
                    li.insertBefore(previousItem);
                    previousItem.appendTo(handlerUl);

                    if (previousItem.is(":visible"))
                    {
                        handlerUl.find(">.execution-expander.collapsed").removeClass("collapsed");
                        handlerUl.find(">.execution-specifier.no-border").removeClass("no-border");
                    }
                    //restore active/inactive state on previous execution group TFS 514830
                    _rules._checkExecutionGroupActive(li);

                    if (checkExistsNotEmpty(execTypeClassText))
                    {
                        // Create group for next item
                        li = jQuery("<li class='action prefix'><ul class='rulesUl action prefix " + execTypeClassText + "'><div class='execution-expander collapsed'></div><div class='execution-specifier no-border'></div><a class='execTypeGroup' href='javascript:void(0);'>" + execTypeAnchorText + "</a></ul></li>");
                        handlerUl = li.find(">ul.rulesUl.prefix");
                        li.insertBefore(jq_thisLi);
                        jq_thisLi.appendTo(handlerUl);
                    }
                }
            }
            else if (previousItemPrefix.length > 0 && previousItemPrefix.hasClass(execTypeClassText))
            {
                previousItemPrefix.append(jq_thisLi);
                li = previousItemPrefix;
            }
            else if (previousItemPrefix.length > 0 && !previousItemPrefix.hasClass(execTypeClassText))
            {
                li = jQuery("<li class='action prefix'><ul class='rulesUl action prefix " + execTypeClassText + "'><div class='execution-expander collapsed'></div><div class='execution-specifier no-border'></div><a class='execTypeGroup' href='javascript:void(0);'>" + execTypeAnchorText + "</a></ul></li>");
                handlerUl = li.find(">ul.rulesUl.prefix");

                li.insertBefore(jq_thisLi);
                jq_thisLi.appendTo(handlerUl);
            }

            //#region respect visibility settings
            var isThisLiVisible = jq_thisLi.is(":visible");
            var $ulRulesUlPrefix = li.is("ul.rulesUl.prefix") ? li : li.find(">ul.rulesUl.prefix");
            var $liExecutionExpander = $ulRulesUlPrefix.find(">.execution-expander.collapsed");
            var isExectionExpanderCollapsed = $liExecutionExpander.length > 0;

            if (isExectionExpanderCollapsed && isThisLiVisible)
            {
                $liExecutionExpander.removeClass("collapsed");
                $ulRulesUlPrefix.find(">.execution-specifier.no-border").removeClass("no-border");
                $ulRulesUlPrefix.find(">li.action:not(.prefix)").show();
                isExectionExpanderCollapsed = false;
            }

            if (!isExectionExpanderCollapsed && !isThisLiVisible)
            {
                jq_thisLi.show();
            }
            //#endregion

            _rules._checkExecutionGroupActive(li.closest("li.action.prefix"));
        },

        _checkHandlerExistanceValid: function (jqHandler)
        {
            var handlerType = _rules._getHandlerType(jqHandler, false);
            if ((jqHandler.find(">li.condition, >li.action, >li.handler-action").length === 0
                && handlerType === "If") || handlerType === "")
            {
                var handlerAction = jqHandler.parent(".handler-action");
                jqHandler.remove();

                if (handlerAction.length > 0)
                {
                    _rules._checkHandlerActionValid(handlerAction);
                }

                return false;
            }
            else
            {
                return true;
            }
        },

        _checkHandlerActionValid: function (handlerAction)
        {
            var handlerActionHandler = handlerAction.closest("ul.rulesUl.handler");
            if (handlerAction.find(">.rulesUl.handler").length === 0)
            {
                handlerAction.remove();

                if (_rules._checkHandlerExistanceValid(handlerActionHandler))
                {
                    handlerActionHandler.addClass("dirty");
                }

                return false;
            }
            else
            {
                return true;
            }
        },

        _getItemExecutionTypeClass: function (jqLi)
        {
            var result;
            var anchorArray = jqLi.find(">div>div").children("a:first-child, span:first-child");

            if (jqLi.data("eventIsCurrentHandler") === "true")
            {
                switch (anchorArray.eq(0).data("value"))
                {
                    case "Synchronous":
                        result = "sync";
                        break;
                    case "Asynchronous":
                        result = "async";
                        break;
                    case "Single":
                        result = "single";
                        break;
                    case "Parallel":
                        result = "parallel";
                        break;
                }
            }
            else
            {
                if (checkExists(jqLi.data("handlerXml")))
                {
                    thisLiExecType = jqLi.data("handlerXml").selectSingleNode("Parts/Part[@Name='ExecutionType']/Value").text;

                    switch (thisLiExecType)
                    {
                        case "Synchronous":
                            result = "sync";
                            break;
                        case "Asynchronous":
                            result = "async";
                            break;
                        case "Single":
                            result = "single";
                            break;
                        case "Parallel":
                            result = "parallel";
                            break;
                    }
                }
            }

            return result;
        },

        _getItemExecutionTypeAnchorText: function (jqLi)
        {
            var result;
            var anchorArray = jqLi.find(">div>div").children("a:first-child, span:first-child");

            if (jqLi.data("eventIsCurrentHandler") === "true")
            {
                switch (anchorArray.eq(0).data("value"))
                {
                    case "Synchronous":
                        result = Resources.Wizard.SynchronousGroup;
                        break;
                    case "Asynchronous":
                        result = Resources.Wizard.AsynchronousGroup;
                        break;
                    case "Single":
                        result = Resources.Wizard.SingleGroup;
                        break;
                    case "Parallel":
                        result = Resources.Wizard.ParallelGroup;
                        break;
                }
            } else
            {
                if (checkExists(jqLi.data("handlerXml")))
                {
                    thisLiExecType = jqLi.data("handlerXml").selectSingleNode("Parts/Part[@Name='ExecutionType']/Value").text;

                    switch (thisLiExecType)
                    {
                        case "Synchronous":
                            result = Resources.Wizard.SynchronousGroup;
                            break;
                        case "Asynchronous":
                            result = Resources.Wizard.AsynchronousGroup;
                            break;
                        case "Single":
                            result = Resources.Wizard.SingleGroup;
                            break;
                        case "Parallel":
                            result = Resources.Wizard.ParallelGroup;
                            break;
                    }
                }
            }

            return result;
        },

        _checkExecutionGroupActive: function (jq_group)
        {
            var liArray = jq_group.find(">ul.rulesUl.action.prefix>li.action, >ul.rulesUl.action.prefix>li.condition");

            // Check if prev items group must be inactive
            var groupNotHandler = liArray.filter(function ()
            {
                return $(this).data("eventIsCurrentHandler").toLowerCase() !== "true";
            });

            groupNotHandler = !!groupNotHandler.length;

            var groupAnchor = jq_group.find("a.execTypeGroup");
            if (groupNotHandler === true)
            {
                groupAnchor.addClass("inactive");
            } else
            {
                groupAnchor.removeClass("inactive");
            }
        },

        _showExecTypeGroupContextMenu: function (e, jq_anchor)
        {
            if (!jq_anchor.hasClass('inactive'))
            {
                var execTypeGroupContextMenu = new ContextMenu();

                //Build execTypeGroupContextMenu
                execTypeGroupContextMenu.addItem({
                    text: Resources.Wizard.SynchronousGroup,
                    icon: "actionexecutiontype",
                    description: Resources.Wizard.SynchronousGroupDescription,
                    onClick: function () { _rules._selectExecTypeGroupContextMenuItem(jq_anchor, Resources.Wizard.SynchronousGroup); }
                });
                execTypeGroupContextMenu.addItem({
                    text: Resources.Wizard.AsynchronousGroup,
                    icon: "actionexecutiontype",
                    description: Resources.Wizard.AsynchronousGroupDescription,
                    onClick: function () { _rules._selectExecTypeGroupContextMenuItem(jq_anchor, Resources.Wizard.AsynchronousGroup); }
                });
                execTypeGroupContextMenu.addItem({
                    text: Resources.Wizard.SingleGroup,
                    icon: "actionexecutiontype",
                    description: Resources.Wizard.SingleGroupDescription,
                    onClick: function () { _rules._selectExecTypeGroupContextMenuItem(jq_anchor, Resources.Wizard.SingleGroup); }
                });
                execTypeGroupContextMenu.addItem({
                    text: Resources.Wizard.ParallelGroup,
                    icon: "actionexecutiontype",
                    description: Resources.Wizard.ParallelGroupDescription,
                    onClick: function () { _rules._selectExecTypeGroupContextMenuItem(jq_anchor, Resources.Wizard.ParallelGroup); }
                });

                execTypeGroupContextMenu.showContextMenuAt({ event: e, x: e.clientX, y: e.clientY });
            }
        },

        _selectExecTypeGroupContextMenuItem: function (execTypeHeaderAnchor, execTypeHeaderText)
        {
            var execTypeLiArray = jQuery(execTypeHeaderAnchor).siblings("li:not(.prefix)");
            var execTypeHandler = jQuery(execTypeHeaderAnchor).closest(".handler");
            var execTypeDisplay;
            var execTypeValue;
            var newType;

            if (execTypeHeaderAnchor[0].innerHTML !== execTypeHeaderText)
            {
                switch (execTypeHeaderText)
                {
                    case Resources.Wizard.SynchronousGroup:
                        execTypeDisplay = Resources.Wizard.Synchronous;
                        execTypeValue = "Synchronous";
                        newType = "sync";
                        jQuery(execTypeHeaderAnchor).text(Resources.Wizard.Synchronous);
                        break;
                    case Resources.Wizard.AsynchronousGroup:
                        execTypeDisplay = Resources.Wizard.Asynchronous;
                        execTypeValue = "Asynchronous";
                        newType = "async";
                        jQuery(execTypeHeaderAnchor).text(Resources.Wizard.Asynchronous);
                        break;
                    case Resources.Wizard.SingleGroup:
                        execTypeDisplay = Resources.Wizard.Single;
                        execTypeValue = "Single";
                        newType = "single";
                        jQuery(execTypeHeaderAnchor).text(Resources.Wizard.Single);
                        break;
                    case Resources.Wizard.ParallelGroup:
                        execTypeDisplay = Resources.Wizard.Parallel;
                        execTypeValue = "Parallel";
                        newType = "parallel";
                        jQuery(execTypeHeaderAnchor).text(Resources.Wizard.Parallel);
                        break;
                }

                for (var i = 0; i < execTypeLiArray.length; i++)
                {
                    var execTypeAnchor = execTypeLiArray.eq(i).find(">div.rule-item-wrapper>div:first-child").children("a:first-child");
                    execTypeAnchor.text(execTypeDisplay);
                    execTypeAnchor.data("value", execTypeValue);
                }

                _rules._checkMovedExecutionGroupState(execTypeHeaderAnchor.closest("li.action.prefix"), newType);
                execTypeHandler.addClass("dirty");

                var toolbarWrapper = jQuery("#rwBottomPaneToolbar");
                _rules._setExecutionGroupMobilitySettings(execTypeHeaderAnchor.closest("li.action.prefix"), toolbarWrapper);
            }
            _rules._dirtyHandlerCleanup();
        },

        _removeAllActionsCondition: function ()
        {
            jQuery("ul.rulesUl.handler").remove();
        },

        _getNextHandler: function (currentHandler)
        {
            return currentHandler.next("ul.handler:not(.rulesImageWrapper, .prefix)");
        },

        _getPreviousHandler: function (currentHandler)
        {
            return currentHandler.prev("ul.handler:not(.rulesImageWrapper, .prefix)");
        },

        _getCurrentHandler: function ($item)
        {
            return $item.closest("ul.handler:not(.rulesImageWrapper, .prefix)");
        },

        _getCurrentHandlerAction: function ($item)
        {
            return $item.closest("li.handler-action");
        },

        _getHandlerActionHandler: function ($item)
        {
            // return either the collection of Handler.HandlerAction.Handlers
            // or just HandlerAction.Handler depending on what is supplied.
            return $item.find(">ul.handler, >.handler-action>.rulesUl.handler");
        },

        _getHandlerIsRef: function (handler)
        {
            var handlerIsReference = false;
            if (checkExists(handler.getAttribute))
            {
                handlerIsReference = handler.getAttribute("IsReference");
            }
            else
            {
                handlerIsReference = handler[0].getAttribute("IsReference");
            }
            return checkExists(handlerIsReference) && handlerIsReference.toUpperCase() === "TRUE" ? true : false;
        },

        _mergeHandlerActions: function (thisHandler)
        {
            var doMerge = function (fromHandler, toHandler, prepend)
            {
                var actionsToMerge = fromHandler.find(">li.action, >li.handler-action");
                if (prepend)
                {
                    toHandler.find(">li.action").first().before(actionsToMerge);
                }
                else
                {
                    toHandler.find(">li.action").last().after(actionsToMerge);
                }

                fromHandler.remove();

                return toHandler;
            };

            var doNestedMerge = function (handlerAction)
            {
                var handlerToReturn = handlerAction.closest(".rulesUl.handler");

                if (_rules._isRootItem(handlerToReturn)
                    && (_rules._getHandlerType(handlerToReturn) === "If"
                        && handlerToReturn.find(">.condition").length === 0))
                {
                    var handlersToMerge = handlerAction.find(".rulesUl.handler");
                    handlerAction.after(handlersToMerge);
                }
                else
                {
                    var handlerActionsToMerge = handlerAction.find(".rulesUl.handler>.action" +
                        ", .rulesUl.handler>.handler-action");

                    handlerAction.after(handlerActionsToMerge);
                }

                handlerAction.remove();
                return handlerToReturn;
            };

            var handlerToReturn = thisHandler;

            var previousHandler = _rules._getPreviousHandler(thisHandler);
            var nextHandler = _rules._getNextHandler(thisHandler);
            //if previousHandler exists, merge with thisHandler
            if (previousHandler.length > 0)
            {
                var thisIsRefStatus = _rules._getHandlerIsRef(thisHandler);
                var thisHandlerType = _rules._getHandlerType(thisHandler, true);
                var prevHandlerType = _rules._getHandlerType(previousHandler, true);
                var prevIsRefStatus = _rules._getHandlerIsRef(previousHandler);
                /*
                    - if both not isref || if previous is isref -> merge this into previous
                    - if this isref -> merge previous into this
                    - they should never both be isref
                */
                if (thisHandlerType === "Always" && prevHandlerType === "Always")
                {
                    if (!(thisIsRefStatus || prevIsRefStatus) || prevIsRefStatus)
                    {
                        handlerToReturn = doMerge(thisHandler, previousHandler, false);
                    }
                    else
                    {
                        handlerToReturn = doMerge(previousHandler, thisHandler, true);
                    }
                }
            }
            //if nextHandler exists, merge either result of previous merge or this handler with it
            if (nextHandler.length > 0)
            {
                var returnHandlerIsRefStatus = _rules._getHandlerIsRef(handlerToReturn);
                var returnHandlerType = _rules._getHandlerType(handlerToReturn, true);
                var nextHandlerType = _rules._getHandlerType(nextHandler, true);
                var nextIsRefStatus = _rules._getHandlerIsRef(nextHandler);
                /*
                    - if both not isref || if returnHandler is isref -> merge next into returnHandler
                    - if next isref -> merge returnHandler into next
                    - they should never both be isref
                */
                if (returnHandlerType === "Always" && nextHandlerType === "Always")
                {
                    if (!(returnHandlerIsRefStatus || nextIsRefStatus) || returnHandlerIsRefStatus)
                    {
                        handlerToReturn = doMerge(nextHandler, handlerToReturn, false);
                    }
                    else
                    {
                        handlerToReturn = doMerge(handlerToReturn, nextHandler, true);
                    }
                }
            }

            if (_rules._checkHandlerExistanceValid(handlerToReturn))
            {
                handlerToReturn.addClass("dirty");
                var parentHandlerAction = _rules._getCurrentHandlerAction(handlerToReturn);
                if (parentHandlerAction.length > 0)
                {
                    var parentHandlerActionIfHandlers = parentHandlerAction.find(">.rulesUl.handler.If > .condition");
                    var parentHandlerActionsIfHandlerLength = parentHandlerActionIfHandlers.length;
                    var parentHandlerActionOtherHandlers = parentHandlerAction.find(">.rulesUl.handler:not(.If)");
                    var parentHandlerActionOtherHandlersLength = parentHandlerActionOtherHandlers.length;

                    if (parentHandlerActionsIfHandlerLength === 0 && parentHandlerActionOtherHandlersLength === 0)
                    {
                        handlerToReturn = doNestedMerge(parentHandlerAction);
                        _rules._mergeHandlerActions(handlerToReturn);
                    }
                }
                else if (_rules._isRootItem(handlerToReturn))
                {
                    var handlerToReturnNestedHandlers = _rules._getHandlerActionHandler(handlerToReturn);
                    if (_rules._getHandlerType(handlerToReturn, true) === "Always" && handlerToReturnNestedHandlers.length > 0)
                    {
                        handlerToReturn.after(handlerToReturnNestedHandlers);
                        handlerToReturn.find(">.handler-action" +
                            ", >.action.prefix>.rulesUl.action.prefix>.handler-action").remove();

                        _rules._mergeHandlerActions(handlerToReturn);
                    }
                }
            }

            if (_rules._checkHandlerExistanceValid(thisHandler))
            {
                thisHandler.addClass("dirty");
            }

            return handlerToReturn;
        },

        _toggleEmptyRuleDesignPlaceHolder: function ()
        {
            var $ruleArea = $("#RulePanelbox_RuleArea");
            var $ruleActionsAreaUl = $ruleArea.find("ul.rulesUl.handler");
            var $ruleEventAreaUlChildren = $ruleArea.find("#ruleDefinitionRulesArea").children().last();
            var ruleIsEventless = $ruleEventAreaUlChildren.length > 0 ? $ruleEventAreaUlChildren.data().name === "Rule" : false;
            if (($ruleEventAreaUlChildren.length === 0 || ruleIsEventless) && $ruleActionsAreaUl.length === 0)
            {
                $("#EmptyRuleDesign_Placeholder").show();
                $ruleArea.hide();
            }
            else
            {
                $("#EmptyRuleDesign_Placeholder").hide();
                $ruleArea.show();
            }
        },

        _resetConditionSpecifierHeight: function ($handler)
        {
            var $conditionSpecifier;
            if (typeof $handler === "undefined")
            {
                $conditionSpecifier = $("#RulePanelbox_RuleArea").find(".condition-specifier");
            }
            else
            {
                $conditionSpecifier = $handler.find(">.condition-specifier");
            }
            $conditionSpecifier.each(function ()
            {
                var $this = $(this);
                var $conditionExpander = $this.prev();
                $this.css({ 'top': $conditionExpander.position().top + 16 + 'px' });
            });
        },

        _refreshSelectedItemToolbarState: function ()
        {
            var $rulePanelBox = $("#RulePanelbox");
            var $currentlySelectedRuleItem = $rulePanelBox.find("li.condition.selected, li.action.selected");
            var $currentlySelectedHandler = $rulePanelBox.find("ul.rulesUl.handler:not(.prefix).selected");
            var $currentlySelectedExecutionGroup = $rulePanelBox.find("li.action.prefix.selected");
            var $mainToolbarWrapper = $("#rwBottomPaneToolbar");

            if ($currentlySelectedRuleItem.length > 0)
            {
                _rules._setItemMobilitySettings($currentlySelectedRuleItem, $mainToolbarWrapper);
            }
            else if ($currentlySelectedHandler.length > 0)
            {
                _rules._setHandlerMobilitySettings($currentlySelectedHandler, $mainToolbarWrapper);
            }
            else if ($currentlySelectedExecutionGroup.length > 0)
            {
                _rules._setExecutionGroupMobilitySettings($currentlySelectedExecutionGroup, $mainToolbarWrapper);
            }
        },

        filterUI: function (attrName, filterValue)
        {
            // Conditions
            // Show all conditions then filter out
            var $conditionsPBButtons = $("#ConditionsRulePanelbox").find(".radiobox-button");
            $conditionsPBButtons.removeClass("support-filtered");
            $conditionsPBButtons.filter(function (index, item)
            {
                var $item = $(item);
                var conditionItemFilterArray = [];

                if (checkExistsNotEmpty(attrName))
                {
                    var conditionItemFilterAttr = $item.attr(attrName);
                    if (checkExistsNotEmpty(conditionItemFilterAttr))
                    {
                        conditionItemFilterArray = conditionItemFilterAttr.split("|");
                        var supportAll = conditionItemFilterArray.indexOf(SourceCode.Forms.Designers.Rule.Wizard.ALL_SUPPORTED_TYPE) > -1;
                        if (!supportAll)
                        {
                            if (checkExistsNotEmpty(filterValue) && conditionItemFilterArray.indexOf(filterValue) === -1)
                            {
                                $item.addClass("support-filtered");
                            }
                            else if (!checkExistsNotEmpty(filterValue) && conditionItemFilterArray.length > 0)
                            {
                                $item.addClass("support-filtered");
                            }
                        }
                    }
                    else
                    {
                        if (checkExistsNotEmpty(filterValue))
                        {
                            $item.addClass("support-filtered");
                        }
                    }
                }
            })

            // Apply searching on conditions if text does exist 
            var searchText = $("#rwTabbedRuleItemConditionsTab").data("searchtext");
            if (checkExists(searchText))
            {
                SourceCode.Forms.Designers.Rule.Wizard._searchRuleItems("ConditionsRulePanelbox", searchText);
            }

            // Actions
            // Show all actions then filter out
            var $actionPBButtons = $("#ActionsRulePanelbox").find(".radiobox-button");
            $actionPBButtons.removeClass("support-filtered");
            $actionPBButtons.filter(function (index, item)
            {
                var $item = $(item);
                var actionItemFilterArray = [];

                if (checkExistsNotEmpty(attrName))
                {
                    var actionItemFilterAttr = $item.attr(attrName);
                    if (checkExistsNotEmpty(actionItemFilterAttr))
                    {
                        actionItemFilterArray = actionItemFilterAttr.split("|");
                        var supportAll = actionItemFilterArray.indexOf(SourceCode.Forms.Designers.Rule.Wizard.ALL_SUPPORTED_TYPE) > -1;
                        if (!supportAll)
                        {
                            if (checkExistsNotEmpty(filterValue) && actionItemFilterArray.indexOf(filterValue) === -1)
                            {
                                $item.addClass("support-filtered");
                            }
                            else if (!checkExistsNotEmpty(filterValue) && actionItemFilterArray.length > 0)
                            {
                                $item.addClass("support-filtered");
                            }
                        }
                    }
                    else
                    {
                        if (checkExistsNotEmpty(filterValue))
                        {
                            $item.addClass("support-filtered");
                        }
                    }
                }
            })

            // Apply searching on actions if text does exist 
            var searchText = $("#rwTabbedRuleItemActionsTab").data("searchtext");
            if (checkExists(searchText))
            {
                SourceCode.Forms.Designers.Rule.Wizard._searchRuleItems("ActionsRulePanelbox", searchText);
            }

            SourceCode.Forms.Designers.Rule.Wizard.checkCategoriesVisibility();
        }
    };

    var _eventHelper = SourceCode.Forms.Designers.Rule.EventHelper =
        {
            findEventFromRuleEventData: function (eventData)
            {
                var name;
                var sourceID;
                var sourceType;
                var sourceName;
                var eventName = eventData.EventName;
                var instanceID = eventData.InstanceID;
                var subFormID = eventData.SubFormID;
                var rwContext = eventData.CurrentRuleWizardContext;
                var xPath = rwContext === "View" || rwContext === "Control" ? "//View" : "//Form/States/State";
                var sourceTypes =
                    {
                        View: "View",
                        Form: "Form",
                        Control: "Control",
                        Rule: "Rule",
                        ViewParameter: "ViewParameter",
                        FormParameter: "FormParameter"
                    };
                switch (eventName)
                {
                    case "WorkflowActioned":
                    case "SubFormViewWorkflowActioned":
                    case "SubFormWorkflowActioned":
                    case "SubViewWorkflowActioned":
                    case "FormViewWorkflowActioned":
                    case "FormWorkflowActioned":
                        name = "WorkflowActioned";
                        sourceID = checkExistsNotEmpty(eventData.View) ? eventData.View : eventData.Form;
                        sourceType = checkExistsNotEmpty(eventData.View) ? sourceTypes.View : sourceTypes.Form;
                        break;
                    case "ViewWorkflowViewEvent":
                    case "SubViewWorkflowViewEvent":
                    case "SubFormWorkflowViewEvent":
                    case "SubFormViewWorkflowViewEvent":
                    case "FormWorkflowViewEvent":
                        name = "WorkflowSubmit";
                        sourceID = checkExistsNotEmpty(eventData.View) ? eventData.View : eventData.Form;
                        sourceType = checkExistsNotEmpty(eventData.View) ? sourceTypes.View : sourceTypes.Form;
                        break;
                    case "FormEvent":
                    case "OpenedFormEvent":
                        name = eventData.FormEvent;
                        sourceID = null;
                        sourceType = sourceTypes.Form;
                        break;
                    case "ViewEvent":
                    case "SubViewEvent":
                    case "OpenedFormViewEvent":
                        name = eventData.ViewMethod;
                        sourceID = eventData.View;
                        sourceType = sourceTypes.View;
                        break;
                    case "OpenedFormCloseEvent":
                    case "OpenedViewCloseEvent":
                        name = "Closed";
                        sourceID = checkExistsNotEmpty(eventData.View) ? eventData.View : eventData.Form;
                        sourceType = checkExistsNotEmpty(eventData.View) ? sourceTypes.View : sourceTypes.Form;
                        break;
                    case "ViewControlEvent":
                    case "FormControlEvent":
                    case "OpenedFormControlEvent":
                    case "OpenedFormViewControlEvent":
                    case "SubViewControlEvent":
                        name = eventData.ControlEvent;
                        sourceID = checkExistsNotEmpty(eventData.ViewControl) ? eventData.ViewControl : eventData.FormControl;
                        sourceType = sourceTypes.Control;
                        break;
                    case "FormParameterEvent":
                    case "FormViewParameterEvent":
                    case "SubViewParameterEvent":
                    case "SubFormParameterEvent":
                    case "SubFormViewParameterEvent":
                    case "ViewParameterEvent":
                        sourceName = checkExistsNotEmpty(eventData.ViewParameter) ? eventData.ViewParameter : eventData.FormParameter;
                        sourceType = checkExistsNotEmpty(eventData.ViewParameter) ? sourceTypes.ViewParameter : sourceTypes.FormParameter;
                        break;
                    case "FormServerPreRenderEvent":
                    case "ViewServerPreRenderEvent":
                    case "SubFormServerPreRenderEvent":
                    case "SubFormViewServerPreRenderEvent":
                    case "SubViewServerPreRenderEvent":
                        name = "ServerPreRender";
                        sourceID = checkExistsNotEmpty(eventData.View) ? eventData.View : eventData.Form;
                        sourceType = checkExistsNotEmpty(eventData.View) ? sourceTypes.View : sourceTypes.Form;
                        break;
                }

                xPath += "/Events/Event[(@SourceType='{0}') and (@Type='User')".format(sourceType);

                // Add SourceID if it exists
                if (checkExists(sourceID) && sourceID !== '')
                {
                    xPath += " and (@SourceID='{0}')".format(sourceID);
                }

                if (checkExists(sourceName) && sourceName !== '')
                {
                    xPath += " and (@SourceName='{0}')".format(sourceName);
                }

                // Add InstanceID if it exists
                if (checkExists(instanceID) && instanceID !== '')
                {
                    xPath += " and (@InstanceID='{0}')".format(instanceID);
                }
                else
                {
                    xPath += " and not(@InstanceID)";
                }

                // Add SubFormID if it exists
                if (checkExists(subFormID) && subFormID !== '')
                {
                    xPath += " and (@SubFormID='{0}')".format(subFormID);
                }
                else
                {
                    xPath += " and not(@SubFormID)";
                }

                if (checkExists(name) && name !== '')
                {
                    xPath += "][Name/text()='{0}']".format(name);
                }
                else
                {
                    xPath += "]";
                }
                // Used to generate unit test JSON
                //if (typeof globalEventData === "undefined")
                //	globalEventData ="";
                //if (SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectNodes(xPath).length > 0)
                //	globalEventData += '{"eventData":' + JSON.stringify(eventData) + ',"expectedEventId":"' + SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectNodes(xPath)[0].getAttribute("ID") + '"},';

                return SourceCode.Forms.Designers.Rule.tmpContextDefinition.selectNodes(xPath);
            },
            transformRuleEventXmlToAuthoringEventXml: function (options)
            {
                var eventsXml;

                if (options.eventsXml)
                {
                    eventsXml = options.eventsXml;
                }
                else if (options.eventData)
                {
                    eventsXml = _eventHelper.findEventFromRuleEventData(options.eventData);
                }
                else
                {
                    return;
                }

                var eventXml;
                var eventsXmlLength = eventsXml.length;
                var eventsIdArray = [];

                if (eventsXml !== null && eventsXmlLength > 0)
                {
                    for (var e = 0; e < eventsXmlLength; e++)
                    {
                        eventXml = eventsXml[e];
                        var eventID = eventXml.getAttribute("ID");
                        var stateID = eventXml.parentNode.parentNode.getAttribute("ID");
                        var combinedID = "{0}_{1}".format(eventID, stateID);
                        eventsIdArray.push(combinedID);
                    }

                    var ruleDef = SourceCode.Forms.Designers.Rule.AJAXCall._getRuleDefinition(eventsIdArray);
                    var ruleNodes = ruleDef.selectNodes("Rules/Rule");
                    var ruleNodesLength = ruleNodes.length;

                    if (ruleNodes !== null && ruleNodesLength > 0)
                    {
                        //SourceCode.Forms.Designers.Rule.Wizard._setRulesWizardToDefault();
                        var rulesNode = SourceCode.Forms.Designers.Rule.tmpConfiguredRulesDefinitionXML.selectSingleNode("Rules");
                        var eventDefinitionGuid = eventXml.getAttribute("DefinitionID");

                        for (var r = 0; r < ruleNodesLength; r++)
                        {
                            var ruleDefinitionGuid = rulesNode.selectNodes("Rule/Events/Event[@DefinitionID='{0}']".format(eventDefinitionGuid));
                            if (ruleDefinitionGuid !== null && ruleDefinitionGuid.length > 0) // If the length is greater than 0 it means this item has already been added from another state
                            {
                                break;
                            }

                            var ruleNode = ruleNodes[r];
                            var clonedNode = ruleNode.cloneNode(true);

                            rulesNode.appendChild(clonedNode);
                        }

                        eventsXml = rulesNode;
                    }
                }

                return eventsXml;
            },

            _smartObjectInfoCache: {},
            _smartObjectInfoCacheDuration: 10000,

            _getSmartobjectGuidAndMethod: function (controlId)
            {
                var result = null;
                var xpath = "SourceCode.Forms/Views/View/Controls/Control[@ID={0}]".format(controlId.xpathValueEncode());
                if (checkExists(SourceCode.Forms.Designers.View) && checkExists(SourceCode.Forms.Designers.View.viewDefinitionXML))
                {
                    var controlNode = SourceCode.Forms.Designers.View.viewDefinitionXML.selectSingleNode(xpath);
                    if (checkExists(controlNode))
                    {
                        var isCompositeNode = controlNode.selectSingleNode("Properties/Property[Name='IsComposite']/Value");
                        var isComposite = false, guid, method;

                        if (checkExists(isCompositeNode))
                        {
                            var isCompositeText = isCompositeNode.text;
                            isComposite = checkExists(isCompositeText) && isCompositeText.toLowerCase() === "true";
                        }

                        if (!isComposite)
                        {
                            guid = controlNode.selectSingleNode("Properties/Property[Name='AssociationSO']/Value");
                            method = controlNode.selectSingleNode("Properties/Property[Name='AssociationMethod']/Value");
                        }
                        else
                        {
                            guid = controlNode.selectSingleNode("Properties/Property[Name='DisplaySO']/Value");
                            method = controlNode.selectSingleNode("Properties/Property[Name='DisplayMethod']/Value");
                        }

                        if (checkExists(guid) && checkExists(method))
                        {
                            result = {};
                            result.guid = guid.text;
                            result.method = method.text;
                            result.ownerDocument = SourceCode.Forms.Designers.View.viewDefinitionXML;
                        }
                    }
                }
                return result;
            },

            _getSmartObjectDetail: function (smartObjectGuid)
            {
                if (!checkExists(_eventHelper._smartObjectInfoCache[smartObjectGuid]) || (new Date() - _eventHelper._smartObjectInfoCache[smartObjectGuid].timestamp > _eventHelper._smartObjectInfoCacheDuration))
                {
                    jQuery.ajax({
                        url: 'Utilities/AJAXCall.ashx',
                        data: {
                            method: 'getItems',
                            resultTypes: 'ObjectMethods|MethodInputs|MethodResultProperties',
                            targetType: 'Object',
                            targetId: smartObjectGuid
                        },
                        dataType: 'xml',
                        async: false,
                        global: false
                    })
                        .done(function (data)
                        {
                            _eventHelper._smartObjectInfoCache[smartObjectGuid] = { data: data, timestamp: new Date() };
                        });
                }
                return _eventHelper._smartObjectInfoCache[smartObjectGuid];
            },

            _getSmartObjectInfo: function (controlId)
            {
                var info = _eventHelper._getSmartobjectGuidAndMethod(controlId);
                if (checkExists(info))
                {
                    info.detail = _eventHelper._getSmartObjectDetail(info.guid);
                    if (!checkExists(info.detail))
                    {
                        info = null;
                    }
                }
                return info;
            },

            _isValidSmartObjectReturn: function (soDetails, property)
            {
                var smartObjectInfo = soDetails.detail;

                if (!checkExists(smartObjectInfo.methods))
                {
                    smartObjectInfo.methods = {};
                }

                if (!checkExists(smartObjectInfo.methods[soDetails.method]))
                {
                    smartObjectInfo.methods[soDetails.method] = {};
                }

                if (!checkExists(smartObjectInfo.methods[soDetails.method].validReturnPropertyNames))
                {
                    var xpath = "Items/Item[@ItemType='Object']/Items/Item[Name={0} and @ItemType='Method']/Items/Item[@ItemType='MethodReturnedProperty']/Name".format(soDetails.method.xpathValueEncode());
                    var validReturnPropertyNameNodes = smartObjectInfo.data.selectNodes(xpath);
                    var validReturnPropertyNames = {};

                    for (var y = 0; y < validReturnPropertyNameNodes.length; y++)
                    {
                        validReturnPropertyNames[validReturnPropertyNameNodes[y].text] = true;
                    }

                    smartObjectInfo.methods[soDetails.method].validReturnPropertyNames = validReturnPropertyNames;
                }

                return smartObjectInfo.methods[soDetails.method].validReturnPropertyNames[property];
            },

            fieldValidator: function (designerDefinition)
            {
                var fields = designerDefinition.selectNodes("SourceCode.Forms/Views/View/Sources/Source/Fields/Field/@ID");
                this.validFields = {};

                for (var y = 0; y < fields.length; y++)
                {
                    this.validFields[fields[y].text] = true;
                }

                this.isValidField = function (fieldGuid)
                {
                    return this.validFields[fieldGuid];
                };
            },

            checkIfSmartObjectFilterIsValid: function (filterNode, soDetails)
            {
                var items, currentItem, currentTargetID;
                if (filterNode.getAttribute("isSimple") === "True")
                {
                    items = filterNode.selectNodes("//Item[@SourceType='ObjectProperty']");

                    for (var y = 0; y < items.length; y++)
                    {
                        currentItem = items[y];
                        currentTargetID = currentItem.getAttribute("SourceID");

                        if (!_eventHelper._isValidSmartObjectReturn(soDetails, currentTargetID))
                        {
                            return false;
                        }
                    }
                }
                else
                {
                    var fieldValidator = new _eventHelper.fieldValidator(soDetails.ownerDocument);

                    items = filterNode.selectNodes("//Item[@SourceType='ViewField']");

                    for (var x = 0; x < items.length; x++)
                    {
                        currentItem = items[x];
                        currentTargetID = currentItem.getAttribute("SourceID");
                        if (!fieldValidator.isValidField(currentTargetID))
                        {
                            return false;
                        }
                    }
                }

                return true;
            },

            checkIfSmartObjectOrderIsValid: function (orderNode, soDetails)
            {

                var existingSorters = orderNode.selectNodes("Sorters/Sorter[@SourceType='ObjectProperty']");

                for (var y = 0; y < existingSorters.length; y++)
                {
                    var currentItem = existingSorters[y];
                    var currentTargetID = currentItem.getAttribute("SourceID");

                    if (!_eventHelper._isValidSmartObjectReturn(soDetails, currentTargetID))
                    {
                        return false;
                    }
                }
                return true;
            },

            checkIfControlFilterIsValid: function (filterNode, controlId)
            {
                var soDetails = _eventHelper._getSmartObjectInfo(controlId);

                if (checkExists(soDetails))
                {
                    return _eventHelper.checkIfSmartObjectFilterIsValid(filterNode, soDetails);
                }

                return true;
            },

            checkIfControlOrderIsValid: function (orderNode, controlId)
            {
                var soDetails = _eventHelper._getSmartObjectInfo(controlId);

                if (checkExists(soDetails))
                {
                    return _eventHelper.checkIfSmartObjectOrderIsValid(orderNode, soDetails);
                }

                return true;
            },

            //This function will correct all incorrect guids / methods for a particular control's populate action
            _ensureCorrectSmartObjectDetails: function (actionNode, soDetails)
            {
                var guid = actionNode.selectSingleNode("Properties/Property[Name='ObjectID']/Value");
                var method = actionNode.selectSingleNode("Properties/Property[Name='Method']/Value");

                if (checkExists(guid) && checkExists(method))
                {
                    if (guid.text !== soDetails.guid)
                    {
                        while (guid.childNodes.length > 0)
                        {
                            guid.removeChild(guid.childNodes[0]);
                        }
                        guid.appendChild(actionNode.ownerDocument.createTextNode(soDetails.guid));
                    }

                    if (method.text !== soDetails.method)
                    {
                        while (method.childNodes.length > 0)
                        {
                            method.removeChild(method.childNodes[0]);
                        }
                        method.appendChild(actionNode.ownerDocument.createTextNode(soDetails.method));
                    }
                }
            },

            //This function will correct all incorrect guids / methods for a particular control's populate actions
            ensureCorrectSmartObjectDetails: function (context)
            {
                var eventsNode = context.eventsNode;
                var controlId = context.controlId;

                var soDetails = _eventHelper._getSmartObjectInfo(controlId);
                if (checkExists(soDetails))
                {
                    var xpath = "Event[@Type='User']/Handlers/Handler/Actions/Action[@Type='Execute' or @Type='PopulateControl'][Properties/Property[Name='ControlID' and Value='{0}']]".format(controlId);
                    var controlActionNodes = eventsNode.selectNodes(xpath);

                    for (var x = 0; x < controlActionNodes.length; x++)
                    {
                        _eventHelper._ensureCorrectSmartObjectDetails(controlActionNodes[x], soDetails);
                    }
                }
            }
        };
})(jQuery);
