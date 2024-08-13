function MailMappingWidget()
{

}

MailMappingWidget.prototype =
{
    initialize: function (contentElement)
    {
        this.container = contentElement;
        this.instanceid = String.generateGuid();
        this._buildUI();
    },

    dispose: function ()
    {
        this.container.find(".pane-container").panecontainer("destroy");
        this.container.empty();
    },

    createMapping: function (targetName, value)
    {
        var mapping =
            '<Mapping ActionPropertyCollection="Parameters">' +
                '<Item ' +
                    'ContextType="target" ' +
                    'ItemType="MailProperty" ' +
                    'Name="' + targetName + '" ' +
                '/>' +
                '<Item ContextType="value">' +
                    value +
                '</Item>' +
            '</Mapping>';

        return mapping;
    },

    _getMapping: function (targetName, value)
    {
        if (checkExists(value) && value !== "")
            return this.createMapping(targetName, value);
        else
            return "";
    },

    getConfigurationXML: function ()
    {

        var checkNumFromEmails = this._checkNumEmails($("#" + this.instanceid + "_from").tokenbox("value"));
        var checkFromVal = this._validateEmailValue($("#" + this.instanceid + "_from").tokenbox("value"));
        var checkToVal = this._validateEmailValue($("#" + this.instanceid + "_to").tokenbox("value"));
        var checkCCVal = this._validateEmailValue($("#" + this.instanceid + "_cc").tokenbox("value"));
        var checkBCCVal = this._validateEmailValue($("#" + this.instanceid + "_bcc").tokenbox("value"));

        if (checkFromVal === "token")
        {
            var checkNumFromEmails = this._checkNumTokens($("#" + this.instanceid + "_from").tokenbox("value"));
        }
        else
        {
            var checkNumFromEmails = this._checkNumEmails($("#" + this.instanceid + "_from").tokenbox("value"));
        }

        if (($("#" + this.instanceid + "_from").tokenbox("value").length === 0))
        {
            popupManager.showWarning(Resources.RuleDesigner.MailMappingWidgetFromAddressRequired);
            return false;
        }
        else if ($("#" + this.instanceid + "_from").tokenbox("value").length !== 0)
        {

            if ((checkFromVal === "invalid") || (checkNumFromEmails > 1))
            {
                popupManager.showWarning(Resources.RuleDesigner.MailMappingWidgetFromAddressRequired);
                return false;
            }
        }

        if (($("#" + this.instanceid + "_to").tokenbox("value").length === 0) && ($("#" + this.instanceid + "_cc").tokenbox("value").length === 0) && ($("#" + this.instanceid + "_bcc").tokenbox("value").length === 0))
        {
            popupManager.showWarning(Resources.RuleDesigner.MailMappingWidgetRecipientRequired);
            return false;

        }

        if ($("#" + this.instanceid + "_to").tokenbox("value").length !== 0)
        {
            if (checkToVal === "invalid")
            {
                popupManager.showWarning(Resources.RuleDesigner.MailMappingWidgetToInvalid);
                return false;
            }
        }

        if ($("#" + this.instanceid + "_cc").tokenbox("value").length !== 0)
        {
            if (checkCCVal === "invalid")
            {
                popupManager.showWarning(Resources.RuleDesigner.MailMappingWidgetCCInvalid);
                return false;
            }
        }

        if ($("#" + this.instanceid + "_bcc").tokenbox("value").length !== 0)
        {
            if (checkBCCVal === "invalid")
            {
                popupManager.showWarning(Resources.RuleDesigner.MailMappingWidgetBCCInvalid);
                return false;
            }
        }

        if ($("#" + this.instanceid + "_subject").tokenbox("value").length === 0)
        {
            popupManager.showWarning(Resources.RuleDesigner.MailMappingWidgetSubjectRequired);
            return false;
        }

        var MessageXML = "<Mappings>";

        // From Field Mapping
        MessageXML += this._getMapping("FROM", this._toSourceValueXML($("#" + this.instanceid + "_from").tokenbox("value")));
        // End of From Field Mapping

        // To Field Mapping
        MessageXML += this._getMapping("TO", this._toSourceValueXML($("#" + this.instanceid + "_to").tokenbox("value")));
        // End of To Field Mapping

        // CC Field Mapping
        MessageXML += this._getMapping("CC", this._toSourceValueXML($("#" + this.instanceid + "_cc").tokenbox("value")));
        // End of CC Field Mapping

        // BCC Field Mapping
        MessageXML += this._getMapping("BCC", this._toSourceValueXML($("#" + this.instanceid + "_bcc").tokenbox("value")));
        // End of BCC Field Mapping

        // Attachment Field Mapping
        MessageXML += this._getMapping("ATTACHMENT", this._toSourceValueXML($("#" + this.instanceid + "_attachment").tokenbox("value")));
        // End of Attachment Field Mapping

        // Subject Field Mapping
        MessageXML += this._getMapping("SUBJECT", this._toSourceValueXML($("#" + this.instanceid + "_subject").tokenbox("value")));
        // End of Subject Field Mapping

        // Body Field Mapping
        MessageXML += this._getMapping("BODY", this._toSourceValueXML($("#" + this.instanceid + "_mailbody").tokenbox("value")));
        // End of Body Field Mapping 

        MessageXML += "</Mappings>";

        return MessageXML;
    },

    setConfigurationXml: function (message)
    {
        if (message !== undefined && message !== null && message !== "")
        {
            var mappingsDoc = $.parseXML(message), self = this;

            $("Mapping", mappingsDoc).each(function ()
            {
                var target = $(this).children("Item[ContextType=target]");
                var value = $(this).children("Item[ContextType=value]");
                var contextItem = this.selectSingleNode("Item[@ContextType='context']");

                var tbval = [];
                var dataobj = { type: "context", data: {} };

                if (checkExists(contextItem))
                {
                    var contextId = (contextItem.getAttribute("Guid")) ? contextItem.getAttribute("Guid") : contextItem.getAttribute("Name");
                    var sourceID = contextItem.getAttribute("SourceID");
                    var sourcePath = contextItem.getAttribute("SourcePath");
                    var subformsId = (contextItem.getAttribute("SubFormID")) ? contextItem.getAttribute("SubFormID") : null;
                    if (subformsId === "00000000-0000-0000-0000-000000000000")
                    {
                        subformsId = null;
                    }
                    var instanceId = (contextItem.getAttribute("InstanceID")) ? contextItem.getAttribute("InstanceID") : null;
                    if (instanceId === "00000000-0000-0000-0000-000000000000")
                    {
                        instanceId = null;
                    }
                    draggingNode = self.basicTargetContextCanvas.targetContextCanvas("getDraggingNode", { id: contextId, SourceID: sourceID, SourcePath: sourcePath, SubFormID: subformsId, InstanceID: instanceId });
                    if (!checkExists(draggingNode))
                    {
                        draggingNode = self.basicTargetContextCanvas.targetContextCanvas("getContextNode", { document: self.contextsXml, item: contextItem });
                    }

                    // This section was added for the items that need to be partially loaded
                    if (!checkExists(draggingNode))
                    {
                        var parentMetadata = { id: sourcePath, SubFormID: subformsId, InstanceID: instanceId };
                        var childMetadata = { id: contextId, SourceID: sourceID, SourcePath: sourcePath, SubFormID: subformsId, InstanceID: instanceId }
                        draggingNode = self.basicTargetContextCanvas.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);
                    }
                    // This section was added for the items that need to be partially loaded

                    if (!checkExists(draggingNode))
                    {
                        dataobj.data["icon"] = "error";
                        dataobj.text = Resources.ExpressionBuilder.UnresolvedObjectText.format(Resources.ObjectNames.ItemSingular);
                    }
                    else
                    {
                        dataobj.text = draggingNode.text;
                        dataobj.data = draggingNode.data;
                    }

                    tbval.push(dataobj);
                }
                else if (value.children().length > 0)
                {
                    value.find("Item").each(function ()
                    {
                        if ($(this).attr("ContextType") === "value")
                        {
                            tbval.push({ type: "value", data: (this.firstChild !== null) ? this.firstChild.nodeValue : "", text: (this.firstChild !== null) ? this.firstChild.nodeValue : "" });
                        }
                        else
                        {
                            dataobj = { type: "context", data: {} };
                            $.each(this.attributes, function ()
                            {
                                if (this.name !== "ContextType")
                                    dataobj.data[this.name] = this.value;
                                if (this.name === "Name")
                                    dataobj.text = this.value;
                            });

                            var contextXPath = "//node";
                            var attributes = ["id", "Name", "SourceID", "SourcePath", "ItemType", "Guid", "InstanceID", "SubFormID"];

                            $.each(dataobj.data, function (attribute, value)
                            {
                                if (attributes.contains(attribute))
                                {
                                    if (attribute !== "Name")
                                    {
                                        contextXPath += "[@" + attribute + "='" + value + "']";
                                    }
                                    else
                                    {
                                        if (attribute === "Name" && dataobj.data.ItemType === "ViewField")
                                        {
                                            return;
                                        }

                                        var valLowerCase = value.toLowerCase();
                                        contextXPath += "[translate(@" + attribute + ",'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='" + valLowerCase + "']";
                                    }
                                }
                            });

                            var contextNode = self.contextsXml.selectSingleNode(contextXPath);

                            if (checkExists(contextNode))
                            {

                                $.each(contextNode.attributes, function (k, v) { dataobj.data[v.nodeName] = v.nodeValue; });
                                dataobj.text = dataobj.data["DisplayName"] || dataobj.data["text"];
                            }
                            else
                            {
                                if (contextNode === null && (dataobj.data.ItemType === "ControlProperty" || dataobj.data.ItemType === "ControlField"))
                                {
                                    if (checkExists(dataobj.data.InstanceID) && dataobj.data.InstanceID === "00000000-0000-0000-0000-000000000000")
                                    {
                                        dataobj.data.InstanceID = null;
                                    }

                                    if (checkExists(dataobj.data.SubFormID) && dataobj.data.SubFormID === "00000000-0000-0000-0000-000000000000")
                                    {
                                        dataobj.data.SubFormID = null;
                                    }

                                    var parentMetadata = { id: dataobj.data.SourcePath, SubFormID: dataobj.data.SubFormID, InstanceID: dataobj.data.InstanceID };
                                    var childMetadata = { id: dataobj.data.id, SourceID: dataobj.data.SourceID, SourcePath: dataobj.data.SourcePath, SubFormID: dataobj.data.SubFormID, InstanceID: dataobj.data.InstanceID };
                                    draggingNode = self.basicTargetContextCanvas.targetContextCanvas("getPartialDraggingNode", parentMetadata, childMetadata);

                                    if (draggingNode !== null)
                                    {
                                        dataobj.text = draggingNode.text;
                                        dataobj.data = draggingNode.data;
                                    }
                                    else
                                    {
                                        dataobj.data["icon"] = "error";
                                        dataobj.text = Resources.ExpressionBuilder.UnresolvedObjectText.format(Resources.ObjectNames.ItemSingular);
                                    }
                                }
                                else
                                {
                                    dataobj.data["icon"] = "error";
                                    dataobj.text = Resources.ExpressionBuilder.UnresolvedObjectText.format(Resources.ObjectNames.ItemSingular);
                                }
                            }

                            tbval.push(dataobj);
                        }
                    });
                }
                else
                {
                    if (value[0] !== null && value[0].firstChild !== null)
                    {
                        tbval.push({ type: "value", data: (value[0].firstChild !== null) ? value[0].firstChild.nodeValue : "", text: (value[0].firstChild !== null) ? value[0].firstChild.nodeValue : "" });
                    }
                }

                switch (target.attr("Name"))
                {
                    case "FROM":
                        $("#" + self.instanceid + "_from").tokenbox("value", tbval);
                        break;
                    case "TO":
                        $("#" + self.instanceid + "_to").tokenbox("value", tbval);
                        break;
                    case "CC":
                        $("#" + self.instanceid + "_cc").tokenbox("value", tbval);
                        break;
                    case "BCC":
                        $("#" + self.instanceid + "_bcc").tokenbox("value", tbval);
                        break;
                    case "ATTACHMENT":
                        $("#" + self.instanceid + "_attachment").tokenbox("value", tbval);
                        break;
                    case "SUBJECT":
                        $("#" + self.instanceid + "_subject").tokenbox("value", tbval);
                        break;
                    case "BODY":
                        $("#" + self.instanceid + "_mailbody").tokenbox("value", tbval);
                        break;
                }

            });
        }
    },

    _buildUI: function ()
    {
        var pcoptions = {
            orientation: "vertical",
            panes: [
                { id: this.instanceid + "_mailheader_pane", height: "192px" },
                { id: this.instanceid + "_mailbody_pane", minheight: "180px" }
            ],
            showDividers: false
        };

        var pc = $(SourceCode.Forms.Controls.PaneContainer.html(pcoptions)).appendTo(this.container).panecontainer();

        var h = parseInt($("#" + this.instanceid + "_mailbody_pane").prev().css("top")) + $("#" + this.instanceid + "_mailbody_pane").prev().height();

        window.setTimeout(function () { $("#" + this.instanceid + "_mailbody_pane").css("top", h + "px"); }.bind(this), 1000);

        // Mail Header Section
        var mhpanelopts = {
            fullsize: true,
            header: Resources.RuleDesigner.MailMappingWidgetMailHeaderPanelTitle
        };

        $("#" + this.instanceid + "_mailheader_pane").append(SourceCode.Forms.Controls.Panel.html(mhpanelopts));

        var pbw = $("#" + this.instanceid + "_mailheader_pane .panel .panel-body-wrapper > .wrapper");

        var fromFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MailMappingWidgetFromLabel, required: true })).appendTo(pbw);
        var toFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MailMappingWidgetToLabel, required: false })).appendTo(pbw);
        var ccFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MailMappingWidgetCCLabel, required: false })).appendTo(pbw);
        var bccFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MailMappingWidgetBCCLabel, required: false })).appendTo(pbw);
        var attFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MailMappingWidgetAttachmentLabel, required: false })).appendTo(pbw);
        var subjFF = $(SourceCode.Forms.Controls.FormField.html({ label: Resources.RuleDesigner.MailMappingWidgetSubjectLabel, required: true })).appendTo(pbw);

        $("<input type=\"text\" id=\"" + this.instanceid + "_from\" class=\"token-input\" />").appendTo(fromFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });
        $("<input type=\"text\" id=\"" + this.instanceid + "_to\" class=\"token-input\" />").appendTo(toFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });
        $("<input type=\"text\" id=\"" + this.instanceid + "_cc\" class=\"token-input\" />").appendTo(ccFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });
        $("<input type=\"text\" id=\"" + this.instanceid + "_bcc\" class=\"token-input\" />").appendTo(bccFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });
        $("<input type=\"text\" id=\"" + this.instanceid + "_attachment\" class=\"token-input\" />").appendTo(attFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });
        $("<input type=\"text\" id=\"" + this.instanceid + "_subject\" class=\"token-input\" />").appendTo(subjFF.children(".form-field-element-wrapper")).tokenbox({ accept: ".ui-draggable", watermark: Resources.RuleDesigner.WatermarkMessage });

        // Mail Body Section
        var html = $("#" + this.instanceid + "_mailbody").tokenbox("source");
        $("#" + this.instanceid + "_mailbody_pane").append("<textarea id=\"" + this.instanceid + "_mailbody\" cols=\"\" rows=\"\"></textarea>");
        $("#" + this.instanceid + "_mailbody").tokenbox({ accept: ".ui-draggable", wysiwyg: { enabled: false }, multiline: true, watermark: Resources.RuleDesigner.WatermarkMessage });
        $("#" + this.instanceid + "_mailbody").next(".token-input").addClass("full-size");
        $("#" + this.instanceid + "_mailbody").tokenbox("source", html);
        $("#" + this.instanceid + "_mailbody").tokenbox("stripstyling");

    },

    _switchWysiwygMode: function (ev)
    {
        var html = $("#" + this.instanceid + "_mailbody").tokenbox("source");

        $("#" + this.instanceid + "_mailbody").tokenbox("destroy");

        if ($(ev.target).val() === "html")
        {
            $("#" + this.instanceid + "_mailbody").tokenbox({ accept: ".ui-draggable", wysiwyg: { enabled: true }, multiline: true });
            $("#" + this.instanceid + "_mailbody").tokenbox("source", html);
        }
        else
        {
            $("#" + this.instanceid + "_mailbody").tokenbox({ accept: ".ui-draggable", wysiwyg: { enabled: false }, multiline: true });
            $("#" + this.instanceid + "_mailbody").next(".token-input").addClass("full-size");
            $("#" + this.instanceid + "_mailbody").tokenbox("source", html);
            $("#" + this.instanceid + "_mailbody").tokenbox("stripstyling");
        }
    },

    _checkNumEmails: function (valobj)
    {

        var result = "";

        $.each(valobj, function (k, v)
        {
            if (v.type === "value")
            {
                result += v.data;
            }

        });
        result = result.replace(/\s+/g, '');
        var checkSemiColon = result.indexOf(";");
        var checkComma = result.indexOf(",");
        if (checkSemiColon !== -1)
        {
            var emails = result.split(";");
            var numEmails = emails.length;
        }
        else if (checkComma !== -1)
        {
            var emails = result.split(",");
            var numEmails = emails.length;
        }
        else
        {
            var emails = "";
            var numEmails = 1;
        }


        return numEmails;
    },

    _checkNumTokens: function (valobj)
    {
        var result = "";
        var tokenYN = false;
        var countTokens = 0;

        $.each(valobj, function (k, v)
        {
            if (v.type === "value")
            {
                result += v.data;
            }
            else if (v.type === "context")
            {
                tokenYN = true;
                countTokens += 1;
            }
        });
        return countTokens;
    },

    _validateEmailValue: function (valobj)
    {
        var emailfilter = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        var result = "";
        var tokenYN = false;
        var countTokens = 0;
        var getTrueFalse = "";
        var i = 0
        var commasCorrect = 0;
        var countCommas = 0;
        var checkLastChar = "";

        $.each(valobj, function (k, v)
        {
            if (v.type === "value")
            {
                result += v.data;
            }
            else if (v.type === "context")
            {
                result += v.type + "@";
                tokenYN = true;
                countTokens += 1;
            }
        });

        if (tokenYN === false)
        {
            result = result.replace(/\s+/g, '');
            var checkSemiColon = result.indexOf(";");
            var checkComma = result.indexOf(",");

            if (checkSemiColon !== -1)
            {
                getTrueFalse = "invalid";
                var emails = "";
                var numEmails = 0;
            }
            else if (checkComma !== -1)
            {
                checkLastChar = result.charAt(result.length - 1);
                var emails = result.split(",");
                var numEmails = emails.length;
                commasCorrect = numEmails - 1;
                countCommas = (result.match(/,/g) || []).length;

                if ((countCommas === commasCorrect) && (checkLastChar !== ","))
                {
                    if (numEmails > 1)
                    {
                        for (i = 0; i < numEmails; i++)
                        {
                            var emailCheck = emailfilter.test(emails[i]);
                            if (emailCheck === false)
                            {
                                getTrueFalse = "invalid";
                                break;
                            }
                            else
                            {
                                getTrueFalse = "valid";
                            }
                        }
                    }
                    else
                    {
                        getTrueFalse = "invalid";
                    }
                }
                else
                {
                    getTrueFalse = "invalid";
                }
            }
            else
            {
                var emails = "";
                var numEmails = 1;
                var emailCheck = emailfilter.test(result);
                if (emailCheck === false)
                {
                    getTrueFalse = "invalid";
                }
                else
                {
                    getTrueFalse = "valid";
                }
            }

        }
        else if ((tokenYN === true) && (result !== ""))
        {
            result = result.replace(/\s+/g, '');
            var checkSemiColon = result.indexOf(";");
            var checkComma = result.indexOf(",");
            if (checkSemiColon !== -1)
            {
                getTrueFalse = "invalid";
                var emails = "";
                var numEmails = 0;
            }
            else if (checkComma !== -1)
            {
                checkLastChar = result.charAt(result.length - 1);
                var emails = result.split(",");
                var numEmails = emails.length;
                commasCorrect = numEmails - 1;
                countCommas = (result.match(/,/g) || []).length;

                if ((countCommas === commasCorrect) && (checkLastChar !== ","))
                {
                    if (numEmails > 1)
                    {
                        for (i = 0; i < numEmails; i++)
                        {
                            var emailCheck = emailfilter.test(emails[i]);
                            if (emailCheck === false)
                            {
                                if (emails[i] !== "context@")
                                {
                                    getTrueFalse = "invalid";
                                    break;
                                }
                                else
                                {
                                    getTrueFalse = "valid";
                                }
                            }
                            else
                            {
                                getTrueFalse = "valid";
                            }
                        }
                    }
                    else
                    {
                        getTrueFalse = "invalid";
                    }
                }
                else
                {
                    getTrueFalse = "invalid";
                }
            }
            else
            {
                var emails = "";
                var numEmails = 1;
                var emailCheck = emailfilter.test(result);
                if (emailCheck === false)
                {
                    if (result !== "context@")
                    {
                        getTrueFalse = "invalid";
                    }
                    else
                    {
                        getTrueFalse = "valid";
                    }
                }
                else
                {
                    getTrueFalse = "valid";
                }
            }

        }
        else if ((tokenYN === true) && (result === "context") && (countTokens === 1))
        {
            getTrueFalse = "token";
        }
        else
        {
            getTrueFalse = "invalid";
        }

        return getTrueFalse;
    },

    _toSourceValueXML: function (valobj)
    {
        var result = "";

        if (valobj.length > 0)
        {

            result = "<SourceValue>";

            $.each(valobj, function (k, v)
            {
                if (v.type === "value")
                {
                    result += "<Item ContextType=\"value\"><![CDATA[" + v.data + "]]></Item>";
                }
                else
                {
                    result += "<Item ContextType=\"context\"";

                    $.each(v.data, function (l, w)
                    {
                        result += " " + l + "=\"" + w.toString().xmlEncode() + "\"";
                    });

                    result += " />";
                }
            });

            result += "</SourceValue>";

        }

        return result;
    }
};
