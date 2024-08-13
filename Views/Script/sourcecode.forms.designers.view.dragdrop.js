/* global SourceCode: true */
/* global Resources: true */
/* global checkExists: false */
/* global checkExistsNotEmpty: false */
/* global popupManager: false */
/* global $chk: false */

(function ($)
{

    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};

    var _dragDrop = SourceCode.Forms.Designers.View.DragDrop = {

        // this is needed for auto-generation, don't set this value!!
        lastAddedLabelID: null,
        isDropping: false,
        _newControlIds: [],

        _dropControl: function (event, ui, jq_this)
        {
            _dragDrop.isDropping = true;
            ui.draggable.show();

            var dragtype = '';
            var data;
            var contextobject;

            // apply any changes that have been made in the property grid
            if (_dragDrop.View.propertyGrid &&
                _dragDrop.View.propertyGrid.lastFocus &&
                _dragDrop.View.propertyGrid.lastFocus.closest(".lookup-box").length === 0)
            {
                var newVal = _dragDrop.View.propertyGrid.lastFocus.val();
                var oldVal = _dragDrop.View.propertyGrid.lastVal;

                if (newVal !== oldVal)
                {
                    _dragDrop.View.propertyGrid.lastFocus.trigger("change");
                }

                _dragDrop.View.propertyGrid.lastFocus = null;
            }

            // Always hide column selector and drag handlers
            jQuery(".column-selected-overlay").hide().removeData("column");
            jQuery("div.drag-block").hide();

            jQuery('div.toolbar-droppable').css('display', 'none');
            if (ui.helper.hasClass('toolboxitem'))
            {
                dragtype = 'external';
            }
            else
            {
                dragtype = 'internal';
            }

            //section being dropped on
            var contextobject = jQuery(event.target);
            var section = _dragDrop.ViewDesigner._getSection(contextobject);

            if (dragtype === 'internal')
            {
                data = {
                    dragtype: dragtype,
                    original: ui.draggable,
                    section: section.attr('id'),
                    contextobject: contextobject
                };

                switch (_dragDrop.ViewDesigner._getViewType())
                {
                    case 'CaptureList':
                        var dropType = data.original.attr("layouttype");
                        var fromSection = ui.draggable.closest("#toolbarSection");
                        var footerIsparent = ui.draggable.parents(".footer").length > 0;
                        var isToolBarDrop = jQuery(event.target).parents("#toolbarSection").length > 0;
                        var isFooterDrop = jQuery(event.target).parents(".footer").length > 0;
                        if ((fromSection.length > 0 && data.section !== fromSection.attr("id")) || (footerIsparent && (!isToolBarDrop && !isFooterDrop)) && (dropType === "control" || dropType === "layoutcontainer"))
                        {
                            _dragDrop.ViewDesigner._setSelectedObject(ui.draggable);
                            if (data.section === fromSection.attr("id"))
                            {
                                _dragDrop._InternalViewDrop(contextobject, data);
                            }
                            else
                            {
                                _dragDrop.ViewDesigner._setViewSelected();
                            }
                            return;
                        }
                        _dragDrop._InternalCaptureListViewDrop(contextobject, data);
                        break;
                    default:
                        _dragDrop._InternalViewDrop(contextobject, data);
                        break;
                }
            }
            else
            {
                switch (ui.helper.attr('itemtype'))
                {
                    case 'method':
                        data = {
                            itemtype: ui.helper.attr('itemtype'),
                            methodid: ui.helper.attr('methodid'),
                            friendlyname: ui.helper.attr('friendlyname'),
                            soid: ui.helper.attr('soid').toLowerCase(),
                            methodtype: ui.helper.attr('methodtype'),
                            dragtype: dragtype,
                            section: section.attr('id')
                        };
                        break;
                    case 'control':
                    case 'layoutcontainer':
                        data = {
                            itemtype: ui.helper.attr('itemtype'),
                            friendlyname: ui.helper.attr('friendlyname'),
                            name: ui.helper.attr('name'),
                            dragtype: dragtype,
                            section: section.attr('id')
                        };
                        break;

                    default: //property
                        data = {
                            itemtype: ui.helper.attr('itemtype'),
                            references: ui.helper.attr('references'),
                            propertytype: ui.helper.attr('propertytype'),
                            propertyid: ui.helper.attr('propertyid'),
                            friendlyname: ui.helper.attr('friendlyname'),
                            soid: ui.helper.attr('soid').toLowerCase(),
                            dragtype: dragtype,
                            section: section.attr('id'),
                            addColonSuffix: _dragDrop.View.element.find("#vdaddColonSuffixChk").is(":checked")
                        };
                        break;
                }

                switch (_dragDrop.ViewDesigner._getViewType())
                {
                    case 'CaptureList':
                        _dragDrop._CaptureListViewDrop(contextobject, data, null, true);
                        break;
                    default:
                        if (data.friendlyname.toLowerCase() === "table")
                        {
                            if (_dragDrop.CheckOut._checkViewStatus())
                            {
                                SourceCode.Forms.Controls.Web.TableBehavior.prototype._tablePopup(contextobject, data, SourceCode.Forms.Designers.View);
                            }
                        }
                        else
                            _dragDrop.DesignerTable._CaptureViewDrop(contextobject, data, null, true);
                        break;
                }
            }

            // make sure the correct property tabs are displayed and selected
            if (checkExists(_dragDrop.View.selectedObject) && _dragDrop.View.selectedObject.length > 0)
            {
                var selectedObj = _dragDrop.View.selectedObject;

                _dragDrop.ViewDesigner._configurePropertiesTab(_dragDrop.View.selectedObject);
            }
            else
            {
                _dragDrop.ViewDesigner._setViewSelected();
            }

            _dragDrop.View.isViewChanged = true;
            _dragDrop.DesignerTable._positionHandlers();

        },

        _selectOnDrop: function (object)
        {
            if (_dragDrop.isDropping === true)
            {
                var overlay = jQuery('.column-hover-overlay');
                var firstRow = _dragDrop.View.element.find('#bodySection').find('tr')[0];
                var columnsToSelect = jQuery(firstRow).find('td');
                var dropIndex = object.index();

                _dragDrop.ViewDesigner._configurePropertiesTab(overlay);
                _dragDrop.DesignerTable._setupColumnOverlay(jQuery(columnsToSelect[dropIndex]));
                _dragDrop.ViewDesigner._configSelectedControl(jQuery(columnsToSelect[dropIndex]));
                _dragDrop.ViewDesigner.controlSelected = true;
                _dragDrop.isDropping = false;
            }
        },

        _InternalViewDrop: function (cell, data)
        {
            var isDroppedOnToolbarDroppable = false;

            if (data.contextobject.hasClass('toolbar-droppable'))
            {
                isDroppedOnToolbarDroppable = true;
            }

            var isRemovedFromToolbar = (data.original.parent().find("div").hasClass('toolbar-droppable')) ? true : false;

            var originalItem = data.original;
            var id = originalItem.attr('id');
            var wrapperClass = 'controlwrapper';

            if (data.section === 'toolbarSection')
                wrapperClass = 'controlwrapper inline';
            else
                wrapperClass = 'controlwrapper';

            if (originalItem.length > 0)
            {
                var ControlWrapper = originalItem;

                //888706 When draggable control was created, inline style display:block is automatically set.  
                //Thus need to remove this inline style so it will use the style defined from the css after the control is dropped.
                $(ControlWrapper).css("display", "");

                var ControlWrapperResize = originalItem.find(".resizewrapper");

                var origParent = SourceCode.Forms.Controls.Web.TableBehavior.prototype._getParentEditorCell(originalItem);
                var layouttype = originalItem.attr('layouttype');
                var controltype = originalItem.attr('controltype');

                if (controltype === "Table" && originalItem.find(".editor-table").hasClass("toolbar") && data.section !== 'toolbarSection')
                {
                    var table = $(ControlWrapper.find(".editor-table"));
                    table.removeClass('toolbar');
                }

                if (cell.html() === '&nbsp;')
                {
                    cell.empty();
                }

                if (isDroppedOnToolbarDroppable)
                {
                    ControlWrapper.insertAfter(data.contextobject);

                    if (controltype === "Table")
                    {
                        $("#dragContentHolder .controlwrapper").remove();
                    }

                    _dragDrop._addToolbarDroppables(ControlWrapper);
                }
                else
                {
                    //var droppableToRemove = ControlWrapper.next();
                    cell.append(ControlWrapper);

                    if (controltype === "Table")
                    {
                        $("#dragContentHolder .controlwrapper").remove();
                    }

                    //droppableToRemove.remove();

                    if (data.section === 'toolbarSection')
                    {
                        _dragDrop._addToolbarDroppables(ControlWrapper);
                    }
                }

                var properties = _dragDrop.ViewDesigner._getProperties(id);
                var styles = _dragDrop.Styles._getStyles(id, controltype);

                if (layouttype === 'layoutcontainer')
                {
                    _dragDrop.ViewDesigner._makeChildElementsDragable(ControlWrapper);
                }
                else
                {
                    _dragDrop.ViewDesigner._makeElementDragable(ControlWrapper);
                }
                var section = _dragDrop.ViewDesigner._getSection(origParent);
                _dragDrop.DesignerTable._configureCell(section.attr('id'), origParent.parent(), origParent);

                if (checkExists(properties))
                {
                    if (layouttype !== 'layoutcontainer')
                    {
                        _dragDrop.AJAXCall._updateControlProperties(id, controltype, _dragDrop.View.viewDefinitionXML.createElement("Properties"), properties, styles);//add
                    }
                }

                if (origParent.children(":not(.watermark-text, .toolbar-droppable)").length === 0 && origParent.children().hasClass("watermark-text"))
                {
                    origParent.children().remove(".toolbar-droppable");
                    this._ToggleContextWaterMark(origParent);
                }
                if (data.section === "toolbarSection")
                {
                    this._ToggleContextWaterMark(cell);
                }

                // remove line-break from original cell
                if (origParent.length > 0)
                {
                    origParent.find(".line-break,span.non-breaking-space").remove();
                }

                SourceCode.Forms.Designers.Common.triggerEventFromControlElement("ControlMoved", originalItem);
            }
        },

        _getSubItem: function (cell)
        {
            var retVal = null;

            if (cell)
            {
                retVal = jQuery(cell).children()[0];
            }
            return retVal;
        },

        _InternalCaptureListViewDrop: function (cell, data)
        {
            var _tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
            var isDroppedOnToolbarDroppable = false;

            if (data.contextobject.hasClass('toolbar-droppable'))
            {
                isDroppedOnToolbarDroppable = true;
            }

            var nextRow = cell.closest("tr").next("tr.footer:not(.placeholder-footer)");
            if (data.section !== 'toolbarSection' && nextRow.length === 0)
            {
                // add new row to footer
                _dragDrop.DesignerTable._addFooterRow();
            }

            var originalItem = data.original;
            var id = originalItem.attr('id');
            var wrapperClass = 'controlwrapper';

            if (data.section === 'toolbarSection')
                wrapperClass = 'controlwrapper inline';
            else
                wrapperClass = 'controlwrapper';

            if (originalItem.length > 0)
            {
                var originalCell = originalItem.parent();
                var subCell = _dragDrop._getSubCell(cell);
                var subOriginalCell = _dragDrop._getSubCell(originalCell);
                var originalSubItem = _dragDrop._getSubItem(subOriginalCell);

                //var ControlDef = BuildControlWrapper(id);
                var ControlWrapper = originalItem;

                //888706 When draggable control was created, inline style display:block is automatically set.  
                //Thus need to remove this inline style so it will use the style defined from the css after the control is dropped.
                $(ControlWrapper).css("display", "");

                var ControlWrapperResize = originalItem.find(".resizewrapper");

                var layout = originalItem.attr('layout');
                var layouttype = originalItem.attr('layouttype');
                var itemtype = originalItem.attr('itemtype');
                var controltype = originalItem.attr('controltype');
                var references = originalItem.attr('references');
                var propertytype = originalItem.attr('propertytype');
                var propertyid = originalItem.attr('propertyid');
                var soid = originalItem.attr('soid');
                var methodid = originalItem.attr('methodid');

                var origParent = SourceCode.Forms.TableHelper.getCellFromElement(originalItem);
                var properties = _dragDrop.ViewDesigner._getProperties(id);
                var styles = _dragDrop.Styles._getStyles(id, controltype);

                if (!checkExists(properties))
                {
                    properties = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                    _dragDrop.ViewDesigner._loadPropertyTypeProperties(properties, id, controltype, propertytype);
                }

                _dragDrop.DesignerTable._configureCell(data.section, origParent.parent(), origParent);

                if (checkExists(properties))
                {
                    _dragDrop.ViewDesigner._setControlPropertiesXML(id, properties);
                    if (layouttype !== 'layoutcontainer')
                    {
                        _dragDrop.AJAXCall._updateControlProperties(id, controltype, _dragDrop.View.viewDefinitionXML.createElement("Properties"), properties, styles); //edit capture list
                    }
                }
                if (cell.html() === '&nbsp;')
                {
                    cell.empty();
                }
                else
                {
                    if (data.section !== 'toolbarSection' && !originalCell.closest("tr").hasClass("footer"))
                    {
                        cell.empty();
                    }
                }

                if (isDroppedOnToolbarDroppable)
                {
                    ControlWrapper.insertAfter(data.contextobject);

                    _dragDrop._addToolbarDroppables(ControlWrapper);
                }
                else
                {
                    cell.append(ControlWrapper);

                    if (data.section === 'toolbarSection')
                    {
                        _dragDrop._addToolbarDroppables(ControlWrapper);
                    }
                }

                if (layouttype === 'layoutcontainer')
                {
                    _dragDrop.ViewDesigner._makeChildElementsDragable(ControlWrapper);
                }
                else
                {
                    _dragDrop.ViewDesigner._makeElementDragable(ControlWrapper);
                }

                //create sub item
                if (originalSubItem)
                {
                    if (originalSubItem.length > 0)
                    {
                        id = originalSubItem.attr('id');
                        var ControlDef = _dragDrop.BuildControlWrapper(id);
                        var SubControlWrapper = ControlDef.wrapper;
                        var SubControlWrapperResize = ControlDef.resizeWrapper;

                        layouttype = originalItem.attr('layouttype');
                        friendlyname = originalSubItem.attr('friendlyname');
                        itemtype = originalSubItem.attr('itemtype');
                        controltype = originalSubItem.attr('controltype');
                        references = originalSubItem.attr('references');
                        propertytype = originalSubItem.attr('propertytype');
                        propertyid = originalSubItem.attr('propertyid');
                        soid = originalSubItem.attr('soid');
                        methodid = originalSubItem.attr('methodid');
                        width = originalSubItem.width() + 'px';
                        height = originalSubItem.height() + 'px';

                        SubControlWrapper.attr('layouttype', layouttype);
                        SubControlWrapper.attr('friendlyname', friendlyname);
                        SubControlWrapper.attr('itemtype', itemtype);
                        SubControlWrapper.attr('controltype', controltype);
                        SubControlWrapper.attr('references', references);
                        SubControlWrapper.attr('propertytype', propertytype);
                        SubControlWrapper.attr('soid', soid);
                        SubControlWrapper.css('width', width);
                        SubControlWrapper.css('height', height);

                        if ($chk(propertyid) === true)
                        {
                            SubControlWrapper.attr('propertyid', propertyid);
                        }
                        if ($chk(methodid) === true)
                        {
                            SubControlWrapper.attr('methodid', methodid);
                        }
                        SubControlWrapper.addClass(wrapperClass);

                        _dragDrop._CopyChildren(originalSubItem.children(), SubControlWrapperResize);

                        origParent = SourceCode.Forms.TableHelper.getCellFromElement(originalSubItem);
                        originalSubItem.remove();
                        _dragDrop.DesignerTable._configureCell(data.section, origParent.parent(), origParent);

                        properties = _dragDrop.ViewDesigner._getProperties(id);
                        styles = _dragDrop.Styles._getStyles(id, controltype);

                        if (checkExists(properties))
                        {
                            _dragDrop.ViewDesigner._setControlPropertiesXML(id, properties);
                            if (layouttype !== 'layoutcontainer')
                            {
                                _dragDrop.AJAXCall._updateControlProperties(id, controltype, _dragDrop.View.viewDefinitionXML.createElement("Properties"), properties, styles); //edit capturelist
                            }
                        }
                        if (subCell.html() === '&nbsp;')
                        {
                            subCell.empty();
                        }
                        else
                        {
                            if (data.section !== 'toolbarSection')
                            {
                                subCell.empty();
                            }
                        }
                        subCell.append(SubControlWrapper);

                        if (layouttype === 'layoutcontainer')
                        {
                            _dragDrop.ViewDesigner._makeChildElementsDragable(SubControlWrapper);
                        }
                        else
                        {
                            _dragDrop.ViewDesigner._makeElementDragable(SubControlWrapper);

                        }
                    }
                }
            }
        },

        _CopyChildren: function (parent, target)
        {
            if (parent)
            {
                if (parent.length > 0)
                {
                    var children = parent.children();
                    for (var i = 0; i < children.length; i++)
                    {
                        var child = jQuery(children[i]);
                        target.append(child);
                    }
                }
            }
        },

        _ToggleContextWaterMark: function (contextObject)
        {
            var watermark = contextObject.find('>div.watermark-text');
            if (watermark.length > 0)
            {
                if (contextObject.children().length === 1)
                {
                    contextObject.removeClass("watermark-invisible");
                    contextObject.addClass("watermark-visible");
                }
                else
                {
                    contextObject.removeClass("watermark-visible");
                    contextObject.addClass("watermark-invisible");
                }
            }
        },

        // options properties:
        // controlType - The controlType string
        // propertiesXml - the XML to which to append the initialValues properties xml
        // id - The id of the control as guid string.
        // initialControlElem (optional) - The control element with all the default control properties. Will be retrieved if not passed in
        // defaultProperties (optional) - xml node with the default default properties
        _addInitialValuesToPropertiesXml: function (options)
        {
            if (!checkExists(options)
                || !checkExists(options.controlType)
                || typeof options.controlType !== "string"
                || !checkExists(options.propertiesXml))
            {
                throw "Incorrect parameters used when calling _addInitialValuesToPropertiesXml";
            }

            if (!checkExists(options.initialControlElem))
            {
                options.initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + options.controlType + '"]');
            }

            if (checkExists(options.initialControlElem))
            {
                var defaultProperties = null;
                if (checkExists(options.defaultProperties))
                {
                    defaultProperties = options.defaultProperties;
                }
                else
                {
                    defaultProperties = options.initialControlElem.selectSingleNode("DefaultProperties");
                }

                var initialProperties = defaultProperties.selectNodes("Properties/Prop[InitialValue]");

                for (var p = 0; p < initialProperties.length; p++)
                {
                    var initialPropertyName = initialProperties[p].getAttribute("ID");
                    var intialPropertyValue = initialProperties[p].selectSingleNode("InitialValue").text;

                    options.propertiesXml.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(options.id, initialPropertyName, intialPropertyValue, intialPropertyValue));
                }
            }
        },

        _CaptureListDropProperty: function (contextobject, data, isReadOnly, setAsSelectedControl)
        {
            var cellIndex = null;
            if (checkExists(contextobject[0]))
            {
                cellIndex = contextobject[0].cellIndex;
            }
            var ControlType = 'Label'; // Heading
            var ControlType2 = ''; // Display
            var ControlType3 = ''; // Add/Edit
            var propertiesXML;
            var id;
            var columnElement = _dragDrop.View.viewDefinitionXML.selectNodes("//Canvas/Sections/Section[@Type='Body']/Control[@LayoutType='Grid']/Columns/Column")[cellIndex];
            var columnID = checkExists(columnElement) ? columnElement.getAttribute("ID") : null;
            var columnName = "";

            var hasReferences = false;
            if ($chk(data.controltype) === true)
            {
                ControlType2 = data.controltype;
                ControlType3 = data.controltype;
                if ((!(checkExists(data.references))) || (data.references === ''))
                {
                    hasReferences = false;
                }
                else
                {
                    hasReferences = true;
                }
            }
            else
            {
                if ((!(checkExists(data.references))) || (data.references === ''))
                {
                    ControlType2 = _dragDrop._GetDataTypeDefaultControl(data.propertytype, true);
                    ControlType3 = _dragDrop._GetDataTypeDefaultControl(data.propertytype, isReadOnly);
                    hasReferences = false;
                }
                else
                {
                    ControlType2 = _dragDrop._GetDataTypeDefaultControl('association', true);
                    ControlType3 = _dragDrop._GetDataTypeDefaultControl('association', isReadOnly);
                    hasReferences = true;
                }

                if (ControlType2 === "" && data.propertytype === "none")
                {
                    ControlType2 = _dragDrop._GetDataTypeDefaultControl("text", true);
                }
            }

            id = String.generateGuid();
            _dragDrop._newControlIds.push(id);
            var ControlDef = _dragDrop._BuildControlWrapper(id);
            var ControlLabelWrapper = ControlDef.wrapper;
            var ControlLabelWrapperResizer = ControlDef.resizeWrapper;

            if (hasReferences)
            {
                data.friendlyname = _dragDrop._ensureCorrectAssociationPropertyName(data.friendlyname);
            }
            else
            {
                data.friendlyname = data.friendlyname.replace(/([a-z](?=[A-Z])|[A-Z](?=[A-Z][a-z]))/g, '$1 ');
            }

            ControlLabelWrapper.attr('layouttype', 'control');
            ControlLabelWrapper.attr('references', data.references);
            ControlLabelWrapper.attr('propertytype', data.propertytype);
            ControlLabelWrapper.attr('propertyid', data.propertyid);
            ControlLabelWrapper.attr('friendlyname', data.friendlyname);
            ControlLabelWrapper.attr('soid', data.soid);
            ControlLabelWrapper.attr('itemtype', data.itemtype);
            ControlLabelWrapper.attr('controltype', ControlType);
            ControlLabelWrapper.addClass('propertyControl');
            ControlLabelWrapper.addClass('controlWrapperFull');
            ControlLabelWrapper.addClass('controlwrapper');
            ControlLabelWrapper.addClass('draggable');

            var styles = _dragDrop.Styles._getStyles(id, ControlType);

            propertiesXML = _dragDrop.View.viewDefinitionXML.createElement("Properties");
            var controlName = _dragDrop.DesignerTable._BuildControlName(id, data.friendlyname, ControlType);
            propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));
            propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'DataType', "Text", "Text"));
            _dragDrop.ViewDesigner._loadPropertyTypeProperties(propertiesXML, id, ControlType, data.propertytype);

            this._addInitialValuesToPropertiesXml({
                propertiesXml: propertiesXML,
                id: id,
                controlType: ControlType
            });

            if (checkExists(data.propertyid))
            {
                var fieldEl = _dragDrop.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@SourceID='{0}']/Fields/Field[FieldName/text()='{1}']".format(data.soid, data.propertyid));

                if (checkExists(fieldEl))
                {
                    var fieldID = fieldEl.getAttribute("ID");
                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Field', fieldID, data.friendlyname));

                    var fieldDataType = fieldEl.getAttribute("DataType");
                    var dataTypePropertyElement = propertiesXML.selectSingleNode("Property[Name='DataType']");
                    if (checkExists(dataTypePropertyElement))
                    {
                        dataTypePropertyElement.parentNode.removeChild(dataTypePropertyElement);
                    }

                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'DataType', fieldDataType, fieldDataType));
                }
            }

            if ($chk(isReadOnly))
            {
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ReadOnly', isReadOnly, isReadOnly));
            }
            propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Text', data.friendlyname, data.friendlyname));

            var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType, propertiesXML, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlLabelHTML = _dragDrop._GetDesignTimeHTML(ControlType);
                if (ControlLabelHTML === "")
                {
                    //could not find the control html definition for 'Label'
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType + "'");
                    return;
                }
                ControlLabelWrapperResizer.append(jQuery(ControlLabelHTML));
            }
            _dragDrop._EnsureControlOverlay(ControlLabelWrapperResizer);
            contextobject.empty();
            contextobject.append(ControlLabelWrapper);

            ControlLabelWrapper.css('width', 'auto'); // Fix for Mozilla Control wrapper remove width(Control not align center)

            var styleNode = SCStyleHelper.getPrimaryStyleNode(styles);
            if (checkExists(styleNode))
            {
                if (!checkExists(data.references) || data.references === "")
                {
                    switch (data.propertytype)
                    {
                        case "autonumber":
                        case "number":
                        case "decimal":
                            _dragDrop.Styles._setTextAlignment(styleNode, "Left");
                            break;
                    }
                }
                if (_dragDrop.View.selectedOptions.BoldHeadings === true)
                {
                    _dragDrop.Styles._setFontWeight(styleNode, "Bold");
                }
            }
            _dragDrop.ViewDesigner._setControlPropertiesXML(id, propertiesXML, styles);
            _dragDrop.AJAXCall._initControlProperties(id, ControlType, propertiesXML, styles, null, true); //add capturelist ?when called?

            if (checkExists(columnID))
            {
                var columnControlName = _dragDrop.DesignerTable._BuildControlName(columnID, data.friendlyname, "Column");
                _dragDrop.ViewDesigner._setControlPropertyValue(columnID, "ControlName", columnControlName);
            }

            if (styleNode)
            {
                _dragDrop.Styles.populateListHeadingControlStyle(ControlLabelWrapper, styleNode);
            }

            //add display control as dummy data to next cells
            if (ControlType2 === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }

            var nextRow = contextobject.parent().next();
            if (nextRow.length > 0)
            {
                var nextCell = jQuery(nextRow.find('>td')[cellIndex]);
                if (nextCell)
                {
                    subid = String.generateGuid();
                    _dragDrop._newControlIds.push(subid);
                    var ControlDef = _dragDrop._BuildControlWrapper(subid);
                    var ControlWrapper = ControlDef.wrapper;
                    var ControlWrapperResizer = ControlDef.resizeWrapper;

                    ControlWrapper.attr('layouttype', 'control');
                    ControlWrapper.attr('references', data.references);
                    ControlWrapper.attr('propertytype', data.propertytype);
                    ControlWrapper.attr('propertyid', data.propertyid);
                    ControlWrapper.attr('friendlyname', data.friendlyname);
                    ControlWrapper.attr('soid', data.soid);
                    ControlWrapper.attr('itemtype', data.itemtype);
                    ControlWrapper.attr('controltype', ControlType2);
                    ControlWrapper.addClass('controlwrapper');
                    ControlWrapper.addClass('controlWrapperFull');

                    var styles = "";
                    var defaultProperties = null;

                    properties = _dragDrop.ViewDesigner._getProperties(subid);
                    var propertyType = (!checkExists(data.references) || data.references === "") ? data.propertytype : "association";
                    styles = _dragDrop.Styles._getStyles(subid, ControlType2, propertyType);

                    if (!checkExists(properties))
                    {
                        properties = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                        _dragDrop.ViewDesigner._loadPropertyTypeProperties(properties, id, ControlType2, data.propertytype);
                        var controlName = _dragDrop.DesignerTable._BuildControlName(subid, data.friendlyname, ControlType2);
                        properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ControlName', controlName, controlName));

                        if (typeof (ControlType2) === "string")
                        {
                            var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + ControlType2 + '"]');

                            if (checkExists(initialControlElem))
                            {
                                defaultProperties = initialControlElem.selectSingleNode("DefaultProperties");

                                this._addInitialValuesToPropertiesXml({
                                    propertiesXml: properties,
                                    id: id,
                                    controlType: ControlType2,
                                    initialControlElem: initialControlElem,
                                    defaultProperties: defaultProperties
                                });
                            }
                        }

                        if (checkExists(data.propertyid))
                        {
                            var fieldEl = _dragDrop.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@SourceID='" + data.soid + "']/Fields/Field[FieldName/text()='" + data.propertyid + "']");

                            if ($chk(fieldEl))
                            {
                                var fieldID = fieldEl.getAttribute("ID");
                                properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Field', fieldID, data.friendlyname));

                                var fieldDataType = fieldEl.getAttribute("DataType");
                                var dataTypePropertyElement = properties.selectSingleNode("Property[Name='DataType']");
                                if (checkExists(dataTypePropertyElement))
                                {
                                    dataTypePropertyElement.parentNode.removeChild(dataTypePropertyElement);
                                }

                                properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'DataType', fieldDataType, fieldDataType));
                            }
                        }

                        if (hasReferences === true)
                        {
                            var refData = data.references.split('|');
                            var refSOName = refData[1];
                            var refSOGuid = refData[2];
                            var refProp = refData[3];
                            var refMapTo = refData[4];
                            var refMethodDetail = refData[5].split('[');
                            var refMethod = refMethodDetail[0];
                            var refDisplayProperty = _dragDrop._getAssociationDisplayProperty(refSOGuid, refProp);
                            var DisplayPropData = _dragDrop._getAssociationPropertyData(refSOGuid, refDisplayProperty);
                            var refFriendlyName = DisplayPropData.friendlyname;
                            var refSOFriendlyName = DisplayPropData.sofriendlyname;

                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationSO', refSOGuid, refSOFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationMethod', refMethod, refMethod));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ValueProperty', refProp, refProp));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'DisplayTemplate', refDisplayProperty, refFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'OriginalProperty', refMapTo, refMapTo));

                            data.refSOGuid = refSOGuid;
                            data.refMethod = refMethod;
                            data.controlid = subid;
                            data.controltype = ControlType2;
                            data.controlname = controlName;

                            // get a dummy data display value
                            var controlTextValue = _dragDrop.DesignerTable._getDummyData(data.propertytype.toLowerCase(), data.friendlyname);
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'Text', controlTextValue, controlTextValue));
                        }
                        else
                        {
                            var controlTextValue = _dragDrop.DesignerTable._getDummyData(data.propertytype.toLowerCase(), data.friendlyname);

                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'Text', controlTextValue, controlTextValue));
                        }
                    }

                    var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType2, propertiesXML, styles);
                    if (controlRequiresAjaxCall)
                    {
                        var ControlHTML = _dragDrop._GetDesignTimeHTML(ControlType2);
                        if (ControlHTML === "")
                        {
                            //could not find the control html definition for 'Label'
                            popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType2 + "'");
                            return;
                        }

                        ControlWrapperResizer.append(jQuery(ControlHTML));
                    }
                    _dragDrop._EnsureControlOverlay(ControlWrapperResizer);
                    nextCell.empty();
                    nextCell.append(ControlWrapper);

                    var defaultWidth = checkExists(defaultProperties) ? defaultProperties.selectSingleNode("Properties/Prop[@ID='Width']/Value") : null;

                    if (checkExists(defaultWidth))
                    {
                        ControlWrapper.css('width', defaultWidth.text);
                    }
                    else
                    {
                        ControlWrapper.css('width', 'auto');
                    }

                    ControlUtil.setElementFlexBasisAsWidthForIE11(ControlWrapper);

                    if (checkExists(properties))
                    {
                        _dragDrop.ViewDesigner._setControlPropertiesXML(subid, properties, styles);
                        _dragDrop.AJAXCall._initControlProperties(subid, ControlType2, properties, styles, false, true);  //add capturelist ?when called?

                        //Remove text property as it should not be saved, only be used to populate dummy data
                        _dragDrop.ViewDesigner._removeControlPropertyValue(subid, "Text");
                    }
                }
            }

            if (_dragDrop.ViewDesigner._getViewType() === SourceCode.Forms.Designers.ViewType.ListView && _dragDrop.View.selectedOptions.EnableListEditing === true)
            {
                _dragDrop._CaptureListDropEditProperty(ControlType3, cellIndex, data, id, hasReferences);
            }

            // we need to ensure that mappings are restored if any method buttons exist
            _dragDrop._ensureMethodsPropertyActions(ControlWrapper, data, true); // Passing the value true to map objectproperty to viewfield
            //begin add column styles
            if (!checkExists(data.references) || data.references === "")
            {
                switch (data.propertytype)
                {
                    case "autonumber":
                    case "number":
                    case "decimal":
                        var column = contextobject.closest("table").find("col:nth-child({0})".format(cellIndex + 1));
                        var columnId = column.attr("id");
                        var defaultStyle = SCStyleHelper.getPrimaryStyleNode(_dragDrop.Styles._getStylesNode(columnId, "Column"));

                        _dragDrop.Styles._setTextAlignment(defaultStyle, "Right");
                        _dragDrop.Styles.populateColumnControlStyle(cellIndex, defaultStyle);
                        break;
                }
            }
            //end add column styles

            // render dummy data
            //_dragDrop._renderDummyData(ControlWrapper);

            _dragDrop.View._isViewChanged = true;

            SourceCode.Forms.Designers.Common.refreshBadgeForControls([id]);

            if (checkExists(SourceCode.Forms.Designers.View.selectedObject))
            {
                //After the column is bound to a new field we need to refresh the badging for column overlay
                _dragDrop.DesignerTable._setupColumnOverlay(SourceCode.Forms.Designers.View.selectedObject);
            }
        },

        _CaptureListDropEditProperty: function (controlType, cellIndex, data, id, hasReferences)
        {
            //add control to bottom row
            if (controlType === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }

            var nextRow = _dragDrop.View.element.find("#editableSection .editor-row");
            if (nextRow.length > 0)
            {
                var nextCell = jQuery(nextRow.find('>td'))[cellIndex];
                if (nextCell)
                {
                    subid = String.generateGuid();
                    _dragDrop._newControlIds.push(subid);
                    var ControlDef = _dragDrop._BuildControlWrapper(subid);
                    var ControlWrapper = ControlDef.wrapper;
                    var ControlWrapperResizer = ControlDef.resizeWrapper;

                    ControlWrapper.attr('layouttype', 'control');
                    ControlWrapper.attr('references', data.references);
                    ControlWrapper.attr('propertytype', data.propertytype);
                    ControlWrapper.attr('propertyid', data.propertyid);
                    ControlWrapper.attr('friendlyname', data.friendlyname);
                    ControlWrapper.attr('soid', data.soid);
                    ControlWrapper.attr('itemtype', data.itemtype);
                    ControlWrapper.attr('controltype', controlType);
                    ControlWrapper.addClass('controlwrapper');
                    ControlWrapper.addClass('controlWrapperFull');

                    var defaultProperties = null;
                    var properties = _dragDrop.ViewDesigner._getProperties(subid);
                    var propertyType = (!checkExists(data.references) || data.references === "") ? data.propertytype : "association";
                    styles = _dragDrop.Styles._getStyles(subid, controlType, propertyType);

                    if (!checkExists(properties))
                    {
                        properties = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                        _dragDrop.ViewDesigner._loadPropertyTypeProperties(properties, id, controlType, data.propertytype);
                        var controlName = _dragDrop.DesignerTable._BuildControlName(subid, data.friendlyname, controlType);
                        properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ControlName', controlName, controlName));

                        if (typeof (controlType) === "string")
                        {
                            var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlType + '"]');
                        }

                        if (checkExists(initialControlElem))
                        {
                            defaultProperties = initialControlElem.selectSingleNode("DefaultProperties");

                            this._addInitialValuesToPropertiesXml({
                                propertiesXml: properties,
                                id: id,
                                controlType: controlType,
                                initialControlElem: initialControlElem,
                                defaultProperties: defaultProperties
                            });
                        }

                        if ($chk(data.propertyid))
                        {
                            var fieldEl = _dragDrop.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@SourceID='" + data.soid + "']/Fields/Field[FieldName/text()='" + data.propertyid + "']");

                            if ($chk(fieldEl))
                            {
                                var fieldID = fieldEl.getAttribute("ID");
                                properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Field', fieldID, data.friendlyname));
                            }

                            var fieldDataType = fieldEl.getAttribute("DataType");
                            var dataTypePropertyElement = properties.selectSingleNode("Property[Name='DataType']");
                            if (checkExists(dataTypePropertyElement))
                            {
                                dataTypePropertyElement.parentNode.removeChild(dataTypePropertyElement);
                            }

                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'DataType', fieldDataType, fieldDataType));
                        }

                        if (hasReferences === true)
                        {
                            var refData = data.references.split('|');
                            var refSOName = refData[1];
                            var refSOGuid = refData[2];
                            var refProp = refData[3];
                            var refMapTo = refData[4];
                            var refMethodDetail = refData[5].split('[');
                            var refMethod = refMethodDetail[0];
                            var refDisplayProperty = _dragDrop._getAssociationDisplayProperty(refSOGuid, refProp);
                            var DisplayPropData = _dragDrop._getAssociationPropertyData(refSOGuid, refDisplayProperty);
                            var refFriendlyName = DisplayPropData.friendlyname;
                            var refSOFriendlyName = DisplayPropData.sofriendlyname;

                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationSO', refSOGuid, refSOFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationMethod', refMethod, refMethod));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ValueProperty', refProp, refProp));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'DisplayTemplate', refDisplayProperty, refFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'OriginalProperty', refMapTo, refMapTo));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'DataSourceType', "SmartObject", "SmartObject"));

                            data.refSOGuid = refSOGuid;
                            data.refMethod = refMethod;
                            data.controlid = subid;
                            data.controltype = controlType;
                            data.controlname = controlName;
                            _dragDrop.ViewDesigner._BuildDefaultLoadBehaviour(data);
                        }
                    }

                    var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(controlType, properties, styles);
                    if (controlRequiresAjaxCall)
                    {
                        var ControlHTML = _dragDrop._GetDesignTimeHTML(controlType);
                        if (ControlHTML === "")
                        {
                            //could not find the control html definition for 'Label'
                            popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType2 + "'");
                            return;
                        }

                        ControlWrapperResizer.append(jQuery(ControlHTML));
                    }
                    _dragDrop._EnsureControlOverlay(ControlWrapperResizer);


                    nextCell = jQuery(nextCell);
                    nextCell.empty();
                    nextCell.append(ControlWrapper);

                    var defaultWidth = checkExists(defaultProperties) ? defaultProperties.selectSingleNode("Properties/Prop[@ID='Width']/Value") : null;

                    if (checkExists(defaultWidth))
                    {
                        ControlWrapper.css('width', defaultWidth.text);
                    }
                    else
                    {
                        ControlWrapper.css('width', 'auto');
                    }

                    ControlUtil.setElementFlexBasisAsWidthForIE11(ControlWrapper);

                    if (checkExists(properties))
                    {
                        _dragDrop.ViewDesigner._setControlPropertiesXML(subid, properties, styles);

                        _dragDrop.AJAXCall._initControlProperties(subid, controlType, properties, styles, false);  //add capturelist ?when called?
                    }
                }
            }
        },

        _CaptureListViewDrop: function (contextobject, data, isReadOnly, setAsSelectedControl)
        {
            if (!contextobject.closest("tr").hasClass("footer") && !contextobject.closest("tr").hasClass("header") && data.section !== 'toolbarSection')
            {
                var calculatedColumnIndex = contextobject[0].cellIndex + 1;
                var jq_closestTable = contextobject.closest('table');
                contextobject = jq_closestTable.find('>tbody>tr:nth-child(1)>td:nth-child(' + calculatedColumnIndex + ')');
            }

            if (data.itemtype === 'property' && !contextobject.closest("tr").hasClass("footer") && data.section !== 'toolbarSection')
            {
                _dragDrop._CaptureListDropProperty(contextobject, data, isReadOnly, setAsSelectedControl);
            }
            else if (data.itemtype === 'control')
            {
                if (data.section === 'toolbarSection')
                {
                    _dragDrop._CaptureViewDropControl(contextobject, data, setAsSelectedControl);
                }
                else
                {
                    if (contextobject.closest("tr").hasClass("footer"))
                    {
                        _dragDrop._CaptureListDropFooterControl(contextobject, data, setAsSelectedControl);
                    }
                    else
                    {
                        _dragDrop._CaptureListDropControl(contextobject, data, setAsSelectedControl);
                    }
                }
            }
            else if (data.itemtype === 'method')
            {
                //if dropping on a method only drop on toolbar
                if (data.section === 'toolbarSection')
                {
                    _dragDrop._CaptureViewDropMethod(contextobject, data, setAsSelectedControl);
                }
            }
            else if (data.itemtype === 'layoutcontainer')
            {
                if (data.section === 'toolbarSection')
                {
                    if (data.friendlyname.toLowerCase() === "table")
                        if (_dragDrop.CheckOut._checkViewStatus())
                        {
                            SourceCode.Forms.Controls.Web.TableBehavior.prototype._tablePopup(contextobject, data, SourceCode.Forms.Designers.View);
                        }
                        else
                            _dragDrop._CaptureViewDropControl(contextobject, data, setAsSelectedControl);
                }
                else
                {
                    if (data.section === "bodySection" && data.friendlyname.toLowerCase() === "table")
                        popupManager.showError('Table controls are not supported in this area.');
                }
            }
        },

        _setLayoutType: function (itemtype, controlWrapper, controlType)
        {
            switch (itemtype)
            {
                case '0':
                case '1':
                case '2':
                case '3':
                case 'method':
                case 'property':
                case 'control':
                case 'toolbarcontrol':
                    controlWrapper.attr('layouttype', 'control');
                    break;
                default:
                    controlWrapper.attr('layout', controlType);
                    controlWrapper.attr('layouttype', 'layoutcontainer');
                    break;
            }
        },

        _CaptureListDropFooterControl: function (contextobject, data, setAsSelectedControl)
        {
            var ControlType = '';
            var wrapperClass = 'controlwrapper';

            ControlType = data.name;

            if (ControlType === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }
            var id = String.generateGuid();
            _dragDrop._newControlIds.push(id);
            var ControlDef = _dragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResizer = ControlDef.resizeWrapper;

            ControlWrapper.attr('friendlyname', data.friendlyname);
            ControlWrapper.attr('name', data.name);
            ControlWrapper.attr('itemtype', data.itemtype);
            ControlWrapper.attr('controltype', ControlType);
            ControlWrapper.addClass(wrapperClass);
            ControlWrapper.addClass('draggable');

            var defaultProperties = null;
            var properties = _dragDrop.ViewDesigner._getProperties(id);
            var styles = _dragDrop.Styles._getStyles(id, ControlType);

            if (!checkExists(properties))
            {
                properties = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                _dragDrop.ViewDesigner._loadPropertyTypeProperties(properties, id, ControlType, data.propertytype);
                var controlName = _dragDrop.DesignerTable._BuildControlName(id, '', ControlType);
                properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));

                if (typeof (ControlType) === "string")
                {
                    var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + ControlType + '"]');

                    if (checkExists(initialControlElem))
                    {
                        defaultProperties = initialControlElem.selectSingleNode("DefaultProperties");
                        this._addInitialValuesToPropertiesXml({
                            propertiesXml: properties,
                            id: id,
                            controlType: ControlType,
                            initialControlElem: initialControlElem,
                            defaultProperties: defaultProperties
                        });
                    }
                }
            }

            var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType, properties, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlHTML = _dragDrop._GetDesignTimeHTML(ControlType);
                if (ControlHTML === "")
                {
                    //could not find the control html definition for 'Label'
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType + "'");
                    return;
                }

                ControlWrapperResizer.append(jQuery(ControlHTML));
            }
            _dragDrop._EnsureControlOverlay(ControlWrapperResizer);


            if (contextobject.html() === '&nbsp;')
            {
                contextobject.empty();
            }

            contextobject.find('div.watermark-text').remove();
            contextobject.append(ControlWrapper);

            _dragDrop._ToggleContextWaterMark(contextobject);

            var defaultWidth = checkExists(defaultProperties) ? defaultProperties.selectSingleNode("Properties/Prop[@ID='Width']/Value") : null;

            if (checkExists(defaultWidth))
            {
                ControlWrapper.css('width', defaultWidth.text);
            }
            else
            {
                ControlWrapper.css('width', 'auto');
            }

            ControlUtil.setElementFlexBasisAsWidthForIE11(ControlWrapper);

            _dragDrop.ViewDesigner._setControlPropertiesXML(id, properties, styles);
            this._setLayoutType(data.itemtype, ControlWrapper, ControlType);
            _dragDrop.AJAXCall._initControlProperties(id, ControlType, properties, styles, setAsSelectedControl); //add called when dropping an unbound control on capture view	
            
            if (ControlWrapper.attr('layouttype') == 'layoutcontainer')
            {
                var newID = String.generateGuid();
                _dragDrop._newControlIds.push(newID);
                ControlWrapper.find("table").eq(0).attr("id", newID);
                _dragDrop.DesignerTable._addColumnGroupColumns(newID);
            }
            var contextObjectNextRow = contextobject.closest("tr").next("tr.footer:not(.placeholder-footer)");

            if (contextObjectNextRow.length === 0)
            {
                // add new row to footer
                _dragDrop.DesignerTable._addFooterRow();
            }

            _dragDrop.View.isViewChanged = true;

            return ControlWrapper;
        },

        _CaptureListDropControl: function (contextobject, data, setAsSelectedControl)
        {
            var nextRow = contextobject.parent().next();

            var cellIndex = contextobject[0].cellIndex;

            var ControlType = "Label";
            var ControlType2 = '';
            var ControlType3 = '';
            var propertiesXML;
            var id;

            var hasReferences = false;
            if ($chk(data.name) === true)
            {
                ControlType2 = data.name;
                ControlType3 = data.name;
                if (data.references === '' || $chk(data.references) === false)
                {
                    hasReferences = false;
                }
                else
                {
                    hasReferences = true;
                }
            }
            else
            {
                ControlType = '';
                ControlType2 = '';
                ControlType3 = '';
            }

            id = String.generateGuid();
            _dragDrop._newControlIds.push(id);
            var ControlDef = _dragDrop._BuildControlWrapper(id);
            var ControlLabelWrapper = ControlDef.wrapper;
            var ControlLabelWrapperResizer = ControlDef.resizeWrapper;

            ControlLabelWrapper.attr('layouttype', 'control');
            ControlLabelWrapper.attr('references', data.references);
            ControlLabelWrapper.attr('propertytype', data.propertytype);
            ControlLabelWrapper.attr('propertyid', data.propertyid);
            ControlLabelWrapper.attr('friendlyname', data.friendlyname);
            ControlLabelWrapper.attr('soid', data.soid);
            ControlLabelWrapper.attr('itemtype', data.itemtype);
            ControlLabelWrapper.attr('controltype', ControlType);
            ControlLabelWrapper.addClass('propertyControl');
            ControlLabelWrapper.addClass('controlwrapper');
            ControlLabelWrapper.addClass('controlWrapperFull');
            ControlLabelWrapper.addClass('draggable');

            var styles = _dragDrop.Styles._getStyles(id, ControlType);

            propertiesXML = _dragDrop.View.viewDefinitionXML.createElement("Properties");
            _dragDrop.ViewDesigner._loadPropertyTypeProperties(propertiesXML, id, ControlType, data.propertytype);
            //TODO: TD 0019
            var controlName = _dragDrop.DesignerTable._BuildControlName(id, data.name, ControlType);
            propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));
            propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Text', data.friendlyname, data.friendlyname));

            this._addInitialValuesToPropertiesXml({
                propertiesXml: propertiesXML,
                id: id,
                controlType: ControlType
            });

            var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType, propertiesXML, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlLabelHTML = _dragDrop._GetDesignTimeHTML(ControlType);
                if (ControlLabelHTML === "")
                {
                    //could not find the control html definition for 'Label'
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType + "'");
                    return;
                }

                ControlLabelWrapperResizer.append(jQuery(ControlLabelHTML));
            }


            _dragDrop._EnsureControlOverlay(ControlLabelWrapperResizer);
            contextobject.empty();
            contextobject.append(ControlLabelWrapper);

            ControlLabelWrapper.css('width', 'auto'); // Fix for Mozilla Control wrapper remove width(Control not align center)

            var styleNode = SCStyleHelper.getPrimaryStyleNode(styles);
            if (checkExists(styleNode))
            {
                if (_dragDrop.View.selectedOptions.BoldHeadings === true)
                {
                    _dragDrop.Styles._setFontWeight(styleNode, "Bold");
                }
                if (styleNode)
                {
                    _dragDrop.Styles.populateListHeadingControlStyle(ControlLabelWrapper, styleNode);
                }
            }
            _dragDrop.ViewDesigner._setControlPropertiesXML(id, propertiesXML, styles);

            _dragDrop.AJAXCall._initControlProperties(id, ControlType, propertiesXML, styles); //add capturelist ?when called?

            //add control to bottom row
            if (ControlType2 === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }
            var nextRow = contextobject.parent().next();
            if (nextRow.length > 0)
            {
                var nextCell = jQuery(nextRow.find('>td')[cellIndex]);
                if (nextCell)
                {
                    subid = String.generateGuid();
                    _dragDrop._newControlIds.push(subid);
                    var ControlDef = _dragDrop._BuildControlWrapper(subid);
                    var ControlWrapper = ControlDef.wrapper;
                    var ControlWrapperResizer = ControlDef.resizeWrapper;

                    ControlWrapper.attr('layouttype', 'control');
                    ControlWrapper.attr('references', data.references);
                    ControlWrapper.attr('propertytype', data.propertytype);
                    ControlWrapper.attr('propertyid', data.propertyid);
                    ControlWrapper.attr('friendlyname', data.friendlyname);
                    ControlWrapper.attr('soid', data.soid);
                    ControlWrapper.attr('itemtype', data.itemtype);
                    ControlWrapper.attr('controltype', ControlType2);
                    ControlWrapper.addClass('controlwrapper');
                    ControlWrapper.addClass('controlWrapperFull');

                    var defaultProperties = null;
                    properties = _dragDrop.ViewDesigner._getProperties(subid);
                    styles = _dragDrop.Styles._getStyles(subid, ControlType2);

                    if (!checkExists(properties))
                    {
                        properties = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                        _dragDrop.ViewDesigner._loadPropertyTypeProperties(properties, subid, ControlType2, data.propertytype);
                        //TODO: TD 0019
                        var controlName = _dragDrop.DesignerTable._BuildControlName(subid, data.name, ControlType2);
                        properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ControlName', controlName, controlName));

                        if (typeof (ControlType2) === "string")
                        {
                            var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + ControlType2 + '"]');

                            if (checkExists(initialControlElem))
                            {
                                defaultProperties = initialControlElem.selectSingleNode("DefaultProperties");

                                this._addInitialValuesToPropertiesXml({
                                    propertiesXml: properties,
                                    id: subid,
                                    controlType: ControlType2,
                                    initialControlElem: initialControlElem,
                                    defaultProperties: defaultProperties
                                });
                            }
                        }

                        if (hasReferences === true)
                        {
                            var refData = data.references.split('|');
                            var refSOGuid = refData[2];
                            var refProp = refData[3];
                            var refMapTo = refData[4];
                            var refMethodDetail = refData[5].split('[');
                            var refMethod = refMethodDetail[0];
                            var refDisplayProperty = _dragDrop._getAssociationDisplayProperty(refSOGuid, refProp);
                            var DisplayPropData = _dragDrop._getAssociationPropertyData(refSOGuid, refDisplayProperty);
                            var refFriendlyName = DisplayPropData.friendlyname;
                            var refSOFriendlyName = DisplayPropData.sofriendlyname;

                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationSO', refSOGuid, refSOFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationMethod', refMethod, refMethod));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ValueProperty', refProp, refProp));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'DisplayTemplate', refDisplayProperty, refFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'OriginalProperty', refMapTo, refMapTo));
                        }
                    }

                    var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType2, properties, styles);
                    if (controlRequiresAjaxCall)
                    {
                        var ControlHTML = _dragDrop._GetDesignTimeHTML(ControlType2);
                        if (ControlHTML === "")
                        {
                            //could not find the control html definition for 'Label'
                            popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType2 + "'");
                            return;
                        }

                        ControlWrapperResizer.append(jQuery(ControlHTML));
                    }
                    _dragDrop._EnsureControlOverlay(ControlWrapperResizer);


                    nextCell.empty();
                    nextCell.append(ControlWrapper);

                    var defaultWidth = checkExists(defaultProperties) ? defaultProperties.selectSingleNode("Properties/Prop[@ID='Width']/Value") : null;

                    if ($chk(defaultWidth))
                    {
                        ControlWrapper.css('width', defaultWidth.text);
                    }
                    else
                    {
                        ControlWrapper.css('width', 'auto');
                    }

                    ControlUtil.setElementFlexBasisAsWidthForIE11(ControlWrapper);

                    if (checkExists(properties))
                    {
                        _dragDrop.ViewDesigner._setControlPropertiesXML(subid, properties, styles);
                        _dragDrop.AJAXCall._initControlProperties(subid, ControlType2, properties, styles, false);  //add capturelist ?when called?

                        // Remove Text Property
                        _dragDrop.ViewDesigner._removeControlPropertyValue(subid, "Text");
                    }
                }
            }

            // render dummy data
            //_dragDrop._renderDummyData(ControlWrapper);

            //add control to bottom row
            if (ControlType3 === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }

            if (!_dragDrop.View.element.find('#vdchkEnableListEditing').parent().hasClass('checked') && !SourceCode.Forms.Designers.View.selectedOptions.EnableListEditing)
            {
                _dragDrop.View.element.find('#editableSection .editor-row').remove();
            }

            var nextRow = _dragDrop.View.element.find("#editableSection .editor-row");
            if (nextRow.length > 0)
            {
                var nextCell = jQuery(nextRow.find('>td')[cellIndex]);
                if (nextCell)
                {
                    subid = String.generateGuid();
                    _dragDrop._newControlIds.push(subid);
                    var ControlDef = _dragDrop._BuildControlWrapper(subid);
                    var ControlWrapper = ControlDef.wrapper;
                    var ControlWrapperResizer = ControlDef.resizeWrapper;

                    ControlWrapper.attr('layouttype', 'control');
                    ControlWrapper.attr('references', data.references);
                    ControlWrapper.attr('propertytype', data.propertytype);
                    ControlWrapper.attr('propertyid', data.propertyid);
                    ControlWrapper.attr('friendlyname', data.friendlyname);
                    ControlWrapper.attr('soid', data.soid);
                    ControlWrapper.attr('itemtype', data.itemtype);
                    ControlWrapper.attr('controltype', ControlType3);
                    ControlWrapper.addClass('controlwrapper');
                    ControlWrapper.addClass('controlWrapperFull');

                    var defaultPropertiesFooterControl = null;
                    properties = _dragDrop.ViewDesigner._getProperties(subid);
                    styles = _dragDrop.Styles._getStyles(subid, ControlType3);

                    if (!checkExists(properties))
                    {
                        properties = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                        _dragDrop.ViewDesigner._loadPropertyTypeProperties(properties, subid, ControlType3, data.propertytype);
                        //TODO: TD 0019
                        var controlName = _dragDrop.DesignerTable._BuildControlName(subid, data.name, ControlType3);
                        properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ControlName', controlName, controlName));

                        if (typeof (ControlType3) === "string")
                        {
                            var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + ControlType3 + '"]');

                            if (checkExists(initialControlElem))
                            {
                                defaultPropertiesFooterControl = initialControlElem.selectSingleNode("DefaultProperties");
                                this._addInitialValuesToPropertiesXml({
                                    propertiesXml: properties,
                                    id: subid,
                                    controlType: ControlType3,
                                    initialControlElem: initialControlElem,
                                    defaultProperties: defaultPropertiesFooterControl
                                });
                            }
                        }

                        if (hasReferences === true)
                        {
                            var refData = data.references.split('|');
                            var refSOGuid = refData[2];
                            var refProp = refData[3];
                            var refMapTo = refData[4];
                            var refMethodDetail = refData[5].split('[');
                            var refMethod = refMethodDetail[0];
                            var refDisplayProperty = _dragDrop._getAssociationDisplayProperty(refSOGuid, refProp);
                            var DisplayPropData = _dragDrop._getAssociationPropertyData(refSOGuid, refDisplayProperty);
                            var refFriendlyName = DisplayPropData.friendlyname;
                            var refSOFriendlyName = DisplayPropData.sofriendlyname;

                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationSO', refSOGuid, refSOFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'AssociationMethod', refMethod, refMethod));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'ValueProperty', refProp, refProp));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'DisplayTemplate', refDisplayProperty, refFriendlyName));
                            properties.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(subid, 'OriginalProperty', refMapTo, refMapTo));
                        }
                    }

                    var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType3, properties, styles);
                    if (controlRequiresAjaxCall)
                    {
                        var ControlHTML = _dragDrop._GetDesignTimeHTML(ControlType3);
                        if (ControlHTML === "")
                        {
                            //could not find the control html definition for 'Label'
                            popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType3 + "'");
                            return;
                        }

                        ControlWrapperResizer.append(jQuery(ControlHTML));
                    }
                    _dragDrop._EnsureControlOverlay(ControlWrapperResizer);

                    nextCell.empty();
                    nextCell.append(ControlWrapper);

                    var defaultWidth = checkExists(defaultPropertiesFooterControl) ? defaultPropertiesFooterControl.selectSingleNode("Properties/Prop[@ID='Width']/Value") : null;

                    if (checkExists(defaultWidth))
                    {
                        ControlWrapper.css('width', defaultWidth.text);
                    } else
                    {
                        ControlWrapper.css('width', 'auto');
                    }

                    ControlUtil.setElementFlexBasisAsWidthForIE11(ControlWrapper);

                    if (checkExists(properties))
                    {
                        _dragDrop.ViewDesigner._setControlPropertiesXML(subid, properties, styles);
                        _dragDrop.AJAXCall._initControlProperties(subid, ControlType3, properties, styles, false);  //add capturelist ?when called?
                    }
                }
            }
            /////////////////////

            //SetRowCellLayout(contextobject.parent());
            _dragDrop.View.isViewChanged = true;
            //if (window.ie) document.recalc(true);

        },

        _renderDummyData: function (originalControl)
        {
            var table = _dragDrop.View.element.find("#bodySection table.editor-table:first-child");
            var bodyRow = table.find(">tbody>tr.editor-row.list-view-item:not(.header,.dummy-row)");
            var dummyRows = table.find(">tbody>tr.editor-row.list-view-item.dummy-row");

            // TFS Bug 182062 : A collection containing a COL element is passed, instead of a .controlwrapper element
            if (originalControl.is("col"))
            {
                originalControl = bodyRow.children().eq(originalControl.parent().children().index(originalControl[0])).find(".controlwrapper");
            }

            // we have an empty column, no data to render
            if (originalControl.length === 0)
            {
                return;
            }

            var cellIndex = originalControl.closest("td.editor-cell")[0].cellIndex;

            for (var d = 0; d < dummyRows.length; d++)
            {
                var dummyRow = jQuery(dummyRows[d]);
                var targetCell = dummyRow.find(">td.editor-cell:nth-child(" + (cellIndex + 1) + ")");
                var clonedControl = originalControl.clone();

                targetCell.empty();

                clonedControl.attr("ID", "bloomer" + d);
                targetCell.append(clonedControl);
            }

            var headerColumn = _dragDrop.View.element.find("#bodySection").find(".editor-table").find("tbody>tr.header>td.header").eq(cellIndex);
            if (headerColumn.length > 0)
            {
                var listHeading = jQuery(headerColumn).find("[controltype='ListHeading']");
                if (listHeading.length > 0)
                {
                    var defaultStyle = SCStyleHelper.getPrimaryStyleNode(_dragDrop.Styles._getStylesNode(listHeading[0].id, "ListHeading"));

                    if (listHeading.length > 0 && checkExists(defaultStyle))
                    {
                        _dragDrop.Styles.populateListHeadingControlStyle(listHeading, defaultStyle);
                    }
                }
            }
            _dragDrop.View._updateOverlayComponents();
            _dragDrop._selectOnDrop(headerColumn);
        },

        _addAggregation: function (aggregationName)
        {
            contextobject = _dragDrop.View.selectedObject;

            if (contextobject.closest("tr").hasClass("header"))
            {
                var xmlDoc = _dragDrop.View.viewDefinitionXML;

                var labelText;
                var dataLabelText;
                var expressionData = [];
                var targetCellIndex = contextobject[0].cellIndex + 1;
                var footerRows = _dragDrop.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                var targetRow = jQuery(footerRows[footerRows.length - 1]);  //_dragDrop.View.element.find("#bodySection table.editor-table tr.footer:last-child");
                targetRow.show();
                var dataLabelTargetCell = targetRow.find(">td:nth-child(" + targetCellIndex + ")");
                var labelTargetCell = targetRow.find(">td:nth-child(1)");

                //Begin apply styles
                var columns = _dragDrop.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Controls/Control[@Type='Column']");
                var indexesToStyle = [0, targetCellIndex - 1];
                for (var i = 0; i < indexesToStyle.length; i++)
                {
                    var column = columns[indexesToStyle[i]];
                    if (checkExists(column))
                    {
                        var columnId = column.getAttribute("ID");
                        var type = column.getAttribute("Type");
                        var defaultStyle = SCStyleHelper.getPrimaryStyleNode(_dragDrop.Styles._getStylesNode(columnId, type, column));
                        if (defaultStyle)
                        {
                            _dragDrop.Styles.populateColumnControlStyle(indexesToStyle[i], defaultStyle, ".footer:last-child");
                        }
                    }
                }
                //End apply styles

                // Drop label
                var labelData = [];
                labelData['friendlyname'] = 'Label';
                labelData['itemtype'] = 'control';
                labelData['name'] = 'Label';
                labelData['section'] = 'bodySection';

                // Drop label that shows text of aggreation type ie. Sum,Average, Count etc.
                var labelControl = _dragDrop._CaptureListDropFooterControl(labelTargetCell, labelData, false);
                var labelControlID = labelControl.attr('id');
                labelControl.css('width', 'auto');

                // Drop data label that will have expression on
                var dataLabel = [];
                dataLabel['friendlyname'] = 'Data Label';
                dataLabel['itemtype'] = 'control';
                dataLabel['name'] = 'DataLabel';
                dataLabel['section'] = 'bodySection';

                var aggregationControl = _dragDrop._CaptureListDropFooterControl(dataLabelTargetCell, dataLabel, false);
                var aggregationControlID = aggregationControl.attr('id');
                aggregationControl.css('width', 'auto');

                var selectedObjectControl = _dragDrop.View.selectedObject.find("div.controlwrapper:first-child");

                if (_dragDrop.View.selectedObject.hasClass("header") && _dragDrop.View.SelectedViewType === 'CaptureList')
                    selectedObjectControl = _dragDrop.View.getSelectedBodyControl();

                var sourceId = _dragDrop.ViewDesigner._getControlProperty(selectedObjectControl.attr('id'), 'Field');
                var sourceType = 'ViewField';
                if (sourceId === "")
                {
                    sourceType = "Control";
                    sourceId = selectedObjectControl.attr('id');
                }

                expressionData["sourceID"] = sourceId;
                expressionData["sourceType"] = sourceType;
                expressionData["dataType"] = "Text";
                expressionData["type"] = selectedObjectControl.attr("propertytype");
                expressionData["displayName"] = Resources.ViewDesigner.AggregationDisplay.format(aggregationName, selectedObjectControl.attr('friendlyname'));
                expressionData["itemDisplayName"] = selectedObjectControl.attr('friendlyname');

                switch (aggregationName)
                {
                    case "Count":
                        labelText = Resources.ViewDesigner.AggregationCount;
                        dataLabelText = Resources.ViewDesigner.AggregationInteger;
                        expressionData["expressionType"] = "ListCount";
                        expressionData["expressionName"] = _dragDrop._getUniqueExpressionName("Count");
                        break;
                    case "Sum":
                        labelText = Resources.ViewDesigner.AggregationSum;
                        dataLabelText = Resources.ViewDesigner.AggregationInteger;
                        expressionData["expressionType"] = "ListSum";
                        expressionData["expressionName"] = _dragDrop._getUniqueExpressionName("Sum");
                        break;
                    case "Average":
                        labelText = Resources.ViewDesigner.AggregationAverage;
                        dataLabelText = Resources.ViewDesigner.AggregationInteger;
                        expressionData["expressionType"] = "ListAverage";
                        expressionData["expressionName"] = _dragDrop._getUniqueExpressionName("Average");
                        break;
                    case "Minimum":
                        labelText = Resources.ViewDesigner.AggregationMinimum;
                        dataLabelText = Resources.ViewDesigner.AggregationInteger;
                        expressionData["expressionType"] = "ListMinimum";
                        expressionData["expressionName"] = _dragDrop._getUniqueExpressionName("Minimum");
                        break;
                    case "Maximum":
                        labelText = Resources.ViewDesigner.AggregationMaximum;
                        dataLabelText = Resources.ViewDesigner.AggregationInteger;
                        expressionData["expressionType"] = "ListMaximum";
                        expressionData["expressionName"] = _dragDrop._getUniqueExpressionName("Maximum");
                        break;
                }

                var newLabelName = _dragDrop.DesignerTable._BuildControlName(labelControlID, '', aggregationName + " Label");

                _dragDrop.ViewDesigner._setControlPropertyValue(labelControlID, "Text", labelText);
                _dragDrop.ViewDesigner._setControlPropertyValue(labelControlID, "ControlName", newLabelName);

                var labelControlProperties = _dragDrop.View.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']/Properties".format(labelControlID));
                _dragDrop.AJAXCall._initControlProperties(labelControlID, "Label", labelControlProperties, null, false);

                var expressionID = _dragDrop.ViewDesigner._addAggregationExpression(expressionData);

                var newDataLabelName = _dragDrop.DesignerTable._BuildControlName(aggregationControlID, '', aggregationName + " Data Label");

                _dragDrop.ViewDesigner._setControlPropertyValue(aggregationControlID, "Text", dataLabelText);
                _dragDrop.ViewDesigner._setControlPropertyValue(aggregationControlID, "ControlName", newDataLabelName);
                propertyElem = _dragDrop.ViewDesigner._BuildPropertyElem(aggregationControlID, "ControlExpression", expressionID, aggregationName);

                var controlNode = _dragDrop.View.viewDefinitionXML.selectSingleNode("//Views/View/Controls/Control[@ID='{0}']".format(aggregationControlID));
                var aggregationControlPropertiesXML = controlNode.selectSingleNode("Properties");
                aggregationControlPropertiesXML.appendChild(propertyElem);

                controlNode.setAttribute("ExpressionID", expressionID);

                _dragDrop.ViewDesigner._setControlPropertiesXML(aggregationControlID, aggregationControlPropertiesXML);

                _dragDrop.AJAXCall._initControlProperties(aggregationControlID, "DataLabel", aggregationControlPropertiesXML, null, false);

                var labelStyle = SCStyleHelper.getPrimaryStyleNode(_dragDrop.Styles._getStylesNode(labelControl.attr("id"), labelControl.attr("controltype")));
                var aggregationStyle = SCStyleHelper.getPrimaryStyleNode(_dragDrop.Styles._getStylesNode(aggregationControl.attr("id"), aggregationControl.attr("controltype")));

                _dragDrop.Styles._setFontWeight(labelStyle, "Bold");
                _dragDrop.DesignerTable._setAlignment('Left', labelTargetCell);

                _dragDrop.Styles._setFontWeight(aggregationStyle, "Bold");
                _dragDrop.DesignerTable._setAlignment('Right', dataLabelTargetCell);

                _dragDrop.Styles._applyControlStyles(labelTargetCell, labelStyle);
                _dragDrop.Styles._applyControlStyles(dataLabelTargetCell, aggregationStyle);
            }
            else
            {
                //show message that user action is not valid in context
            }
        },

        _checkNameExists: function (name, haystack)
        {
            for (var i = 0, l = haystack.length; i < l; i++)
            {
                if ((typeof haystack[i] === "string" && haystack[i].toUpperCase() === name.toUpperCase())
                    || (checkExists(haystack[i].display) && haystack[i].display.toUpperCase() === name.toUpperCase())) return true;
            }

            return false;
        },

        //_getName
        _getUniqueExpressionName: function (name)
        {
            var expressions = _dragDrop.View.viewDefinitionXML.selectNodes("//Views/View/Expressions/Expression/Name");

            if (expressions.length === 0)
                return name;

            var names = [];
            for (var i = 0; i < expressions.length; i++)
            {
                names.push(expressions[i].text);
            }

            while (this._checkNameExists(name, names))
            {
                if (name.search(/[\d]+$/) !== -1)
                {
                    var cnt = name.match(/[\d]+$/)[0];
                    cnt = parseInt(cnt.match(/\d+/)[0]) + 1;
                    name = name.replace(/[\d]+$/, cnt);
                }
                else
                {
                    name += "1";
                }
            }

            return name;
        },

        _getSubCell: function (originalCell)
        {
            if (originalCell)
            {
                var cellIndex = originalCell[0].cellIndex;
                var row = originalCell.parent();
                var nextRow = row.next();

                if (nextRow.length > 0 && checkExists(cellIndex))
                {
                    var retVal = jQuery(nextRow.find('>td')[cellIndex]);
                    return retVal;
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        },

        _CaptureViewDropProperty: function (contextobject, data, isReadOnly, setAsSelectedControl)
        {
            var row = contextobject.parent();
            var controlToRender = 3; //default to render both label and input control
            //SetRowCellLayout(row);

            if ($chk(data.controltorender))
            {
                controlToRender = data.controltorender;
            }

            if (contextobject.html() === '&nbsp;')
            {
                contextobject.html('');
            }

            //create label control//
            var labelControlID = undefined;
            if (controlToRender === 1 || controlToRender === 3)
            {
                labelControlID = _dragDrop._CaptureViewDropPropertyLabel(contextobject, data, isReadOnly);

                if (controlToRender === 1)
                {
                    _dragDrop.lastAddedLabelID = labelControlID;
                }
            }

            //create input control //
            if (controlToRender === 2)
            {
                _dragDrop._CaptureViewDropPropertyInput(contextobject, data, isReadOnly, setAsSelectedControl, _dragDrop.lastAddedLabelID);
            }
            else if (controlToRender === 3)
            {
                _dragDrop._CaptureViewDropPropertyInput(contextobject, data, isReadOnly, setAsSelectedControl, labelControlID);
            }

            _dragDrop._ToggleContextWaterMark(contextobject);

            //SetRowCellLayout(row);

            _dragDrop.View.isViewChanged = true;
            //if (window.ie) document.recalc(true);
            return true;
        },

        _CaptureViewDropPropertyInput: function (contextobject, data, isReadOnly, setAsSelectedControl, associatedControlID)
        {
            var ControlType = '';
            var controlName = null;
            var id = String.generateGuid();
            _dragDrop._newControlIds.push(id);
            var propertiesXML = _dragDrop.ViewDesigner._getProperties(id);
            var associatedProperiesXML = null;
            var associatedControlName = null;
            var wrapperClass = 'controlwrapper';
            var isDroppedOnToolbarDroppable = false;

            if (contextobject.hasClass('toolbar-droppable'))
            {
                isDroppedOnToolbarDroppable = true;
            }

            var hasReferences = false;
            if (data.references === '')
            {
                ControlType = _dragDrop._GetDataTypeDefaultControl(data.propertytype, isReadOnly);
                hasReferences = false;
            }
            else
            {
                ControlType = _dragDrop._GetDataTypeDefaultControl('association', isReadOnly);
                hasReferences = true;
            }

            if (ControlType === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return false;
            }

            var ControlDef = _dragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResizer = ControlDef.resizeWrapper;

            ControlWrapper.attr('layouttype', 'control');
            ControlWrapper.attr('references', data.references);
            ControlWrapper.attr('propertytype', data.propertytype);
            ControlWrapper.attr('propertyid', data.propertyid);
            ControlWrapper.attr('friendlyname', data.friendlyname);
            ControlWrapper.attr('soid', data.soid);
            ControlWrapper.attr('itemtype', data.itemtype);
            ControlWrapper.attr('controltype', ControlType);
            ControlWrapper.addClass(wrapperClass);
            ControlWrapper.addClass('draggable');

            var defaultProperties = null;
            properties = '';
            var propertyType = (!checkExists(data.references) || data.references === "") ? data.propertytype : "association";
            styles = _dragDrop.Styles._getStyles(id, ControlType, propertyType);

            // get details on association between the controls
            if ($chk(associatedControlID))
            {
                associatedProperiesXML = _dragDrop.View.controlPropertiesXML.selectSingleNode('Control[@ID="' + associatedControlID + '"]/Properties');
                if ($chk(associatedProperiesXML))
                {
                    var associatedControlNameNode = associatedProperiesXML.selectSingleNode("Property[Name='ControlName']/DisplayValue");
                    if (!checkExists(associatedControlNameNode))
                    {
                        associatedControlNameNode = associatedProperiesXML.selectSingleNode("Property[Name='ControlName']/Value");
                    }
                    associatedControlName = associatedControlNameNode.text;
                }
            }

            if (checkExists(propertiesXML))
            {
                propertiesXML.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_dragDrop.View.viewDefinitionXML, "AssociatedControl", associatedControlID, associatedControlName));
            }
            else
            {
                propertiesXML = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                _dragDrop.ViewDesigner._loadPropertyTypeProperties(propertiesXML, id, ControlType, data.propertytype);
                controlName = _dragDrop.DesignerTable._BuildControlName(id, data.friendlyname, ControlType);
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));

                propertiesXML.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_dragDrop.View.viewDefinitionXML, "AssociatedControl", associatedControlID, associatedControlName));

                if (typeof (ControlType) === "string")
                {
                    var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + ControlType + '"]');

                    if (checkExists(initialControlElem))
                    {
                        defaultProperties = initialControlElem.selectSingleNode("DefaultProperties");

                        this._addInitialValuesToPropertiesXml({
                            propertiesXml: propertiesXML,
                            id: id,
                            controlType: ControlType,
                            initialControlElem: initialControlElem,
                            defaultProperties: defaultProperties
                        });
                    }
                }

                if ($chk(isReadOnly))
                {
                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ReadOnly', isReadOnly, isReadOnly));
                }

                if ($chk(data.propertyid))
                {
                    var fieldEl = _dragDrop.View.viewDefinitionXML.selectSingleNode("SourceCode.Forms/Views/View/Sources/Source[@ContextType='Primary'][@SourceID='" + data.soid + "']/Fields/Field[FieldName/text()='" + data.propertyid + "']");

                    if ($chk(fieldEl))
                    {
                        var fieldID = fieldEl.getAttribute("ID");
                        propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Field', fieldID, data.friendlyname));
                    }

                    var fieldDataType = fieldEl.getAttribute("DataType");
                    var dataTypePropertyElement = propertiesXML.selectSingleNode("Property[Name='DataType']");
                    if (checkExists(dataTypePropertyElement))
                    {
                        dataTypePropertyElement.parentNode.removeChild(dataTypePropertyElement);
                    }

                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'DataType', fieldDataType, fieldDataType));
                }

                if (hasReferences === true)
                {
                    var refData = data.references.split('|');
                    var refSOName = refData[1];
                    var refSOGuid = refData[2];
                    var refProp = refData[3];
                    var refMapTo = refData[4];
                    var refMethodDetail = refData[5].split('[');
                    var refMethod = refMethodDetail[0];
                    var refDisplayProperty = _dragDrop._getAssociationDisplayProperty(refSOGuid, refProp);
                    var DisplayPropData = _dragDrop._getAssociationPropertyData(refSOGuid, refDisplayProperty);
                    var refFriendlyName = DisplayPropData.friendlyname;
                    var refSOFriendlyName = DisplayPropData.sofriendlyname;

                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'AssociationSO', refSOGuid, refSOFriendlyName));
                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'AssociationMethod', refMethod, refMethod));
                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ValueProperty', refProp, refProp));
                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'DisplayTemplate', refDisplayProperty, refFriendlyName));
                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'OriginalProperty', refMapTo, refMapTo));
                    propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'DataSourceType', "SmartObject", "SmartObject"));

                    data.refSOGuid = refSOGuid;
                    data.refMethod = refMethod;
                    data.controlid = id;
                    data.controltype = ControlType;
                    data.controlname = controlName;
                    _dragDrop.ViewDesigner._BuildDefaultLoadBehaviour(data);
                }
            }

            // create an association between the controls
            if ($chk(associatedControlID))
            {
                if (!$chk(associatedProperiesXML))
                {
                    associatedProperiesXML = _dragDrop.View.controlPropertiesXML.selectSingleNode('Control[@ID="' + associatedControlID + '"]/Properties');
                }
                if ($chk(associatedProperiesXML))
                {
                    associatedProperiesXML.appendChild(SourceCode.Forms.Designers.Common.Rules._createEventingProperty(_dragDrop.View.viewDefinitionXML, 'AssociatedControl', id, controlName));
                }
            }

            var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType, propertiesXML, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlHTML = _dragDrop._GetDesignTimeHTML(ControlType);
                if (ControlHTML === '')
                {
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType + "'");
                    return false;
                }
                ControlWrapperResizer.append(jQuery(ControlHTML));
            }
            _dragDrop._EnsureControlOverlay(ControlWrapperResizer);


            if (isDroppedOnToolbarDroppable === true)
            {
                if (checkExists(associatedControlID))
                {
                    var assocControl = _dragDrop.View.element.find("#" + associatedControlID);

                    if (assocControl.length > 0)
                    {
                        var brAfterLabel = assocControl.next("br");

                        if (brAfterLabel.length > 0)
                        {
                            ControlWrapper.insertAfter(brAfterLabel);
                        }
                        else
                        {
                            ControlWrapper.insertAfter(assocControl);
                        }
                    }
                    else
                    {
                        ControlWrapper.insertAfter(contextobject);
                    }
                }
                else
                {
                    ControlWrapper.insertAfter(contextobject);
                }
            }
            else
            {
                contextobject.append(ControlWrapper);
            }

            if (data.section === 'toolbarSection')
            {
                _dragDrop._addToolbarDroppables(ControlWrapper, false, true);
            }

            var defaultWidth = checkExists(defaultProperties) ? defaultProperties.selectSingleNode("Properties/Prop[@ID='Width']/Value") : null;

            if (checkExists(defaultWidth))
            {
                ControlWrapper.css('width', defaultWidth.text);
            }
            else
            {
                ControlWrapper.css('width', 'auto');
            }

            ControlUtil.setElementFlexBasisAsWidthForIE11(ControlWrapper);

            if (checkExists(propertiesXML))
            {
                _dragDrop.ViewDesigner._setControlPropertiesXML(id, propertiesXML, styles, ControlType);
                _dragDrop.AJAXCall._initControlProperties(id, ControlType, propertiesXML, styles, setAsSelectedControl); //add
            }

            // we need to ensure that mappings are restored if any method buttons exist
            _dragDrop._ensureMethodsPropertyActions(ControlWrapper, data, false);
        },

        _ensureMethodsPropertyActions: function (control, data, mapToViewField)
        {
            var soXML = _dragDrop.View.hiddenSmartObjectXml;
            var actionsXML = _dragDrop.View.viewDefinitionXML.selectNodes("SourceCode.Forms/Views/View/Events/Event[@Type='User']/Handlers/Handler/Actions/Action[@Type='Execute'][not(Properties/Property/Name = 'ControlID')]");

            if (!checkExists(actionsXML))
            {
                // if nothing was selected, just stop
                return;
            }

            var fieldControls = _dragDrop.View.element.find("#editorCanvasPane #bodySection table>tbody>tr>td>div[itemtype='property'][propertyid='{0}']".format(data.propertyid));
            var controlID = jQuery(control).attr("id");
            var controlName = _dragDrop.ViewDesigner._getControlProperty(controlID, "ControlName");


            for (var i = 0; i < actionsXML.length; i++)
            {
                var skipMapping = false;
                var createAndAuto = false;
                var actionElement = actionsXML[i];
                var methodValueElement = actionElement.selectSingleNode("Properties/Property[Name='Method']/Value");

                if (checkExists(methodValueElement))
                {
                    var methodName = methodValueElement.text;
                    var fieldID = _dragDrop.ViewDesigner._getControlProperty(controlID, 'Field');

                    if (methodName !== "")
                    {
                        var soXML = (!checkExists(actionElement.selectSingleNode("Properties/Property[Name='ObjectID']"))) ? _dragDrop.View.hiddenSmartObjectXml : _dragDrop.View.hiddenAssociationXml;
                        var soMethodElement = soXML.selectSingleNode("smartobject/smartobjectroot[@guid='" + data.soid + "']/methods/method[@name='" + methodName + "']");

                        if (checkExists(soMethodElement))
                        {
                            var methodType = soMethodElement.getAttribute("type");
                            var isReturn = checkExists(soMethodElement.selectSingleNode("returnproperties/property[@name='" + data.propertyid + "']"));

                            if (methodType !== "list")
                            {
                                var isInput = checkExists(soMethodElement.selectSingleNode("input/property[@name='" + data.propertyid + "']"));
                                var isRequired = checkExists(soMethodElement.selectSingleNode("requiredproperties/property[@name='" + data.propertyid + "']"));

                                if (isInput)
                                {
                                    // find if any control has been mapped to the current action
                                    for (var j = 0; j < fieldControls.length; j++)
                                    {
                                        fieldControlPropType = fieldControls[j].getAttribute("propertytype");

                                        if (checkExists(fieldControlPropType))
                                        {
                                            // added to keep in sync with MappingsHelper.cs used during Auto Generation
                                            if (((fieldControlPropType.toLowerCase() === "autonumber") || (fieldControlPropType.toLowerCase() === "autoguid")) && (methodType === "create"))
                                            {
                                                createAndAuto = true;
                                                break;
                                            }
                                        }

                                        if (actionElement.selectSingleNode("Parameters/Parameter[@SourceID='{0}']".format(fieldControls[j].getAttribute("id"))))
                                        {
                                            skipMapping = true;
                                            break;
                                        }
                                    }

                                    if (skipMapping)
                                        continue;

                                    if (!createAndAuto)
                                    {
                                        // if we should create the paramater, and the node does not exist yet, create it
                                        if (!checkExists(actionElement.selectSingleNode("Parameters")))
                                        {
                                            actionElement.appendChild(actionElement.ownerDocument.createElement("Parameters"));
                                        }

                                        var matchingParameter = actionElement.selectSingleNode("Parameters/Parameter[@TargetID='{0}']".format(data.propertyid));

                                        var map = false;
                                        if (checkExists(matchingParameter))
                                        {
                                            // before we map the value, make sure that it doesn't already have a mapping
                                            if (matchingParameter.getAttribute("SourceType") === "Value")
                                            {
                                                var sourceValues = matchingParameter.selectNodes("SourceValue");
                                                if (sourceValues.length === 0)
                                                {
                                                    map = true;
                                                }
                                                else if (sourceValues.length === 1 && sourceValues[0].text === "")
                                                {
                                                    map = true;
                                                }
                                            }

                                            if (matchingParameter.getAttribute("SourceType") === "ViewField" && matchingParameter.getAttribute("SourceID") === fieldID)
                                            {
                                                map = true;
                                            }

                                            if (map && mapToViewField === false)
                                            {
                                                matchingParameter.setAttribute("SourceType", "Control");
                                                matchingParameter.setAttribute("SourceID", controlID);
                                                matchingParameter.setAttribute("SourceName", controlName);
                                                matchingParameter.setAttribute("SourceDisplayName", controlName);
                                            }
                                            else if (map)
                                            {
                                                matchingParameter.setAttribute("SourceType", "ViewField");
                                                matchingParameter.setAttribute("SourceID", fieldID);
                                                matchingParameter.setAttribute("SourceName", data.propertyid);
                                                matchingParameter.setAttribute("SourceDisplayName", data.friendlyname);
                                            }
                                        }
                                        else if (!checkExists(matchingParameter) && checkExists(actionElement.selectSingleNode("Parameters")))
                                        {
                                            var matchingParameter = actionElement.ownerDocument.createElement("Parameter");
                                            if (mapToViewField === false)
                                            {
                                                matchingParameter.setAttribute("SourceType", "Control");
                                                matchingParameter.setAttribute("SourceID", controlID);
                                                matchingParameter.setAttribute("SourceName", controlName);
                                                matchingParameter.setAttribute("SourceDisplayName", controlName);
                                            }
                                            else
                                            {
                                                matchingParameter.setAttribute("SourceType", "ViewField");
                                                matchingParameter.setAttribute("SourceID", fieldID);
                                                matchingParameter.setAttribute("SourceName", data.propertyid);
                                                matchingParameter.setAttribute("SourceDisplayName", data.friendlyname);
                                            }

                                            matchingParameter.setAttribute("TargetID", data.propertyid);
                                            matchingParameter.setAttribute("TargetType", "ObjectProperty");

                                            actionElement.selectSingleNode("Parameters").appendChild(matchingParameter);
                                        }

                                        if (isRequired && checkExists(matchingParameter))
                                        {
                                            matchingParameter.setAttribute("IsRequired", "true");
                                        }
                                    }
                                }
                            }

                            if (isReturn)
                            {
                                var matchingResult = actionElement.selectSingleNode("Results/Result[(@SourceID='{0}') and (@TargetType='ViewField')]".format(data.propertyid));
                                var resultsElement = actionElement.selectSingleNode("Results");
                                var matchingControlResult;

                                if (checkExists(matchingResult) && !mapToViewField)
                                {
                                    matchingResult.setAttribute("TargetType", "Control");
                                    matchingResult.setAttribute("TargetID", controlID);
                                }
                                else if (!checkExists(matchingResult) && checkExists(resultsElement))
                                {
                                    matchingResult = actionElement.ownerDocument.createElement("Result");
                                    matchingResult.setAttribute("SourceType", "ObjectProperty");
                                    matchingResult.setAttribute("SourceID", data.propertyid);
                                    matchingResult.setAttribute("SourceName", data.propertyid);
                                    matchingResult.setAttribute("SourceDisplayName", data.friendlyname);

                                    if (mapToViewField)
                                    {
                                        matchingResult.setAttribute("TargetType", "ViewField");
                                        matchingResult.setAttribute("TargetID", fieldID);
                                    }
                                    else
                                    {
                                        matchingResult.setAttribute("TargetType", "Control");
                                        matchingResult.setAttribute("TargetID", controlID);
                                    }

                                    resultsElement.appendChild(matchingResult);
                                }
                            }
                        }
                    }
                }
            }
        },

        _CaptureViewDropPropertyLabel: function (contextobject, data, isReadOnly)
        {
            var ControlType = '';
            var id = String.generateGuid();
            _dragDrop._newControlIds.push(id);
            var propertiesXML = _dragDrop.ViewDesigner._getProperties(id);
            var wrapperClass = 'controlwrapper';
            var width = contextobject.innerWidth() + 'px';
            var isDroppedOnToolbarDroppable = false;

            if (contextobject.hasClass('toolbar-droppable'))
            {
                isDroppedOnToolbarDroppable = true;
            }

            ControlType = _dragDrop._GetDataTypeDefaultControl('label');

            if (!checkExists(propertiesXML))
            {
                propertiesXML = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                _dragDrop.ViewDesigner._loadPropertyTypeProperties(propertiesXML, id, ControlType, data.propertytype);
            }

            if (ControlType === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return false;
            }

            var ControlDef = _dragDrop._BuildControlWrapper(id);
            var ControlLabelWrapper = ControlDef.wrapper;
            var ControlLabelWrapperResizer = ControlDef.resizeWrapper;

            ControlLabelWrapper.attr('layouttype', 'control');
            ControlLabelWrapper.attr('friendlyname', data.friendlyname);
            ControlLabelWrapper.attr('itemtype', 'control');
            ControlLabelWrapper.attr('controltype', ControlType);
            ControlLabelWrapper.addClass('draggable');
            ControlLabelWrapper.addClass(wrapperClass);

            if ($chk(data.references))
            {
                data.friendlyname = _dragDrop._ensureCorrectAssociationPropertyName(data.friendlyname);
            }
            else
            {
                data.friendlyname = data.friendlyname.replace(/([a-z](?=[A-Z])|[A-Z](?=[A-Z][a-z]))/g, '$1 ');
            }

            var friendlyName = data.addColonSuffix === true ? data.friendlyname + ":" : data.friendlyname;
            var styles = _dragDrop.Styles._getStyles(id, ControlType);

            if (checkExists(propertiesXML))
            {
                var controlName = _dragDrop.DesignerTable._BuildControlName(id, data.friendlyname, ControlType);
                propertiesXML = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                _dragDrop.ViewDesigner._loadPropertyTypeProperties(propertiesXML, id, ControlType, data.propertytype);
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Text', friendlyName, friendlyName));
            }

            this._addInitialValuesToPropertiesXml({
                propertiesXml: propertiesXML,
                id: id,
                controlType: ControlType
            });

            var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType, propertiesXML, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlLabelHTML = _dragDrop._GetDesignTimeHTML(ControlType);
                if (ControlLabelHTML === "")
                {
                    //could not find the control html definition for 'Label'
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " 'Label'");
                    return false;
                }

                ControlLabelWrapperResizer.append(jQuery(ControlLabelHTML));
            }
            _dragDrop._EnsureControlOverlay(ControlLabelWrapperResizer);


            var br = jQuery("<div layouttype='line-break' class='line-break'>&nbsp;</div>");

            if (isDroppedOnToolbarDroppable === true)
            {
                ControlLabelWrapper.insertAfter(contextobject);
                br.insertAfter(ControlLabelWrapper);
            }
            else
            {
                contextobject.append(ControlLabelWrapper);
                contextobject.append(br);
            }

            if (data.section === 'toolbarSection')
            {
                _dragDrop._addToolbarDroppables(ControlLabelWrapper, true, false);
            }

            if (ControlLabelWrapper.length > 0)
                ControlLabelWrapper[0].style.width = 'auto'; // Fix for Mozilla Control wrapper remove width(Control not align center)

            if (checkExists(propertiesXML))
            {
                _dragDrop.ViewDesigner._setControlPropertiesXML(id, propertiesXML, styles);
                _dragDrop.AJAXCall._initControlProperties(id, ControlType, propertiesXML, styles);  //add
            }

            return id;
        },

        _CaptureViewDropControl: function (contextobject, data, setAsSelectedControl)
        {
            var ControlType = '';
            var wrapperClass = 'controlwrapper';
            var isDroppedOnToolbarDroppable = false;

            if (contextobject.hasClass('toolbar-droppable'))
            {
                //SetRowCellLayout(contextobject.parents('tr').eq(0));
                isDroppedOnToolbarDroppable = true;
            } else
            {
                //SetRowCellLayout(contextobject.parent());
            }

            switch (data.section)
            {
                case 'toolbarSection':
                    wrapperClass = 'controlwrapper inline';
                    break;
                default:
                    wrapperClass = 'controlwrapper';
                    break;
            }

            ControlType = data.name;

            if (ControlType === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }
            var id = (checkExists(data.id)) ? data.id : String.generateGuid();
            _dragDrop._newControlIds.push(id);
            var ControlDef = _dragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResizer = ControlDef.resizeWrapper;

            ControlWrapper.attr('friendlyname', data.friendlyname);
            ControlWrapper.attr('name', data.name);
            ControlWrapper.attr('itemtype', data.itemtype);
            ControlWrapper.attr('controltype', ControlType);
            ControlWrapper.addClass(wrapperClass);
            ControlWrapper.addClass('draggable');

            var propertiesXML = _dragDrop.ViewDesigner._getProperties(id);
            var styles = _dragDrop.Styles._getStyles(id, ControlType);

            if (!checkExists(propertiesXML))
            {
                propertiesXML = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                _dragDrop.ViewDesigner._loadPropertyTypeProperties(propertiesXML, id, ControlType, data.propertytype);
                var controlName = _dragDrop.DesignerTable._BuildControlName(id, '', ControlType);
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));

                if (typeof (ControlType) === "string")
                {
                    var initialControlElem = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + ControlType + '"]');

                    if (checkExists(initialControlElem))
                    {
                        var defaultProperties = initialControlElem.selectSingleNode("DefaultProperties");

                        this._addInitialValuesToPropertiesXml({
                            propertiesXml: propertiesXML,
                            id: id,
                            controlType: ControlType,
                            initialControlElem: initialControlElem,
                            defaultProperties: defaultProperties
                        });
                    }
                }
            }

            var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType, propertiesXML, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlHTML = _dragDrop._GetDesignTimeHTML(ControlType);
                if (ControlHTML === "")
                {
                    //could not find the control html definition for 'Label'
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType + "'");
                    return;
                }

                ControlWrapperResizer.append(jQuery(ControlHTML));
            }
            _dragDrop._EnsureControlOverlay(ControlWrapperResizer);


            if (contextobject.html() === '&nbsp;')
            {
                contextobject.empty();
            }

            if (isDroppedOnToolbarDroppable === true)
            {
                ControlWrapper.insertAfter(contextobject);
            }
            else
            {
                contextobject.append(ControlWrapper);
            }

            if (data.section === 'toolbarSection')
            {
                _dragDrop._addToolbarDroppables(ControlWrapper);
            }

            _dragDrop._ToggleContextWaterMark(contextobject);

            var defaultWidth = checkExists(defaultProperties) ? defaultProperties.selectSingleNode("Properties/Prop[@ID='Width']/Value") : null;

            if (checkExists(defaultWidth))
            {
                ControlWrapper.css('width', defaultWidth.text);
                ControlWrapper.data('width', defaultWidth.text);
            }
            else
            {
                ControlWrapper.css('width', 'auto');
                ControlWrapper.data('width', 'auto');
            }

            ControlUtil.setElementFlexBasisAsWidthForIE11(ControlWrapper);

            _dragDrop.ViewDesigner._setControlPropertiesXML(id, propertiesXML, styles, ControlType);
            this._setLayoutType(data.itemtype, ControlWrapper, ControlType);
            _dragDrop.AJAXCall._initControlProperties(id, ControlType, propertiesXML, styles, setAsSelectedControl); //add called when dropping an unbound control on capture view	
           

            if (ControlWrapper.attr('layouttype') == 'layoutcontainer')
            {
                var newID = String.generateGuid();
                _dragDrop._newControlIds.push(newID);
                ControlWrapper.find(".editor-table").eq(0).attr("id", newID);
                _dragDrop.DesignerTable._addColumnGroupColumns(newID);
            }
            // make sure the correct property tabs are displayed and selected
            if ($chk(_dragDrop.View.selectedObject) && _dragDrop.View.selectedObject.length > 0)
            {
                _dragDrop.ViewDesigner._configurePropertiesTab(_dragDrop.View.selectedObject);
            }

            _dragDrop.View.isViewChanged = true;

            SourceCode.Forms.Designers.Common.triggerEvent("ControlDragStopped");

        },

        _CaptureViewDropMethod: function (contextobject, data, setAsSelectedControl)
        {
            var isDroppedOnToolbarDroppable = false;

            if (contextobject.hasClass('toolbar-droppable'))
            {
                isDroppedOnToolbarDroppable = true;
            }

            var ControlType = '';
            var propertiesXML;
            var id;
            var wrapperClass = 'controlwrapper';

            switch (data.section)
            {
                case 'toolbarSection':
                    ControlType = _dragDrop._GetDataTypeDefaultControl('toolbarmethod');
                    wrapperClass = 'controlwrapper inline';
                    break;
                default:
                    ControlType = _dragDrop._GetDataTypeDefaultControl(data.itemtype);
                    wrapperClass = 'controlwrapper';
                    break;
            }

            if (ControlType === '')
            {
                //could not find the default control definition for the selected property type
                popupManager.showWarning(Resources.ViewDesigner.ErrorDefaultControlNotFound);
                return;
            }

            id = String.generateGuid();
            _dragDrop._newControlIds.push(id);
            var ControlDef = _dragDrop._BuildControlWrapper(id);
            var ControlWrapper = ControlDef.wrapper;
            var ControlWrapperResizer = ControlDef.resizeWrapper;

            //TODO: TD 0019
            var controlName = _dragDrop.DesignerTable._BuildControlName(id, data.methodid, ControlType);

            var methodData =
            {
                soid: data.soid,
                viewid: _dragDrop.ViewDesigner._GetViewID(),
                methodid: data.methodid,
                friendlyname: data.friendlyname,
                controlid: id,
                controlname: controlName
            };

            _dragDrop.ViewDesigner._BuildMethodBehaviour(methodData);

            var propertiesXML = _dragDrop.ViewDesigner._getProperties(id);
            var styles = _dragDrop.Styles._getStyles(id, ControlType);

            if (!checkExists(propertiesXML))
            {
                propertiesXML = _dragDrop.View.viewDefinitionXML.createElement("Properties");
                _dragDrop.ViewDesigner._loadPropertyTypeProperties(propertiesXML, id, ControlType, data.propertytype);
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ControlName', controlName, controlName));
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'Text', data.friendlyname, data.friendlyname));
                var icon = 'none';
                if (data.section === 'toolbarSection')
                {
                    switch (data.methodtype)
                    {
                        case 'update':
                            icon = 'save';
                            break;
                        case 'create':
                            icon = 'add';
                            break;
                        case 'delete':
                            icon = 'delete';
                            break;
                        case 'read':
                            icon = 'load';
                            break;
                        case 'list':
                            icon = 'refresh';
                            break;
                        default:
                            icon = 'none';
                            break;
                    }
                }
                propertiesXML.appendChild(_dragDrop.ViewDesigner._BuildPropertyElem(id, 'ImageClass', icon, icon));
            }

            var controlRequiresAjaxCall = _dragDrop.AJAXCall._controlRequiresRerender(ControlType, propertiesXML, styles);
            if (controlRequiresAjaxCall)
            {
                var ControlHTML = _dragDrop._GetDesignTimeHTML(ControlType);
                if (ControlHTML === "")
                {
                    //could not find the control html definition for 'Label'
                    popupManager.showWarning(Resources.ViewDesigner.ErrorControlDefinitionNotFound + " '" + ControlType + "'");
                    return;
                }
                ControlWrapperResizer.append(jQuery(ControlHTML));
            }

            ControlWrapper.attr('layouttype', 'control');
            ControlWrapper.attr('itemtype', 'method');
            ControlWrapper.attr('methodid', data.methodid);
            ControlWrapper.attr('controltype', ControlType);
            ControlWrapper.addClass(wrapperClass);
            ControlWrapper.addClass('draggable');
            _dragDrop._EnsureControlOverlay(ControlWrapperResizer);


            if (contextobject.html() === '&nbsp;')
            {
                contextobject.html('');
            }

            if (isDroppedOnToolbarDroppable === true)
            {
                ControlWrapper.insertAfter(contextobject);
            }
            else
            {
                contextobject.append(ControlWrapper);
            }

            _dragDrop._ToggleContextWaterMark(contextobject);

            if (data.section === 'toolbarSection')
            {
                _dragDrop._addToolbarDroppables(ControlWrapper);
            }

            _dragDrop.ViewDesigner._setControlPropertiesXML(id, propertiesXML, styles);
            _dragDrop.AJAXCall._initControlProperties(id, ControlType, propertiesXML, styles, setAsSelectedControl); //add called when dropping a method on capture view

            _dragDrop.View.isViewChanged = true;
        },

        //prevent more than one overlay being added to the control.
        _EnsureControlOverlay: function (element)
        {
            SourceCode.Forms.Designers.Common.ensureControlOverlay(element);
        },

        _GetDataTypeDefaultControl: function (Datatype, isReadOnly)
        {
            var returnControl = '';

            var xmlDoc = _dragDrop.View.TypeDefaultControls;
            var xPath = '';

            var controlElem = xmlDoc.selectSingleNode('Controls/Control[@datatype="' + Datatype + '"]');
            if (controlElem)
            {
                if (isReadOnly === true)
                    returnControl = controlElem.getAttribute('readonlycontroltype');
                else
                    returnControl = controlElem.getAttribute('controltype');
            }

            return returnControl;
        },

        _addToolbarDroppables: function (ControlWrapper, insertDropBefore, insertDropAfter)
        {
            var prevControl = ControlWrapper.prev(".toolbar-droppable");
            var nextControl = ControlWrapper.next(".toolbar-droppable");
            var prevDroppable;
            var nextDroppable;

            var insertBefore = true;
            var insertAfter = true;

            if (checkExists(insertDropBefore))
            {
                if (!insertDropBefore)
                {
                    insertBefore = false;
                }
            }

            if (checkExists(insertDropAfter))
            {
                if (!insertDropAfter)
                {
                    insertAfter = false;
                }
            }

            if ((prevControl.length === 0) && (insertBefore))
            {
                prevDroppable = jQuery('<div class="toolbar-droppable" style="display:none"></div>');
                prevDroppable.insertBefore(ControlWrapper);
            }

            if ((nextControl.length === 0) && (insertAfter))
            {
                nextDroppable = jQuery('<div class="toolbar-droppable" style="display:none"></div>');
                nextDroppable.insertAfter(ControlWrapper);
            }
            else if ((nextControl.length > 0) && (!nextControl.hasClass('toolbar-droppable')) && (insertAfter))
            {
                nextDroppable = jQuery('<div class="toolbar-droppable" style="display:none"></div>');
                nextDroppable.insertAfter(ControlWrapper);
            }
        },

        _makeControlSizable: function (jElement)
        {
            if (_dragDrop.CheckOut._checkViewStatus() === false) return;
            var section = _dragDrop.ViewDesigner._getSection(jElement);
            if (section.attr('id') === 'toolbarSection') return;
            if (jElement.length > 0)
            {
                var elementParent = jElement.parent('td');

                if (elementParent.length > 0)
                {
                    var elementLeft = elementParent.offset().left;
                    var elementLeftWidth = elementParent.offset().left + elementParent.width();

                    var flags = _dragDrop._getControlResizeFlags(jElement);

                    if (flags !== '')
                    {
                        var options = {
                            containment: 'document',
                            disableSelection: true,
                            handles: flags,
                            grid: { x: 1, y: 1 },
                            preserveCursor: true,
                            start: _dragDrop._resizeControlStart,
                            resize: _dragDrop._resizeControl,
                            stop: _dragDrop._resizeControlComplete
                        };
                        var ControlWrapperResizer = jQuery(jElement.children('.resizewrapper'));
                        ControlWrapperResizer.resizable(options);
                        $(".ui-resizable-handle", ControlWrapperResizer).addClass("canvas-adornments");
                    }
                }
            }
        },

        _getAssociationDisplayProperty: function (smartObjectID, defaultID)
        {
            var retVal = defaultID;

            if (!checkExists(_dragDrop.View.hiddenAssociationXml))
            {
                return retVal;
            }

            var xmlDoc = _dragDrop.View.hiddenAssociationXml;
            var soXPath = "//associations/smartobjectroot[@guid='" + smartObjectID + "']";
            var propXPath = "property[@type='text']";
            var soElement = xmlDoc.selectSingleNode(soXPath);

            if ($chk(soElement) === true)
            {
                var propertiesElem = soElement.selectSingleNode('properties');
                var propElement = propertiesElem.selectSingleNode(propXPath);
                if ($chk(propElement) === true)
                {
                    retVal = propElement.getAttribute('name');
                }
            }
            return retVal;
        },

        _getAssociationPropertyData: function (smartObjectID, propertyID)
        {
            var retVal = null;

            _dragDrop.AJAXCall._getAssociationSODetails(smartObjectID);
            if (!checkExists(_dragDrop.View.hiddenAssociationXml))
            {
                return retVal;
            }
            var xmlDoc = _dragDrop.View.hiddenAssociationXml;
            var soXPath = "//associations/smartobjectroot[@guid='" + smartObjectID + "']";
            var propXPath = "properties/property[@name='" + propertyID + "']";
            var soElement = xmlDoc.selectSingleNode(soXPath);

            if ($chk(soElement) === true)
            {
                var soDisplayElement = soElement.selectSingleNode('metadata/display/displayname');
                if ($chk(soDisplayElement) === true)
                {
                    var propElement = soElement.selectSingleNode(propXPath);
                    if ($chk(propElement) === true)
                    {
                        var displayNameElem = propElement.selectSingleNode('metadata/display/displayname');
                        retVal =
                        {
                            name: propElement.getAttribute('name'),
                            friendlyname: displayNameElem.text,
                            type: propElement.getAttribute('type'),
                            sofriendlyname: soDisplayElement.text,
                            soname: soElement.getAttribute('name')
                        };
                    }
                }
            }

            return retVal;
        },

        _GetDesignTimeHTML: function (ControlName)
        {
            var RetVal = "";
            var ControlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
            var Controls = ControlsDoc.documentElement.selectNodes('Control');

            for (var i = 0; i < Controls.length; i++)
            {
                var ControlElem = Controls[i];
                var ThisControlName = ControlElem.selectSingleNode('Name').text;
                if (ThisControlName.toLowerCase() === ControlName.toLowerCase())
                {
                    RetVal = ControlElem.selectSingleNode('HTML').text;
                    break;
                }

            }
            return RetVal;
        },

        _getSmartObjectPropertyData: function (smartObjectID, propertyID)
        {
            var retVal = '';

            var xmlDoc = _dragDrop.View.hiddenSmartObjectXml;
            var soXPath = "//smartobjectroot[@guid='" + smartObjectID + "']";
            var propXPath = "properties/property[@name='" + propertyID + "']";
            var soElement = "";

            if (checkExists(xmlDoc))
            {
                soElement = xmlDoc.selectSingleNode(soXPath);
            }

            if ($chk(soElement) === true)
            {
                var soDisplayElement = soElement.selectSingleNode('metadata/display/displayname');
                if ($chk(soDisplayElement) === true)
                {
                    var propElement = soElement.selectSingleNode(propXPath);
                    if ($chk(propElement) === true)
                    {
                        var displayNameElem = propElement.selectSingleNode('metadata/display/displayname');
                        retVal = {
                            name: propElement.getAttribute('name'),
                            friendlyname: displayNameElem.text,
                            type: propElement.getAttribute('type'),
                            sofriendlyname: soDisplayElement.text,
                            soname: soElement.getAttribute('name')
                        };
                    }
                }
            }
            return retVal;
        },

        _resizeControlComplete: function (e, ui)
        {
            _dragDrop.View.isControlSizing = false;
            var thisSize = { x: ui.size.width, y: ui.size.height };
            var deltaSize = { x: (thisSize.x - ui.originalSize.width), y: (thisSize.y - ui.originalSize.height) };
            var setToCellSize = false;
            var ResizeWrapper = ui.element;
            var Control = ResizeWrapper.parent();

            if (deltaSize.x !== 0 || deltaSize.y !== 0)
            {
                var controlId = Control.attr('id');
                var controlType = Control.attr('controltype');
                var controlXml = _dragDrop.Styles._getControlNode(controlId).xml;

                var setFunctionFired = null;
                if (deltaSize.x !== 0)
                {
                    setFunctionFired = false;
                    //set the width property
                    PropertyValue = (thisSize.x) + 'px';

                    var setFunction = _dragDrop.ViewDesigner._getPropertySetFunction(controlType, 'Width');
                    if (checkExists(setFunction))
                    {
                        var fSetFunction = eval(setFunction);
                        var value = fSetFunction(Control, PropertyValue, controlXml);
                        if (checkExists(value) && value != PropertyValue)
                        {
                            PropertyValue = value;
                        }
                        setFunctionFired = true;
                    }
                    _dragDrop.ViewDesigner._setControlPropertyValue(controlId, 'Width', PropertyValue);
                    Control.css('width', PropertyValue);
                    Control.find(".resizewrapper").css('width', PropertyValue);
                }
                
                if (deltaSize.y !== 0)
                {
                    //set the width property
                    PropertyValue = (thisSize.y) + 'px';

                    var setFunction = _dragDrop.ViewDesigner._getPropertySetFunction(controlType, 'Height');
                    if (checkExists(setFunction))
                    {
                        var fSetFunction = eval(setFunction);
                        var value = fSetFunction(Control, PropertyValue, controlXml);
                        if (checkExists(value) && value != PropertyValue)
                        {
                            PropertyValue = value;
                        }
                        if (setFunctionFired !== false) //if it was set to false then there was an x value that did not get set
                        {
                            setFunctionFired = true;
                        }
                    }
                    else
                    {
                        setFunctionFired = false;
                    }
                    _dragDrop.ViewDesigner._setControlPropertyValue(controlId, 'Height', PropertyValue);
                    Control.css('height', PropertyValue);
                    Control.find(".resizewrapper").css('height', PropertyValue);
                }

                _dragDrop.View.isViewChanged = true;
                _dragDrop.DesignerTable._positionHandlers();

                var controlPropertyXml = _dragDrop.ViewDesigner._getControlPropertiesXML(controlId); //re-query for the changed value
                _dragDrop.View.PropertyGrid.valuexml = controlPropertyXml;
                _dragDrop.View.PropertyGrid.refresh();

                if (!setFunctionFired)
                {
                    _dragDrop.ViewDesigner._redrawControl(controlId, _dragDrop.View.PropertyGrid, _dragDrop.ViewDesigner._getProperties(controlId));
                }
            }
        },

        _resizeControl: function (e, ui)
        {
            //var ResizeWrapper = ui.element;
            //var Control = ResizeWrapper.parent();
            //Control.css('width', ui.size.width + 'px');
        },

        _resizeControlStart: function (e, ui)
        {
            _dragDrop.View.isControlSizing = true;
        },

        _getControlResizeFlags: function (jElement)
        {
            var flags = '';
            var controltype = jElement.attr('controltype');
            if (controltype)
            {
                var ControlsDoc = SourceCode.Forms.Designers.Common.controlDefinitionsXml;
                var ControlElem = ControlsDoc.documentElement.selectSingleNode('Control[Name="' + controltype + '"]');

                if ($chk(ControlElem) === true)
                {
                    var resizeFlags = ControlElem.selectSingleNode('ResizeFlags').text;

                    switch (resizeFlags * 1)
                    {
                        case 1: //width
                            flags = 'e';
                            break;
                        case 2: //height
                            flags = 's';
                            break;
                        case 3: //width and height
                            flags = 'e,se,s';
                            break;
                        default:
                            flags = '';
                    }
                }

                return flags;
            }
        },

        _removeResizing: function (jElement)
        {
            _dragDrop.View.isControlSizing = false;
            _dragDrop.View.isCellSizing = false;
            jElement = jQuery(jElement);
            if (jElement.length > 0)
            {
                var resizeWrapper = jElement.children('.resizewrapper');

                if (resizeWrapper.isWidget("resizable"))
                {
                    resizeWrapper.resizable('destroy');
                }
            }
        },

        _BuildControlWrapper: function (id)
        {
            var wrapper = jQuery('<div></div>');
            var resizeWrapper = jQuery('<div></div>');
            wrapper.append(resizeWrapper);

            wrapper.attr('id', id);
            resizeWrapper.attr('id', 'resize_' + id);
            resizeWrapper.addClass('resizewrapper');

            return { wrapper: wrapper, resizeWrapper: resizeWrapper };
        },

        _setupElementDropTargets: function (eventObj, uiObj)
        {
            var _view = SourceCode.Forms.Designers.View;
            var jq_target = jQuery(eventObj.target);
            var toolbarIsParent = jq_target.closest("#toolbarSection").length > 0;
            var footerIsparent = jq_target.closest(".footer").length > 0;

            var dropTargets;
            var dropBlock;
            var methodDrag;
            var viewBlock = _dragDrop.View.element.find("#ViewWizard");
            var autoTable = false;
            var alreadyDropped = false;

            var htmlElem = jQuery("html");
            var itemType = uiObj.helper.attr('itemtype');
            var isIE9IE10Browser = htmlElem.hasClass("ie10") || htmlElem.hasClass("ie9") || htmlElem.hasClass("ie-document-mode-9");

            if (jq_target[0].getAttribute('controltype') !== "Table")
            {
                SourceCode.Forms.Designers.View.DesignerTable._positionHandlers();
            }

            if (_dragDrop.ViewDesigner._getViewType() === "CaptureList" && jq_target.attr("name") && jq_target.attr("name").toLowerCase() === "table")
            {
                var dropTargetsSelector = "#toolbarSection table.editor-table.toolbar div.toolbar-droppable, #toolbarSection table.editor-table .droptarget";

                dropTargets = jQuery(dropTargetsSelector);

                var notAllowedControlsSelector = "#editableSection, #MainNavigationPane, .home-header, .wizard-header, .wizard-steptree, .wizard-buttons, #edtiorBottomPanel, #LayoutPaneContainer > .divider, #EditorCanvas > .panel-header, #EditorCanvas_panel_toolbars, #bodySection table, #bodySection div, .not-selectable.toolbars, .grid-footer.not-selectable, #editableSection, .EditableTable";

                jQuery(notAllowedControlsSelector).addClass("not-droppable");

                $(".toolbar .editor-cell.droptarget:not(#editableSection)").css('cursor', 'pointer');
            }
            else
            {
                if (itemType === "method" || (jq_target.attr("name") && jq_target.attr("name").toUpperCase() !== "TABLE"))
                {
                    _dragDrop.View.element.find('#editableSection').addClass('not-droppable');
                }
                dropTargets = _dragDrop.View.element.find('#editorCanvasPane .editor-table .droptarget, .editor-table.toolbar div.toolbar-droppable, #bodySection .drag-column.ui-draggable');
            }

            _dragDrop.View.element.find('#editorCanvasPane .editor-table.toolbar .toolbar-droppable').css('display', '');

            if (!isIE9IE10Browser)
            {
                viewBlock.css('cursor', 'not-allowed');
            }

            var viewType = _dragDrop.ViewDesigner._getViewType();

            var dropOptions = {
                accept: ".draggable",
                addClasses: true,
                tolerance: 'pointer',
                greedy: true,
                drop: function (ev, ui)
                {
                    ev.stopPropagation();
                    if (SourceCode.Forms.Designers.Common.isMoveWidget(ui.draggable))
                    {
                        ui.draggable = $(SourceCode.Forms.Designers.Common._moveWidget.getAssociatedControl());
                    }
                    var newDropTargets = _dragDrop.View.element.find('#editorCanvasPane .editor-table .droptarget,.editor-table.toolbar div.toolbar-droppable, #ctl00_ctl00_PageBody');
                    var dropTargetToolbar = jQuery.contains(document.getElementById("toolbarSection"), ev.target);
                    var dropTargetFooter = jQuery(document.getElementsByClassName("editor-row footer list-view-item not-droppable")).children().is(ev.target);
                    var hasControl = false;

                    if (ui.helper.attr('itemtype') === 'property' && viewType === "CaptureList" && (dropTargetToolbar || dropTargetFooter) && dropTargets.length === 0)
                    {
                        //Check if the View has any controls except the table
                        for (var i = 1; i < newDropTargets.length; i++)
                        {
                            if (newDropTargets[i].firstElementChild !== null)
                            {
                                if (jQuery(newDropTargets[i]).hasClass("watermark-visible") === false)
                                {
                                    jQuery('div.toolbar-droppable').css('display', 'none');
                                    hasControl = true;
                                }
                            }
                        }

                        if (hasControl === false)
                        {
                            _view.clearView();
                        }
                    }
                    else
                    {
                        if (!jQuery('.columnWrapperDiv .drop-hover').length > 0)
                        {
                            if (!jQuery(ev.target).is('.drag-column.ui-draggable') && !alreadyDropped)
                            {
                                _dragDrop._dropControl(ev, ui, jQuery(this));
                                autoTable = false;
                            }
                        }
                        else
                        {
                            _dragDrop._dropNewColumn(ev, ui);
                            _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable').removeClass('drop-hover');
                            alreadyDropped = true;
                        }
                    }

                    var dropTarget = null;
                    dropTargets.filter(".ui-droppable").droppable("destroy");
                    //_dragDrop.View.element.find(
                    _dragDrop.View.element.find("#editableSection").removeClass("not-droppable");
                    _dragDrop.View.element.find('#footerControlDropPlaceHolder').off('mouseenter');
                    jQuery('.editor-row.footer.list-view-item').off('mouseleave');
                    _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable').off('mouseenter mouseleave');
                    _dragDrop.View.element.find('#toolbarSection').css('cursor', 'pointer');
                    _dragDrop.View.element.find('#vdToolboxPane').css("cursor", "default");

                    dropBlock.removeClass('not-droppable');
                    methodDrag.removeClass('not-droppable');
                    viewBlock.css('cursor', 'default');
                    _dragDrop.isDropping = false;
                },
                deactivate: function (ev, ui)
                {
                    dropBlock.removeClass('not-droppable');
                    methodDrag.removeClass('not-droppable');
                    viewBlock.css('cursor', 'default');

                    _dragDrop.View.element.find('#vdFormEventsTabGrid').find(".not-droppable").removeClass('not-droppable');
                    _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable').off('mouseenter mouseleave');
                    _dragDrop.View.element.find('#bodySection .controlwrapper').css('cursor', 'pointer');
                    _dragDrop.View.element.find("#editableSection .controlwrapper").css('cursor', 'pointer');
                    _dragDrop.View.element.find("#editableSection .controloverlay").show();
                },
                hoverClass: 'hover' // Required for toolbar placeholder hover states
            };

            // New feature introduced in 1.0.8 when item is dragged onto a blank canvas to automatically create a new layout table.
            var canvasIsBlank = (jQuery(dropTargets).length === 0);
            if (canvasIsBlank)
            {
                //Create table
                var columnCount = SourceCode.Forms.Designers.View.selectedOptions.ColumnCount.toString();
                var rowCount = SourceCode.Forms.Designers.View.selectedOptions.RowCount.toString();

                if (viewType === "CaptureList")
                {
                    SourceCode.Forms.Designers.View._generateBlankListViewLayout(columnCount);

                    _dragDrop.View.element.find('#footerControlDropPlaceHolder').on("mouseenter", function ()
                    {
                        _dragDrop.View.element.find("#footerControlDropPlaceHolder").hide();

                        var footers = _dragDrop.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                        jQuery(footers[footers.length - 1]).show();

                    });

                    jQuery('.editor-row.footer.list-view-item').on("mouseleave", function ()
                    {
                        _dragDrop.View.element.find("#footerControlDropPlaceHolder").show();

                        var footers = _dragDrop.View.element.find("#bodySection table.editor-table>tbody>tr.footer");
                        jQuery(footers[footers.length - 1]).hide();
                    });
                }
                else
                {
                    SourceCode.Forms.Designers.View._generateBlankItemViewLayout(columnCount, rowCount);
                }

                autoTable = true;

                var newDropTargets = _dragDrop.View.element.find('#editorCanvasPane .editor-table .droptarget,.editor-table.toolbar div.toolbar-droppable');

                //Drop handler when not dropping on on droppable areas
                var otherDropOptions = {
                    accept: ".draggable",
                    addClasses: false,
                    tolerance: 'pointer',
                    greedy: true,
                    drop: function (ev, ui)
                    {
                        //Check if the View has any controls exept the table
                        for (var i = 0; i < newDropTargets.length; i++)
                        {
                            if (newDropTargets[i].firstElementChild !== null)
                            {
                                if (!jQuery(newDropTargets[i]).hasClass("watermark-visible") &&
                                    !jQuery(newDropTargets[i].firstElementChild).hasClass("controlwrapper") &&
                                    !jQuery(newDropTargets[i].firstElementChild).hasClass("watermark-text"))
                                {
                                    jQuery('div.toolbar-droppable').css('display', 'none');
                                    _dragDrop.View.element.find('#toolbarSection').css('cursor', 'pointer');
                                    _dragDrop.View.element.find('#vdToolboxPane').css("cursor", "default");

                                    dropBlock.removeClass('not-droppable');
                                    methodDrag.removeClass('not-droppable');
                                    viewBlock.css('cursor', 'default');
                                    return;
                                }
                            }
                        }

                        _view.clearView(true);
                        _view.ViewDesigner._configSelectedControl($("#EditorCanvas_ViewEditorCanvas").find("[controlType = 'View']"));
                        jQuery(".home-content").droppable('destroy');
                        jQuery('div.toolbar-droppable').css('display', 'none');
                        _dragDrop.View.element.find('#toolbarSection').css('cursor', 'pointer');
                        _dragDrop.View.element.find('#vdToolboxPane').css("cursor", "default");
                        _dragDrop.View.element.find('#editableSection').removeClass('not-droppable');
                        dropBlock.removeClass('not-droppable');
                        methodDrag.removeClass('not-droppable');
                        viewBlock.css('cursor', 'default');
                    },
                    deactivate: function (ev, ui)
                    {
                        if (jQuery(".home-content").isWidget('droppable'))
                        {
                            jQuery(".home-content").droppable("option", "disabled", true);
                        }
                    },
                    hoverClass: 'hover'
                };

                if (jQuery(".home-content").isWidget('droppable'))
                {
                    jQuery(".home-content").droppable("option", "disabled", false);
                }
                else
                {
                    jQuery(".home-content").droppable(otherDropOptions);
                }

                newDropTargets.droppable(dropOptions);
            }
            else
            {
                jQuery(dropTargets).droppable(dropOptions);
            }

            methodDrag = _dragDrop.View.element.find('#bodySection, .editor-row.footer.list-view-item');
            dropBlock = _dragDrop.View.element.find("#MainNavigationPane, .home-header, .wizard-header, #PagingControl, #LayoutPaneContainer > .divider, #vdFormEventsTabGrid, #edtiorBottomPane input, #edtiorBottomPane .tab-wrapper, #ViewWizard .wizard-buttons-wrapper .button-wrapper, #SearchTextFF input, #SearchTextButton span, #SearchBarExpander, #AppStudioSearchPane #ClearSeachButton span, .home-link, .navigation-panel-buttons>ul>li>a>span, #BottomFilterMenuPanel_AppStudioFilterMenu, .steptree>li>a, #vdViewEditorToolbar>.toolbar-wrapper>a>.button-c>.button-icon, #TabBox1>.tab-box-tabs>li>a>.tab-wrapper>span, .navigation-panel-header-controls>.collapse, #AppStudioTree li>a");
            dropBlock.addClass('not-droppable');

            jQuery('.editor-row.header.list-view-item, .editor-row.list-view-item, .editor-row.dummy-row.list-view-item').css("cursor", "pointer");
            _dragDrop.View.element.find('#vdToolboxPane').css("cursor", "pointer");
            _dragDrop.View.element.find("#editableSection .controloverlay").hide();
            _dragDrop.View.element.find('#bodySection .controlwrapper').css('cursor', 'default');
            _dragDrop.View.element.find("#editableSection .controlwrapper").css('cursor', 'default');

            if (uiObj.helper.attr('itemtype') === 'method' || toolbarIsParent || footerIsparent)
            {
                if (viewType === 'CaptureList')
                {
                    methodDrag.addClass('not-droppable');

                    if (footerIsparent)
                    {
                        jQuery(".editor-row.footer.list-view-item").removeClass('not-droppable');
                        jQuery(".editor-row.list-view-item.placeholder-footer").removeClass('not-droppable');
                    }

                    if (isIE9IE10Browser)
                    {
                        _dragDrop._bindIE9CursorShow("#toolbarSection .editor-cell.droptarget", htmlElem, uiObj);
                    }
                }
                else
                {
                    if (isIE9IE10Browser)
                    {
                        _dragDrop._bindIE9CursorShow("#bodySection .drag-column.ui-draggable, #bodySection .editor-row, #toolbarSection .editor-cell.droptarget", htmlElem, uiObj);
                    }
                }
            }

            // Controls
            if (jq_target.attr("name") && isIE9IE10Browser && (!toolbarIsParent && !footerIsparent))
            {
                if (jq_target.attr("name").toUpperCase() === "TABLE")
                {
                    if (viewType === "CaptureList")
                    {
                        _dragDrop._bindIE9CursorShow("#toolbarSection .editor-cell.droptarget", htmlElem, uiObj, viewType);
                    }
                }
                else
                {
                    if (viewType === "CaptureList")
                    {
                        _dragDrop._bindIE9CursorShow("#bodySection .editor-cell.droptarget, #toolbarSection .editor-cell.droptarget td,  #toolbarSection .editor-cell.droptarget, #bodySection div.column-hover-overlay, #bodySection .drag-column.ui-draggable", htmlElem, uiObj, viewType);
                    }
                    else
                    {
                        _dragDrop._bindIE9CursorShow("#bodySection .editor-cell.droptarget, #toolbarSection .editor-cell.droptarget", htmlElem, uiObj, viewType);
                    }
                }
            }

            if (isIE9IE10Browser)
            {
                if (toolbarIsParent)
                {
                    _dragDrop._bindIE9CursorShow("#toolbarSection .editor-cell.droptarget", htmlElem, uiObj);
                }

                if (footerIsparent)
                {
                    _dragDrop._bindIE9CursorShow("#bodySection .footer .editor-cell.droptarget, #toolbarSection .editor-cell.droptarget", htmlElem, uiObj);
                }
            }

            if (uiObj.helper.attr('itemtype') === 'property' && viewType === 'CaptureList' && newDropTargets !== undefined && !isIE9IE10Browser)
            {
                _dragDrop.View.element.find('#toolbarSection').css('cursor', 'not-allowed');
            }
            else
            {
                _dragDrop.View.element.find('#toolbarSection').css('cursor', 'pointer');
            }

            if ((jq_target.hasClass("toolboxitem")) && (checkExists(jq_target.attr("itemtype"))) && (jq_target.attr("itemtype") === "property"))
            {
                _dragDrop._setupCaptureFieldDropTargets(eventObj, uiObj, isIE9IE10Browser, htmlElem);
            }

            _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable').on("mouseenter", function ()
            {
                if (viewType === "CaptureList" && !autoTable && (!(uiObj.helper.attr('itemtype') === 'method') && !toolbarIsParent && !footerIsparent) && !uiObj.helper.is('.table-control'))
                {
                    jQuery(this).removeClass('hover');
                    jQuery(this).addClass('drop-hover');
                }
            }).on("mouseleave", function ()
            {
                _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable').removeClass('drop-hover');
            });

            if (!jq_target.hasClass('toolboxitem'))
            {
                jq_target.hide();

                if (jq_target.next().hasClass('toolbar-droppable'))
                {
                    jq_target.next().remove();
                }
            }

            //[899924]
            //In this function, toolbar dropables is shown and it will cause the layout of the canvas to be changed.  
            //Thus notify the canvas widgets so they can update their positions.
            SourceCode.Forms.Designers.Common.triggerEvent("LayoutChanged");
        },

        _dropNewColumn: function (ev, ui)
        {
            var _tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
            var draggers = _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable');
            _dragDrop.isDropping = true;

            if (draggers.hasClass('drop-hover'))
            {
                var data;
                var dragtype;
                var dragger = _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable.drop-hover');
                var tableID = dragger.data('tableID');
                var draggerIndex = dragger.parent().children().index(dragger) - 1;
                var table = _dragDrop.View.element.find('#' + tableID);
                var firstRow = jQuery(table.find('>tbody>tr')[1]);
                var column = firstRow.find('>td')[draggerIndex];
                var colChange = jQuery(column);
                var position = 'after';

                if (ui.helper.hasClass('toolboxitem'))
                {
                    dragtype = 'external';
                }
                else
                {
                    dragtype = 'internal';
                }

                // The first dragger will have a 'start' class.
                if (dragger.hasClass("start"))
                {
                    position = 'before';
                    column = firstRow.find('>td')[0];
                    colChange = jQuery(column);
                }

                _tableBehavior._addColumn({ position: position, contextobject: colChange }, SourceCode.Forms.Designers.View);

                var newcolumn = firstRow.find('>td')[draggerIndex + 1];
                var newcolChange = jQuery(newcolumn);
                var section = _dragDrop.ViewDesigner._getSection(newcolChange);

                if (position === 'before')
                {
                    newcolumn = firstRow.find('>td')[0];
                    newcolChange = jQuery(newcolumn);
                    section = _dragDrop.ViewDesigner._getSection(newcolChange);
                }

                switch (ui.helper.attr('itemtype'))
                {
                    case 'method':
                        data =
                        {
                            itemtype: ui.helper.attr('itemtype'),
                            methodid: ui.helper.attr('methodid'),
                            friendlyname: ui.helper.attr('friendlyname'),
                            soid: ui.helper.attr('soid').toLowerCase(),
                            methodtype: ui.helper.attr('methodtype'),
                            dragtype: dragtype,
                            section: section.attr('id')
                        };
                        break;
                    case 'control':
                    case 'layoutcontainer':
                        data =
                        {
                            itemtype: ui.helper.attr('itemtype'),
                            friendlyname: ui.helper.attr('friendlyname'),
                            name: ui.helper.attr('name'),
                            dragtype: dragtype,
                            section: section.attr('id')
                        };
                        break;

                    case 'property':
                        data =
                        {
                            itemtype: ui.helper.attr('itemtype'),
                            references: ui.helper.attr('references'),
                            propertytype: ui.helper.attr('propertytype'),
                            propertyid: ui.helper.attr('propertyid'),
                            friendlyname: ui.helper.attr('friendlyname'),
                            soid: ui.helper.attr('soid').toLowerCase(),
                            dragtype: dragtype,
                            section: section.attr('id'),
                            addColonSuffix: _dragDrop.View.element.find("#vdaddColonSuffixChk").is(":checked")
                        };
                        break;
                }

                _dragDrop.View.element.find("#editableSection .editor-row");
                _dragDrop._CaptureListViewDrop(newcolChange, data, null, true);
                jQuery('div.toolbar-droppable').css('display', 'none');
            }
        },

        _setupCaptureFieldDropTargets: function (eventObj, uiObj, isIE9IE10Browser, htmlElem)
        {
            var viewType = _dragDrop.ViewDesigner._getViewType();
            var allowedControlsSelector = "";

            if (viewType === "Capture")
            {
                var fieldDataType = jQuery(eventObj.target).attr("propertytype");
                var allowedControlNames = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectNodes("Controls/Control[DefaultProperties/Properties/Prop[@ID='Field'] and DataTypes[DataType='" + _dragDrop.ViewDesigner._dataTypeToXmlCase(fieldDataType) + "']]/Name");
                var notAllowedControlNames = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectNodes("Controls/Control[(DefaultProperties/Properties/Prop[@ID='Field'] and DataTypes[DataType and not(DataType='" + _dragDrop.ViewDesigner._dataTypeToXmlCase(fieldDataType) + "')]) or (@category='2') or (@category='3') or (@category='7')]/Name");

                allowedControlsSelector = _dragDrop._buildFieldDropControlsSelector(allowedControlNames);
                var notAllowedControlsSelector = _dragDrop._buildFieldDropControlsSelector(notAllowedControlNames);

                jQuery(notAllowedControlsSelector).addClass("not-bindable");

                if (isIE9IE10Browser)
                {
                    if (allowedControlsSelector !== "")
                    {
                        _dragDrop._bindIE9CursorShow(allowedControlsSelector + ", #bodySection .drag-column.ui-draggable, #bodySection .editor-cell.droptarget, #toolbarSection .editor-cell.droptarget", htmlElem, uiObj);
                    }
                    else
                    {
                        _dragDrop._bindIE9CursorShow("#bodySection .drag-column.ui-draggable, #bodySection .editor-cell.droptarget, #toolbarSection .editor-cell.droptarget", htmlElem, uiObj);
                    }
                }
            }
            else if (viewType === "CaptureList")
            {
                allowedControlsSelector = "table.capturelist-editor-table .controlwrapper";
                var notAllowedControlsSelector = ".editor-table.toolbar, .editor-row.footer";

                jQuery(notAllowedControlsSelector).addClass("not-droppable");

                if (isIE9IE10Browser)
                {
                    _dragDrop._bindIE9CursorShow("#editableSection td:has('[propertyid]'), #bodySection div.column-hover-overlay, #bodySection .drag-column.ui-draggable", htmlElem, uiObj); //, #editableSection > .editor-cell.droptarget, #editableSection > controloverlay
                }
            }

            var dropTargets = jQuery(allowedControlsSelector);

            var dropOptions = {
                accept: ".draggable.toolboxitem",
                addClasses: false,
                tolerance: 'pointer',
                greedy: true,
                drop: function (ev, ui)
                {
                    ev.stopPropagation();

                    jQuery('div.toolbar-droppable').css('display', 'none');

                    var droppedFieldElem = jQuery(ui.draggable);
                    var controlDroppedOn = jQuery(this);

                    var droppedField = {
                        references: droppedFieldElem.attr("references"),
                        soid: droppedFieldElem.attr("soid"),
                        isnew: droppedFieldElem.attr("isnew"),
                        issystem: droppedFieldElem.attr("issystem"),
                        isunique: droppedFieldElem.attr("isunique"),
                        propertytype: droppedFieldElem.attr("propertytype"),
                        propertyid: droppedFieldElem.attr("propertyid"),
                        friendlyname: droppedFieldElem.attr("friendlyname"),
                        itemtype: "property"
                    };

                    _dragDrop.ViewDesigner._configSelectedControl(controlDroppedOn);

                    _dragDrop.ViewDesigner._executeControlBinding(controlDroppedOn, droppedField);
                }
            };

            var curDropTarget = null;

            for (var i = 0; i < dropTargets.length; i++)
            {
                curDropTarget = jQuery(dropTargets[i]);

                if (curDropTarget.isWidget("droppable"))
                {
                    curDropTarget.droppable("destroy");
                }
            }

            jQuery(dropTargets).droppable(dropOptions);
        },

        _bindIE9CursorShow: function (selector, htmlElem, uiObj)
        {
            var target = "";
            // Initialy set the invalid icon until the draggable element enters a valid control.
            htmlElem.on("mouseover", "#vdToolboxPane", function (e)
            {
                uiObj.helper.find(".invalid-overlay").hide();
            });

            htmlElem.on("mouseout", "#vdToolboxPane", function (e)
            {
                uiObj.helper.find(".invalid-overlay").show();
            });

            htmlElem.on("mouseleave", selector, function (e)
            {
                uiObj.helper.find(".invalid-overlay").show();
            });

            htmlElem.on("mouseenter", selector, function (e)
            {
                if (uiObj.helper.hasClass("ui-draggable-dragging"))
                {
                    target = e.toElement || e.relatedTarget;
                    uiObj.helper.find(".invalid-overlay").hide();
                }
            });
        },

        _buildFieldDropControlsSelector: function (controlNames)
        {
            var selector = "";

            for (var i = 0; i < controlNames.length; i++)
            {
                if (i === (controlNames.length - 1))
                {
                    selector = selector + ".controlwrapper[controltype='" + controlNames[i].text + "']";
                }
                else
                {
                    selector = selector + ".controlwrapper[controltype='" + controlNames[i].text + "'], ";
                }
            }

            return selector;
        },

        _startDragging: function (column, ui)
        {
            if (_dragDrop.View.CheckOut._checkViewStatus())
            {
                var width = jQuery(column[0]).width().toString();

                jQuery(".column-hover-overlay").hide();
                _dragDrop.View.element.find('#editableSection .controloverlay').hide();

                jQuery('.theme-entry.ui-draggable-dragging').css('width', width.concat('px'));
                jQuery('.theme-entry.ui-draggable-dragging').css('overflow', 'hidden');
                jQuery(".column-hover-overlay").css('opacity', '0');

                _dragDrop.View.element.find('#bodySection .controlwrapper, #footerControlDropPlaceHolder').css('cursor', 'default');
                _dragDrop.View.element.find("#editableSection .controlwrapper").css('cursor', 'default');
                _dragDrop.View.element.find("#toolbarSection").css('cursor', 'default');

                _dragDrop.View.element.find('#EditorCanvas .scroll-wrapper').css('overflow', 'hidden');

                jQuery(".drag-block").hide();
            }
            else
            {
                ui.helper.remove();
                return false;
            }
        },

        _stopDragging: function (column)
        {
            _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable').off('mouseenter mouseleave');

            jQuery(".column-hover-overlay").css('opacity', '0.3');

            _dragDrop.View.element.find('#bodySection .controlwrapper, #footerControlDropPlaceHolder').css('cursor', 'pointer');
            _dragDrop.View.element.find("#editableSection .controlwrapper").css('cursor', 'pointer');
            _dragDrop.View.element.find("#toolbarSection").css('cursor', 'pointer');

            if (checkExistsNotEmpty(column) && checkExists(_dragDrop.View.selectedObject) && _dragDrop.View.selectedObject.length > 0)
            {
                _dragDrop.ViewDesigner._columnDragDrop = true;
                _dragDrop.ViewDesigner._configSelectedControl(_dragDrop.View.selectedObject);
                _dragDrop.DesignerTable._setupColumnOverlay(jQuery(column));
            }

            _dragDrop.View.element.find("#editableSection .controloverlay").show();
        },

        _helperDragging: function (columnIndex)
        {
            var viewType = _dragDrop.ViewDesigner._getViewType();
            var dragger = _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable');

            dragger.addClass('available');

            //Hover State
            _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable.available').on("mouseenter", function ()
            {
                if (viewType === "CaptureList")
                {
                    jQuery(this).addClass("drop-column");
                }
            }).on("mouseleave", function ()
            {
                dragger.removeClass("drop-column");
            });
        },

        _makeDraggableWithoutSelect: function ($this)
        {
            if (jQuery($this).is(":visible"))
            {
                var table = _dragDrop.View.element.find('#bodySection .editor-table');
                var column;

                if ($this.hasClass('column-hover-overlay'))
                {
                    column = $this.data("cellIndex") + 1;
                } else
                {
                    column = $this.closest("td")[0].cellIndex + 1;
                }

                column = table.find('>tbody>tr:nth-child(1)>td:nth-child(' + column + ')');

                if (column.length > 0)
                {
                    var dragOptions =
                    {
                        appendTo: "body",
                        refreshPositions: false,
                        addClasses: false,
                        delay: 10,
                        scroll: false,
                        cursorAt: { left: 0, top: 0 },

                        start: function (event, ui)
                        {
                            _dragDrop.View.isDraggingHeaderColumn = true;
                            event.stopPropagation();

                            SourceCode.Forms.Designers.Common.triggerEvent("ControlDragStarted", { element: $(event.target) });

                            _dragDrop._startDragging(column, ui);
                            _dragDrop.DesignerTable._positionHandlers();
                            _dragDrop._addListViewColumnDropPlaceholders(table, column);
                        },

                        stop: function (event, ui)
                        {
                            _dragDrop._removeListViewColumnDropPlaceholders(table);
                            _dragDrop._adjustColumnHeaders(table);
                            _dragDrop.View.isDraggingHeaderColumn = false;

                            if ((checkExists(_dragDrop.View.selectedObject)) && (_dragDrop.View.selectedObject.length > 0) && (!_dragDrop.View.selectedObject.is("[controltype='View']")) && (event.srcElement !== event.target))
                            {
                                _dragDrop._stopDragging(_dragDrop.View.selectedObject);
                            }
                            else
                            {
                                _dragDrop._stopDragging();
                            }

                            _dragDrop._setColumnDragDropFalseMozilla();
                        },

                        helper: function ()
                        {
                            var headerRows = table.find(">tbody>tr:not(.placeholder-footer)");
                            var columnIndex = jQuery(headerRows[0]).children().index(column);
                            jQuery('.selectedobject').removeClass('selectedobject');

                            if (columnIndex < 0)
                            {
                                return;
                            }

                            columns = _dragDrop._getTableColumnsAtIndex(table, columnIndex);

                            _dragDrop.View.element.find('#EditorCanvas .scroll-wrapper').css('overflow', 'none');

                            var html = "<div  class='theme-entry' style='width:{0}px;margin-left:10px;background-color:white;border-style:solid;border-width:1px;border-color:#ADAE9C'><table style='width:100%'><colgroup><col style='width:100%'></colgroup><tbody>";

                            var elements = [];
                            for (var i = 0; i < columns.length; i++)
                            {
                                html += "<tr>" + jQuery(columns[i]).outerHTML() + "</tr>";
                            }

                            _dragDrop._helperDragging(columnIndex);

                            html += "</tbody></table></div>";

                            return jQuery(html);
                        }
                    };

                    $this.trigger("focus");
                    $this.draggable(dragOptions);
                }
            }
        },

        _makeColumnHeaderDraggable: function (column)
        {
            var selected = jQuery("div.column-selected-overlay");
            var columns;
            jQuery(".column-hover-overlay").hide();

            if (selected.length > 0)
            {
                if (selected.isWidget("draggable"))
                {
                    selected.draggable("destroy");
                }

                var table = column.parents("table.editor-table");

                // make the column header draggable
                var dragOptions = {
                    appendTo: "body",
                    refreshPositions: false,
                    addClasses: false,
                    delay: 10,
                    scroll: false,
                    cursorAt: { left: 0, top: 0 },

                    start: function (event, ui)
                    {
                        _dragDrop.View.isDraggingHeaderColumn = true;
                        event.stopPropagation();

                        _dragDrop._startDragging(column, ui);
                        _dragDrop.View.element.find('#editableSection .controloverlay').hide();
                        selected.hide();

                        _dragDrop.DesignerTable._positionHandlers();
                        _dragDrop._addListViewColumnDropPlaceholders(table, column);
                    },

                    stop: function (event, ui)
                    {
                        _dragDrop._removeListViewColumnDropPlaceholders(table);
                        _dragDrop._adjustColumnHeaders(table);
                        _dragDrop.View.isDraggingHeaderColumn = false;
                        _dragDrop._stopDragging(column);
                        _dragDrop._setColumnDragDropFalseMozilla();
                    },

                    helper: function ()
                    {
                        var headerRows = table.find(">tbody>tr:not(.placeholder-footer)");
                        var selectedColumn = SourceCode.Forms.Designers.View.selectedObject;
                        var columnIndex = jQuery(headerRows[0]).children().index(selectedColumn);

                        if (columnIndex < 0)
                        {
                            return;
                        }

                        columns = _dragDrop._getTableColumnsAtIndex(table, columnIndex);

                        _dragDrop.View.element.find('#EditorCanvas .scroll-wrapper').css('overflow', 'none');

                        var html = "<div  class='theme-entry' style='width:{0}px;margin-left:10px;background-color:white;border-style:solid;border-width:1px;border-color:#ADAE9C'><table style='width:100%'><colgroup><col style='width:100%'></colgroup><tbody>";

                        var elements = [];
                        for (var i = 0; i < columns.length; i++)
                        {
                            html += "<tr>" + jQuery(columns[i]).outerHTML() + "</tr>";
                        }

                        _dragDrop._helperDragging(columnIndex);

                        html += "</tbody></table></div>";

                        return jQuery(html);
                    }
                };

                selected.draggable(dragOptions);
            }
        },

        _setColumnDragDropFalseMozilla: function ()
        {
            if ($("html").hasClass("mozilla")) // SourceCode.Forms.Browser.mozilla check includes IE11
            {
                _dragDrop.ViewDesigner._columnDragDrop = false;
            }
        },

        _addListViewColumnDropPlaceholders: function (table, dragSource)
        {
            // drop options for the targets
            var dropOptions =
            {
                addClasses: false,
                tolerance: "pointer",
                drop: function (ev, ui)
                {
                    var dragger = _dragDrop.View.element.find('#bodySection .drag-column.ui-draggable.drop-column');
                    var viewDesigner = SourceCode.Forms.Designers.View.ViewDesigner;

                    if (dragger.length > 0)
                    {
                        _dragDrop._removeListViewColumnDropPlaceholders(table);
                        _dragDrop._columnHeaderDrop(table, dragSource, ev.target, dragger);
                        dragger.removeClass('drop-column');

                        table.addClass("force-refresh");
                        table.removeClass("force-refresh");
                    }
                }
            };

            jQuery('.editor-table, #bodySection .drag-column.ui-draggable').droppable(dropOptions);

            table.addClass("force-refresh");
            table.removeClass("force-refresh");
        },

        _removeListViewColumnDropPlaceholders: function (table)
        {

            var columnGroup = table.find("colgroup>col");
            var headerRows = table.find(">tbody>tr:not(.placeholder-footer)");

            // show columns that were hidden and remove the drop placeholders and spacer
            for (var i = 0; i < headerRows.length; i++)
            {
                var columns = jQuery(headerRows[i]).find(">td");
                for (var j = 0; j < columns.length; j++)
                {
                    var col = jQuery(columns[j]);
                    if (col.css("display") === "none")
                    {
                        col.show();
                    }
                    else if (col.hasClass("column-header-spacer") || col.hasClass("column-header-drop-indicator"))
                    {
                        col.remove();
                    }
                }
            }

            // remove all the drop-placeholder and spacer column group items
            for (var i = 0; i < columnGroup.length; i++)
            {
                var jqCol = jQuery(columnGroup[i]);

                if (jqCol.css("display") === "none")
                {
                    jqCol.show();
                }

                // remove any col group that is linked to the dropable-columns
                if (jqCol.hasClass("column-header-drop-indicator-col-group") || jqCol.hasClass("column-group-item-spacer"))
                {
                    jqCol.remove();
                }
            }
            //Begin fix: TFS 184767
            //Hide and show the UI in IE 8 to prevent the win32 exception
            //
            // Notes about the exception
            //// The exception can also be prevented by commenting out this method or the show and clear lines within this method
            //// I attempted to replicated the behaviour in a test project (attached to the item) with zero success
            //// I removed the hover events on the table and this also had no impact
            //// The error occurs after the entire stack that excecutes this code is exited 
            //// Its seems like some internal event fires within IE that causes the exception
            //// The event.stopPropagation fix included in http://bug.jqueryui.com/ticket/4333 Does NOT help however it makes the error occur within the stack

            if (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version <= 8)
            {
                table[0].style.display = "none";
                setTimeout(function () { table[0].style.display = ""; }, 40);
            }
            //End fix: TFS 184767
        },

        _getTableColumnsAtIndex: function (table, index)
        {
            var rows = table.find(">tbody>tr:not(.placeholder-footer)");

            var collectColumns = [];
            for (var rowIndex = 0; rowIndex < rows.length; rowIndex++)
            {
                var currentColumns = jQuery(rows[rowIndex]).find(">td");
                for (var columnIndex = 0; columnIndex < currentColumns.length; columnIndex++)
                {
                    if (columnIndex === index)
                    {
                        collectColumns.push(currentColumns[columnIndex]);
                    }
                }
            }

            if (_dragDrop.View.selectedOptions.EnableListEditing)
            {
                // if list is editable, grab editable column as well
                var editableTable = jQuery(".capturelist-editor-table");
                if (checkExists(editableTable))
                {
                    var editableRow = editableTable.find(">tbody>tr.editor-row");
                    var editableColumn = editableRow.find(">td:nth-child({0})".format(index + 1));
                    editableColumn.addClass("editable-row-column-dragsource");
                    collectColumns.push(editableColumn);
                }
            }

            return collectColumns;
        },

        _adjustColumnHeaders: function (table)
        {
            var columnGroup = table.find("colgroup>col");
            var headerColumns = jQuery(table.find(">tbody>tr")[0]).find(">td:not(.placeholder-footer)");
            for (var i = 0; i < columnGroup.length; i++)
            {
                var jqCol = jQuery(columnGroup[i]);
                var jqHeaderCol = jQuery(headerColumns[i]);

                jqCol.css("width", jqHeaderCol.attr("ColGroupItemWidth"));

                jqHeaderCol.removeAttr("ColGroupItemWidth");
            }
        },

        _columnHeaderDrop: function (table, dragSource, target, dropArea)
        {
            var rows = table.find(">tbody>tr:not(.placeholder-footer)");
            var cols = table.find(">colgroup col");

            var dropAreaIndex = dropArea.parent().children().index(dropArea);
            var columnTo = jQuery(table.find('colgroup')[0]).find('col')[dropAreaIndex];

            var fromColumnIndex = jQuery(rows[0]).children().index(dragSource);
            var toColumnIndex = table.find('colgroup').children().index(columnTo);

            if (toColumnIndex > fromColumnIndex && dropAreaIndex !== 0)
            {
                toColumnIndex = toColumnIndex - 1;
            }

            if (dropAreaIndex === 0)
            {
                toColumnIndex = toColumnIndex + 1;
            }

            if (dropArea.hasClass('start'))
            {
                toColumnIndex = 0;
            }
            else if (dropArea.hasClass("end"))
            {
                toColumnIndex = dropAreaIndex - 1;
            }

            var colToMove = table.find(">colgroup col")[fromColumnIndex];
            var colGroup = $(table.find(">colgroup"));
            var colXpath = "//Views/View/Controls/Control[@ID='" + colToMove.id + "']";
            var xmlCol = _dragDrop.View.viewDefinitionXML.selectSingleNode(colXpath);
            var xmlColGroup = _dragDrop.View.viewDefinitionXML.selectNodes("//Views/View/Controls/Control");
            var xmlControls = _dragDrop.View.viewDefinitionXML.selectSingleNode("//Views/View/Controls");

            var indexInt;
            indexInt = parseInt(toColumnIndex, 10);

            if (indexInt === 0)
            {
                colGroup.prepend(colToMove);
                xmlControls.insertBefore(xmlColGroup[indexInt], xmlCol);
            }
            else if ((indexInt + 1) === colGroup.children().length)
            {
                xmlCol.parentNode.removeChild(xmlCol);
                colGroup.append(colToMove);
                xmlControls.appendChild(xmlCol);
            }
            else
            {
                if (fromColumnIndex < toColumnIndex)
                {
                    xmlCol.parentNode.removeChild(xmlCol);
                    colGroup.children().eq(indexInt).after(colToMove);
                    xmlControls.appendChild(xmlCol);
                }
                else
                {
                    colGroup.children().eq(indexInt).before(colToMove);
                    xmlControls.insertBefore(xmlColGroup[indexInt], xmlCol);
                }
            }

            var collectedColumns = _dragDrop._getTableColumnsAtIndex(table, fromColumnIndex);
            collectedColumns.reverse();

            // now move the columns to their new location
            for (var rowIndex = 0; rowIndex < rows.length; rowIndex++)
            {
                var currentColumns = jQuery(rows[rowIndex]).find(">td");
                for (var columnIndex = 0; columnIndex < currentColumns.length; columnIndex++)
                {
                    var jCurrentColumn = jQuery(currentColumns[columnIndex]);

                    if (!jCurrentColumn.hasClass("editable-row-column-dragsource"))
                    {
                        if (columnIndex === toColumnIndex)
                        {
                            if (fromColumnIndex < toColumnIndex)
                            {
                                jCurrentColumn.after(collectedColumns.pop());
                            }
                            else
                            {
                                jCurrentColumn.before(collectedColumns.pop());
                            }
                        }
                    }
                }
            }

            var columnMoved = jQuery(rows[0]).find('td')[toColumnIndex];

            // if one is left
            if (collectedColumns.length === 1)
            {
                var editableTable = jQuery(".capturelist-editor-table");
                if (checkExists(editableTable))
                {
                    var editableRow = editableTable.find(">tbody>tr.editor-row");
                    var pivotColumn = editableRow.find(">td:nth-child({0})".format(parseInt(toColumnIndex) + 1));
                    var movedColumn = jQuery(collectedColumns.pop());
                    movedColumn.removeClass("editable-row-column-dragsource");
                    if (fromColumnIndex < parseInt(toColumnIndex))
                    {
                        pivotColumn.after(movedColumn);
                        movedColumn.show();
                    }
                    else
                    {
                        pivotColumn.before(movedColumn);
                        movedColumn.show();
                    }
                }
            }

            setTimeout((function ()
            {
                _dragDrop.DesignerTable._setupColumnOverlay(_dragDrop.View.selectedObject);
            }), 50);

            // if the list is editable, we need to adjust the editable section as well
            _dragDrop._adjustColumnHeaders(table);
            if (_dragDrop.ViewDesigner._getViewType() === "CaptureList")
            {
                _dragDrop.DesignerTable._synchronizeEditableColumns();
            }

            _dragDrop.DesignerTable._positionHandlers();

            SourceCode.Forms.Designers.View.ViewDesigner._BuildViewXML();
            _dragDrop.DesignerTable._setupColumnOverlay(jQuery(columnMoved));
            SourceCode.Forms.Designers.View.ViewDesigner._configSelectedControl(jQuery(columnMoved));
            SourceCode.Forms.Designers.View.ViewDesigner.controlSelected = true;
            if (checkExists(_dragDrop.View.selectedObject) && _dragDrop.View.selectedObject.length > 0)
            {
                _dragDrop.ViewDesigner._configurePropertiesTab(_dragDrop.View.selectedObject);
            }
        },

        _ensureCorrectAssociationPropertyName: function (propertyName)
        {
            // trim leading and trailing spaces
            var result = propertyName.trim();

            if (result.length > 2)
            {
                // camel case string
                result = result
                // insert a space between lower & upper
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                // space before last upper in a sequence followed by lower
                .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
                // uppercase the first character
                .replace(/^./, function (str) { return str.toUpperCase(); });

                // if last characters equals ID, replace
                var len = result.length;

                if (len > 2 && ((result.substring(len - 3, len).toUpperCase() === " ID") || (result.substring(len - 2, len).toUpperCase() === "ID")))
                {
                    result = result.substring(0, len - 2);
                    result = result.trim();
                }

                //convert any underscores to spaces
                while (result.indexOf("_") > -1)
                {
                    result = result.replace("_", " ");
                    result = result.trim();
                }
            }
            return result;
        }
    };
})(jQuery);
