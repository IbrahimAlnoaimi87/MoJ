(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    SourceCode.Forms.StyleHelper =
    {
        getPrimaryStyleNode: function (stylesCollection)
        {
            var node = stylesCollection.selectSingleNode("Style[@IsDefault='True']");
            if (!node)
            {
                if (typeof stylesCollection.ownerDocument !== "undefined")
                {
                    node = stylesCollection.ownerDocument.createElement("Style");
                }
                else if (typeof stylesCollection.createElement !== "undefined")
                {
                    node = stylesCollection.createElement("Style");
                }
                node.setAttribute("IsDefault", "True");

                stylesCollection.appendChild(node);
            }
            return node;
        },

        getStyleByName: function (stylesCollection, styleName)
        {
            var styleNode = stylesCollection.selectSingleNode("Style[Name='{0}']".format(styleName));
            if (!styleNode)
            {
                var xmlDoc = null;

                if (typeof stylesCollection.ownerDocument !== "undefined")
                {
                    xmlDoc = stylesCollection.ownerDocument;
                    styleNode = stylesCollection.ownerDocument.createElement("Style");
                }
                else if (typeof stylesCollection.createElement !== "undefined")
                {
                    xmlDoc = stylesCollection;
                    styleNode = stylesCollection.createElement("Style");
                }

                styleNode = xmlDoc.createElement("Style");

                var nameNode = xmlDoc.createElement("Name");

                nameNode.appendChild(xmlDoc.createTextNode(styleName));

                styleNode.appendChild(nameNode);
                stylesCollection.appendChild(styleNode);
            }
            return styleNode;
        },

        getMergedStyle: function (cleanedDefault, userStyle)
        {
            var o =
                {
                    toNode: userStyle,
                    fromNode: cleanedDefault,
                    identifyingPath: "Styles/Style",
                    identifyingAttributes: ["IsDefault"],
                    identifyingNodes: ["Name"]
                }
            MergeXmlNodes(o);
        },

        getStylesDelta: function (cleanedDefault, mergedStyle)
        {
            var o =
                {
                    toNode: cleanedDefault,
                    fromNode: mergedStyle,
                    identifyingPath: "Styles/Style",
                    identifyingAttributes: ["IsDefault"],
                    identifyingNodes: ["Name"]
                }
            var delta = FindXmlDelta(o);
            return delta;

        },

        getStylesDeltas: function (parentNode, controlXpath)
        {
            var definitionXml = (parentNode.ownerDocument) ? parentNode.ownerDocument : parentNode;
            var controlNodes = parentNode.selectNodes(controlXpath);
            for (var i = 0; i < controlNodes.length; i++)
            {
                var controlType = controlNodes[i].getAttribute("Type");
                var customStylesCollection = controlNodes[i].selectSingleNode("Styles");
                if (checkExists(customStylesCollection))
                {
                    var defaultStylesCollection = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlType + '"]/Styles');
                    var delta = SCStyleHelper.getStylesDelta(defaultStylesCollection, customStylesCollection);
                    controlNodes[i].removeChild(customStylesCollection);

                    if (checkExists(delta))
                    {
                        controlNodes[i].appendChild(delta.cloneNode(true));
                    }
                }
                var conditionalStylesNodes = controlNodes[i].selectNodes("ConditionalStyles/ConditionalStyle/Styles");
                for (var j = 0; j < conditionalStylesNodes.length; j++)
                {
                    SCStyleHelper.getStylesDelta(defaultStylesCollection, conditionalStylesNodes[j]);
                }
            }
        },

        getMergedStyles: function (parentNode, controlXpath)
        {
            var definitionXml = (parentNode.ownerDocument) ? parentNode.ownerDocument : parentNode;
            var controlNodes = parentNode.selectNodes(controlXpath);
            for (var i = 0; i < controlNodes.length; i++)
            {
                var controlType = controlNodes[i].getAttribute("Type");
                var customStylesCollection = controlNodes[i].selectSingleNode("Styles");
                if (!checkExists(customStylesCollection))
                {
                    customStylesCollection = definitionXml.createElement("Styles");
                    controlNodes[i].appendChild(customStylesCollection);
                }
                var defaultStylesCollection = SourceCode.Forms.Designers.Common.controlDefinitionsXml.selectSingleNode('Controls/Control[Name = "' + controlType + '"]/Styles');
                SCStyleHelper.getMergedStyle(defaultStylesCollection, customStylesCollection);

                var conditionalStylesNodes = controlNodes[i].selectNodes("ConditionalStyles/ConditionalStyle/Styles");
                for (var j = 0; j < conditionalStylesNodes.length; j++)
                {
                    SCStyleHelper.getMergedStyle(defaultStylesCollection, conditionalStylesNodes[j]);
                }
            }
        },

        tempXml: function ()
        {
            if (!(SCStyleHelper._temporaryXml))
            {
                SCStyleHelper._temporaryXml = parseXML("<Temp/>");
            }
            else
            {
                //clean the tempxml
                var docElem = SCStyleHelper._temporaryXml.documentElement;
                var childNodes = docElem.childNodes;
                while (childNodes.length > 0)
                {
                    docElem.removeChild(childNodes[0]);
                }

            }
            return SCStyleHelper._temporaryXml;
        },

        _getPropertyTypeStylesAjax: function ()
        {
            //safety check preventing hundreds of popups
            var acceptableWaitPeriod = 1000;
            if (checkExists(SCStyleHelper.propertyTypeStylesError) && (new Date() - SCStyleHelper.propertyTypeStylesError) < acceptableWaitPeriod)
            {
                return null;
            }
            else if (checkExists(SCStyleHelper.propertyTypeStylesError))
            {
                //reset timer
                SCStyleHelper.propertyTypeStylesError = null;
            }

            $.ajax(
                {
                    data:
                        {
                            method: "getPropertyTypeStyles"
                        },
                    async: false,
                    dataType: 'xml',
                    url: applicationRoot + 'Utilities/AJAXCall.ashx',
                    error: function (xmlHttpRequest, textStatus, errorThrown)
                    {
                        popupManager.showError('<p>{0}</p><p>[{1}] {2} ({3}) </p>'.format(Resources.RuntimeMessages.PropertyTypesFailedToLoad, xmlHttpRequest.status, xmlHttpRequest.statusText, textStatus));
                        SCStyleHelper.propertyTypeStylesError = new Date();
                    }.bind(this),
                    success: function (data, textStatus, xmlHttpRequest)
                    {
                        if (SourceCode.Forms.ExceptionHandler.handleException(data))
                        {
                            SCStyleHelper.propertyTypeStylesError = new Date();
                        }
                        SCStyleHelper.propertyTypeStyles = data;
                    }.bind(this)
                });
        },

        PropertyTypeStyles: function ()
        {
            if (!checkExists(SCStyleHelper.propertyTypeStyles))
            {
                SCStyleHelper._getPropertyTypeStylesAjax();
            }
            return SCStyleHelper.propertyTypeStyles;
        }
    };

    if (typeof SCStyleHelper === "undefined") SCStyleHelper = SourceCode.Forms.StyleHelper;

})(jQuery);
