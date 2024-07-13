<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:exslt="http://exslt.org/common"
	xmlns:msxsl="urn:schemas-microsoft-com:xslt"
	exclude-result-prefixes="exslt msxsl">

    <xsl:output method="xml" indent="no"/>

    <xsl:output omit-xml-declaration="yes"/>

    <xsl:param name="Controls"/>
    <xsl:param name="Expressions"/>
    <xsl:param name="Fields"/>
    <xsl:param name="Methods"/>
    <xsl:param name="Parameters"/>
    <xsl:param name="InputProperties"/>
    <xsl:param name="ReturnProperties"/>
    <xsl:param name="SubFormID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:param name="Display" />
    <xsl:param name="Edit" />
    <xsl:param name="Header" />
    <xsl:param name="Footer" />
    <xsl:param name="NoItemsToDisplay">No items to display</xsl:param>
    <xsl:param name="ControlMethodProperties" />
    <xsl:param name="ControlMethodResult" />
    <xsl:param name="InstanceID" />
    <xsl:param name="SubFormInstanceID" />
    <xsl:param name="objectDraggable">false</xsl:param>
    <xsl:param name="TitleSystemName"/>
    <xsl:param name="TitleDescription"/>

    <xsl:template match="/">

        <!-- Form plugin -->
        <xsl:apply-templates select="/Items/Item[@ItemType='Form']">
            <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
        </xsl:apply-templates>

        <!-- View plugin -->
        <xsl:apply-templates select="/Items/Item[@ItemType='View']">
            <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
        </xsl:apply-templates>

        <!-- Object plugin -->
        <xsl:apply-templates select="/Items/Item[@ItemType='Object']">
            <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
        </xsl:apply-templates>

        <!-- Process plugin -->
        <xsl:apply-templates select="/Items/Item[@ItemType='ProcessFolder']">
            <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
        </xsl:apply-templates>

        <!-- Control Properties and Control Fields-->
        <xsl:apply-templates select="/Items[Item[(@ItemType='ControlProperty' or @ItemType='ControlField') and not(@Visibility='None')]]" mode="partial">

        </xsl:apply-templates>
    </xsl:template>


    <!-- Form Template -->
    <xsl:template match="Item[@ItemType='Form']">
        <xsl:variable name="InstanceID" select="InstanceID"></xsl:variable>
        <xsl:variable name="SubFormInstanceID" select="SubFormInstanceID"></xsl:variable>
        <xsl:element name="node">
            <xsl:attribute name="text">
                <xsl:value-of select="DisplayName"/>
            </xsl:attribute>
            <xsl:call-template name="AddTitleAttribute">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:text>form not-draggable</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:value-of select="@Guid"/>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:choose>
                <xsl:when test="Items/Item">
                    <xsl:if test="Items/Item[@ItemType='ControlProperty']">
                        <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty']" mode="category">
                            <xsl:with-param name="InstanceID" select="$InstanceID" />
                            <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                        </xsl:apply-templates>
                    </xsl:if>
                    <xsl:if test="Items/Item[@ItemType='FormParameter']">
                        <xsl:element name="node">
                            <xsl:attribute name="icon">
                                <xsl:text>parameters not-draggable</xsl:text>
                            </xsl:attribute>
                            <xsl:attribute name="text">
                                <xsl:value-of select="$Parameters"/>
                            </xsl:attribute>
                            <xsl:apply-templates select="Items/Item[@ItemType='FormParameter']">
                                <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                            </xsl:apply-templates>
                        </xsl:element>
                    </xsl:if>
                    <xsl:if test="Items/Item[@ItemType='Control' and @SubType != 'AreaItem']">
                        <xsl:element name="node">
                            <xsl:attribute name="icon">
                                <xsl:text>controls not-draggable</xsl:text>
                            </xsl:attribute>
                            <xsl:attribute name="text">
                                <xsl:value-of select="$Controls"/>
                            </xsl:attribute>
                            <xsl:apply-templates select="Items/Item[@ItemType='Control' and @SubType != 'AreaItem']">
                                <xsl:with-param name="InstanceID" select="$InstanceID" />
                                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                            </xsl:apply-templates>
                        </xsl:element>
                    </xsl:if>
                    <xsl:call-template name="Expressions">
                        <xsl:with-param name="InstanceID" select="$InstanceID" />
                        <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                    </xsl:call-template>
                    <xsl:apply-templates select="Items/Item[@ItemType='View']">
                        <xsl:with-param name="InstanceID" select="$InstanceID" />
                        <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                    </xsl:apply-templates>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:element name="node">
                        <xsl:attribute name="icon">
                          <xsl:text>object not-draggable</xsl:text>
                        </xsl:attribute>
                        <xsl:attribute name="text">
                            <xsl:text>No Items to display</xsl:text>
                        </xsl:attribute>
                    </xsl:element>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:element>
    </xsl:template>

    <!-- View Template -->
    <xsl:template match="Item[@ItemType='View']">
        <xsl:variable name="InstanceID">
            <xsl:choose>
                <xsl:when test="$InstanceID">
                    <xsl:value-of select="$InstanceID"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="InstanceID"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="SubFormInstanceID">
            <xsl:choose>
                <xsl:when test="$SubFormInstanceID">
                    <xsl:value-of select="$SubFormInstanceID"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:if test="$SubFormID and $SubFormID!='00000000-0000-0000-0000-000000000000'">
                        <xsl:value-of select="InstanceID"/>
                    </xsl:if>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:element name="node">
            <xsl:attribute name="text">
                <xsl:value-of select="DisplayName"/>
            </xsl:attribute>
            <xsl:call-template name="AddTitleAttribute">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:text>view not-draggable</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:value-of select="@Guid"/>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:if test="../Item[@ItemType='Control' and @SubType='AreaItem'][@Guid=$InstanceID]/Items/Item[@ItemType='ControlProperty']">
                <xsl:apply-templates select="../Item[@ItemType='Control' and @SubType='AreaItem'][@Guid=$InstanceID]/Items/Item[@ItemType='ControlProperty']" mode="category">
                    <!--<xsl:with-param name="InstanceID" select="$InstanceID" />-->
                </xsl:apply-templates>
            </xsl:if>
            <xsl:call-template name="ViewParameters">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:call-template>
            <xsl:call-template name="Controls">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:call-template>
            <xsl:apply-templates select="Items/Item[@ItemType='FieldContext'][not(ContextID)]">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
            <xsl:apply-templates select="Items/Item[@ItemType='Object']">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
            <xsl:call-template name="Expressions">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:call-template>
        </xsl:element>
    </xsl:template>

    <!-- Object Template -->
    <xsl:template match="Item[@ItemType='Object' or @ItemType='FieldContext']">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:choose>
            <xsl:when test="Items/Item[@ItemType='Object']">
                <xsl:element name="node">
                    <xsl:attribute name="ItemType">
                        <xsl:text>ViewSource</xsl:text>
                    </xsl:attribute>
                    <xsl:attribute name="text">
                        <xsl:value-of select="DisplayName"/>
                    </xsl:attribute>
                    <xsl:call-template name="AddTitleAttribute">
                    </xsl:call-template>
                    <xsl:apply-templates select="Items/Item">
                    </xsl:apply-templates>
                </xsl:element>
            </xsl:when>
            <xsl:otherwise>
                <xsl:if test="Items/Item[@ItemType='ObjectProperty' or @ItemType = 'ViewField' or @ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod']">
                    <xsl:element name="node">
                        <xsl:attribute name="text">
                            <xsl:value-of select="DisplayName"/>
                        </xsl:attribute>
                        <xsl:call-template name="AddTitleAttribute">
                        </xsl:call-template>
                        <xsl:attribute name="icon">
                            <xsl:choose>
                                <xsl:when test="@ItemType='Object' and ../../@ItemType!='FieldContext'">
                                    <xsl:text>smartobjectFF</xsl:text>
                                </xsl:when>
                                <xsl:otherwise>
                                    <xsl:text>smartobject</xsl:text>
                                </xsl:otherwise>
                            </xsl:choose>
                            <xsl:if test="$objectDraggable != 'true'">
                                <xsl:text> not-draggable</xsl:text>
                            </xsl:if>
                        </xsl:attribute>
                        <xsl:attribute name="id">
                            <xsl:value-of select="@Guid"/>
                        </xsl:attribute>
                        <xsl:attribute name="SubFormInstanceID">
                            <xsl:value-of select="$SubFormInstanceID"/>
                        </xsl:attribute>
                        <xsl:attribute name="InstanceID">
                            <xsl:value-of select="$InstanceID"/>
                        </xsl:attribute>
                        <xsl:attribute name="SubFormID">
                            <xsl:value-of select="$SubFormID"/>
                        </xsl:attribute>
                        <xsl:call-template name="AddDataAttributes">
                        </xsl:call-template>
                        <xsl:attribute name="ItemType">
                            <xsl:text>ViewSource</xsl:text>
                        </xsl:attribute>
                        <xsl:if test="Items/Item[@ItemType='ObjectProperty' or @ItemType = 'ViewField']">
                            <xsl:choose>
                                <xsl:when test="Items/Item[(@ItemType='ObjectProperty' or @ItemType = 'ViewField') and (@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod')]">
                                    <xsl:element name="node">
                                        <xsl:attribute name="text">
                                            <xsl:value-of select="$Fields"/>
                                        </xsl:attribute>
                                        <xsl:apply-templates select="Items/Item[@ItemType='ObjectProperty' or @ItemType='ViewField']">
                                            <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                                            <xsl:with-param name="InstanceID" select="$InstanceID"/>
                                            <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID"/>
                                        </xsl:apply-templates>
                                    </xsl:element>
                                </xsl:when>
                                <xsl:otherwise>
                                    <xsl:apply-templates select="Items/Item[@ItemType='ObjectProperty' or @ItemType='ViewField']">
                                        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                                        <xsl:with-param name="InstanceID" select="$InstanceID"/>
                                        <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID"/>
                                    </xsl:apply-templates>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:if>
                        <xsl:if test="Items/Item[@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod']">
                            <xsl:element name="node">
                                <xsl:attribute name="text">
                                    <xsl:value-of select="$Methods"/>
                                </xsl:attribute>
                                <xsl:apply-templates select="Items/Item[@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod']">
                                    <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                                    <xsl:with-param name="InstanceID" select="$InstanceID"/>
                                    <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID"/>
                                </xsl:apply-templates>
                            </xsl:element>
                        </xsl:if>
                    </xsl:element>
                </xsl:if>
                <xsl:if test="not(Items/Item[@ItemType='ObjectProperty' or @ItemType = 'ViewField' or @ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod'])">
                    <xsl:element name="node">
                        <xsl:attribute name="ItemType">
                            <xsl:text>ViewSource</xsl:text>
                        </xsl:attribute>
                        <xsl:attribute name="text">
                            <xsl:value-of select="$NoItemsToDisplay" />
                        </xsl:attribute>
                        <xsl:attribute name="icon">
                          <xsl:text>object not-draggable</xsl:text>
                        </xsl:attribute>
                    </xsl:element>
                </xsl:if>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- View Controls Template -->
    <xsl:template name ="Controls">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:if test="Items/Item[@ItemType='Control']">
            <xsl:element name="node">
                <xsl:attribute name="text">
                    <xsl:value-of select="$Controls"/>
                </xsl:attribute>
                <xsl:attribute name="icon">
                    <xsl:text>controls not-draggable</xsl:text>
                </xsl:attribute>
                <xsl:if test="Items/Item[@ItemType='Control' and Template='Header']">
                    <xsl:element name="node">
                        <xsl:attribute name="text">
                            <xsl:value-of select="$Header"/>
                        </xsl:attribute>
                        <xsl:attribute name="icon">
                            <xsl:text>controls</xsl:text>
                        </xsl:attribute>
                        <xsl:apply-templates select="Items/Item[@ItemType='Control' and Template='Header']">
                            <xsl:with-param name="InstanceID" select="$InstanceID" />
                            <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                        </xsl:apply-templates>
                    </xsl:element>
                </xsl:if>
                <xsl:if test="Items/Item[@ItemType='Control' and Template='Display']">
                    <xsl:element name="node">
                        <xsl:attribute name="text">
                            <xsl:value-of select="$Display"/>
                        </xsl:attribute>
                        <xsl:attribute name="icon">
                            <xsl:text>controls not-draggable</xsl:text>
                        </xsl:attribute>
                        <xsl:apply-templates select="Items/Item[@ItemType='Control' and Template='Display']">
                            <xsl:with-param name="InstanceID" select="$InstanceID" />
                            <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                        </xsl:apply-templates>
                    </xsl:element>
                </xsl:if>
                <xsl:if test="Items/Item[@ItemType='Control' and Template='Edit']">
                    <xsl:element name="node">
                        <xsl:attribute name="text">
                            <xsl:value-of select="$Edit"/>
                        </xsl:attribute>
                        <xsl:attribute name="icon">
                            <xsl:text>controls not-draggable</xsl:text>
                        </xsl:attribute>
                        <xsl:apply-templates select="Items/Item[@ItemType='Control'and Template='Edit']">
                            <xsl:with-param name="InstanceID" select="$InstanceID" />
                            <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                        </xsl:apply-templates>
                    </xsl:element>
                </xsl:if>
                <xsl:if test="Items/Item[@ItemType='Control' and Template='Footer']">
                    <xsl:element name="node">
                        <xsl:attribute name="text">
                            <xsl:value-of select="$Footer"/>
                        </xsl:attribute>
                        <xsl:attribute name="icon">
                            <xsl:text>controls not-draggable</xsl:text>
                        </xsl:attribute>
                        <xsl:apply-templates select="Items/Item[@ItemType='Control' and Template='Footer']">
                            <xsl:with-param name="InstanceID" select="$InstanceID" />
                            <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                        </xsl:apply-templates>
                    </xsl:element>
                </xsl:if>
                <xsl:if test="Items/Item[@ItemType='Control' and not(Template)]">
                    <xsl:apply-templates select="Items/Item[@ItemType='Control' and not(Template)]">
                        <xsl:with-param name="InstanceID" select="$InstanceID" />
                        <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                    </xsl:apply-templates>
                </xsl:if>
            </xsl:element>
        </xsl:if>
    </xsl:template>

    <!-- View and Form Details Template (Controls and Fields) -->
    <xsl:template  match="Item[@ItemType='Control' or @ItemType='ViewField']">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:variable name="ContextID">
            <xsl:value-of select="@Guid"/>
        </xsl:variable>
        <xsl:element name="node">
            <xsl:attribute name="id">
                <xsl:choose>
                    <xsl:when test="@Guid">
                        <xsl:value-of select ="@Guid"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select ="@ID"/>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
            <xsl:attribute name="SubFormInstanceID">
                <xsl:value-of select="$SubFormInstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="InstanceID">
                <xsl:value-of select="$InstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>
            <xsl:variable name="Name">
                <xsl:choose>
                    <xsl:when test="@ItemType='ViewField'">
                        <xsl:value-of select="../../@Guid"/>
                        <xsl:text>_</xsl:text>
                        <xsl:value-of select="Data"/>
                    </xsl:when>
                    <xsl:when test="Name">
                        <xsl:value-of select ="Name"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select ="@Name"/>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:variable>
            <xsl:attribute name="Name">
                <xsl:value-of select ="$Name"/>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:choose>
                    <xsl:when test="DisplayName">
                        <xsl:value-of select ="DisplayName"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select ="$Name"/>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
            <xsl:if test="@HasProperties">
                <xsl:attribute name="children">
                    <xsl:text>true</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="dynamic">
                    <xsl:text>true</xsl:text>
                </xsl:attribute>
            </xsl:if>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:choose>
                    <xsl:when test="@ItemType='Control'">
                        <xsl:value-of select="translate(@SubType,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')"/>
                        <xsl:text>-control</xsl:text>
                        <xsl:if test="Category != '0' and Category != '1' and Category != '7' and Category != 'Input' and Category != 'Listing' and Category != 'Execution'">
                            <xsl:text> not-draggable</xsl:text>
                        </xsl:if>
                    </xsl:when>
                    <xsl:when test="@SubType = 'AutoGuid' or @SubType = 'autoguid'">
                        <xsl:text>auto-guid</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'AutoNumber' or @SubType = 'autonumber'">
                        <xsl:text>auto-number</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'DateTime' or @SubType = 'datetime'">
                        <xsl:text>date-time</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Date' or @SubType = 'date'">
                        <xsl:text>date</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Time' or @SubType = 'time'">
                        <xsl:text>time</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Decimal' or @SubType = 'decimal'">
                        <xsl:text>decimal</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'File' or @SubType = 'file'">
                        <xsl:text>file</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Guid' or @SubType = 'guid'">
                        <xsl:text>guid</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'HyperLink' or @SubType = 'hyperlink'">
                        <xsl:text>hyperlink</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Image' or @SubType = 'image'">
                        <xsl:text>image</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Memo' or @SubType = 'memo'">
                        <xsl:text>memo</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
                        <xsl:text>number</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'YesNo' or @SubType = 'yesno'">
                        <xsl:text>yesno</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Multivalue' or @SubType = 'multivalue'">
                        <xsl:text>multi-value</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Text' or @SubType = 'text'">
                        <xsl:text>text</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select="translate(@SubType,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')"/>
                        <xsl:text>-control</xsl:text>
                        <xsl:if test="Category != '0' and Category != '1' and Category != '7' and Category != 'Input' and Category != 'Listing' and Category != 'Execution'">
                            <xsl:text> not-draggable</xsl:text>
                        </xsl:if>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>

            <!--control properties or methods-->
            <xsl:choose>
                <xsl:when test="Items/Item[@ItemType='ControlMethod' and not(@SubType='None')]">
                    <xsl:variable name="ControlType">
                        <xsl:value-of select="@SubType"/>
                    </xsl:variable>
                    <xsl:apply-templates select="Items/Item[@ItemType='ControlMethod']">
                        <xsl:with-param name="InstanceID" select="$InstanceID" />
                        <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                        <xsl:with-param name="ControlType" select="$ControlType" />
                    </xsl:apply-templates>
                    <xsl:if test="Items/Item[(@ItemType='ControlProperty' or @ItemType='ControlField') and not(@Visibility='None')]">
                        <xsl:element name="node">
                            <xsl:attribute name="text">
                                <xsl:value-of select="$ControlMethodProperties"/>
                            </xsl:attribute>
                            <xsl:attribute name="icon">
                                <xsl:text>control-method-properties not-draggable</xsl:text>
                            </xsl:attribute>
                            <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty' and not(@Visibility='None')]" mode="category">
                                <xsl:with-param name="InstanceID" select="$InstanceID" />
                                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                            </xsl:apply-templates>
                            <xsl:apply-templates select="Items/Item[@ItemType='ControlField' and not(@Visibility='None')]" mode="category">
                                <xsl:with-param name="InstanceID" select="$InstanceID" />
                                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                            </xsl:apply-templates>
                        </xsl:element>
                    </xsl:if>
                </xsl:when>
            </xsl:choose>

            <!--view level field context-->
            <xsl:apply-templates select="/Items/Item[@ItemType='View']/Items/Item[@ItemType='FieldContext'][ContextID=concat($ContextID,'')]/Items/Item[@ItemType='Object']">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
            <!--view level field context-->
            <!--form level field context-->
            <xsl:apply-templates select="/Items/Item[@ItemType='Form']/Items/Item[@ItemType='View' and (InstanceID=$InstanceID or $InstanceID='00000000-0000-0000-0000-000000000000')]/Items/Item[@ItemType='FieldContext'][ContextID=concat($ContextID,'')]/Items/Item[@ItemType='Object']">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
            <!--form level field context-->
        </xsl:element>
    </xsl:template>

    <!-- ViewParameters Template -->
    <xsl:template name ="ViewParameters">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:if test="Items/Item[@ItemType='ViewParameter']">
            <xsl:element name="node">
                <xsl:attribute name="text">
                    <xsl:value-of select="$Parameters"/>
                </xsl:attribute>
                <xsl:attribute name="icon">parameters not-draggable</xsl:attribute>
                <xsl:apply-templates select="Items/Item[@ItemType='ViewParameter']">
                    <xsl:with-param name="InstanceID" select="$InstanceID" />
                    <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                </xsl:apply-templates>
            </xsl:element>
        </xsl:if>
    </xsl:template>

    <!-- ViewParameter Template -->
    <xsl:template  match="Item[@ItemType='ViewParameter']">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:attribute name="Name">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:value-of select ="DisplayName"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormInstanceID">
                <xsl:value-of select="$SubFormInstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="InstanceID">
                <xsl:value-of select="$InstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:choose>
                    <xsl:when test="@SubType = 'DateTime' or @SubType = 'datetime'">
                        <xsl:text>date-time</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
                        <xsl:text>number</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Boolean' or @SubType = 'yesno'">
                        <xsl:text>yesno</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Text' or @SubType = 'text'">
                        <xsl:text>text</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:text>text</xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>
        </xsl:element>
    </xsl:template>

    <!-- Control Type Method Template -->
    <xsl:template  match="Item[@ItemType='ControlMethod']">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="ControlType"/>
        <xsl:element name="node">
            <xsl:attribute name="text">
                <xsl:value-of select="DisplayName"/>
            </xsl:attribute>
            <xsl:attribute name="icon">
                <xsl:text>control-method not-draggable</xsl:text>
            </xsl:attribute>
            <!--control method items-->
            <xsl:element name="node">
                <xsl:attribute name="text">
                    <xsl:value-of select="$ControlMethodResult"/>
                </xsl:attribute>
                <xsl:attribute name="Icon">
                    <xsl:choose>
                        <xsl:when test="@SubType = 'Boolean' or @SubType = 'boolean'">
                            <xsl:text>boolean</xsl:text>
                        </xsl:when>
                        <xsl:when test="@SubType = 'DateTime' or @SubType = 'Datetime'">
                            <xsl:text>date-time</xsl:text>
                        </xsl:when>
                        <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
                            <xsl:text>number</xsl:text>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:text>text</xsl:text>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:attribute>
                <xsl:attribute name="id">
                    <xsl:text>control-method-result</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="Name">
                    <xsl:text>control-method-result</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="SourceID">
                    <xsl:text>control-method-result</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="ItemType">
                    <xsl:text>ControlMethodResult</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="SubFormInstanceID">
                    <xsl:value-of select="$SubFormInstanceID"/>
                </xsl:attribute>
                <xsl:attribute name="InstanceID">
                    <xsl:value-of select="$InstanceID"/>
                </xsl:attribute>
                <xsl:attribute name="SubFormID">
                    <xsl:value-of select="$SubFormID"/>
                </xsl:attribute>
            </xsl:element>
        </xsl:element>
    </xsl:template>

    <xsl:template match="/Items[Item[(@ItemType='ControlProperty' or @ItemType='ControlField') and not(@Visibility='None')]]" mode="partial">
        <xsl:variable name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
        </xsl:variable>
        <xsl:attribute name="SubFormID">
            <xsl:value-of select="$SubFormID"/>
        </xsl:attribute>
        <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$SubFormInstanceID"/>
        </xsl:attribute>
        <xsl:element name="nodes">
            <xsl:apply-templates select="Item[@ItemType='ControlProperty' and not(@Visibility='None')]" mode="category">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
            <xsl:apply-templates select="Item[@ItemType='ControlField' and not(@Visibility='None')]" mode="category">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
        </xsl:element>
    </xsl:template>

    <!-- Control Properties Category Template -->
    <xsl:template  match="Item[@ItemType='ControlProperty' and not(@Visibility='None')]" mode="category">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:attribute name="text">
                <xsl:value-of select="DisplayName"/>
            </xsl:attribute>
            <xsl:attribute name="icon">
                <xsl:text>folder not-draggable</xsl:text>
            </xsl:attribute>
            <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty' and not(@Visibility='None')]">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
        </xsl:element>
    </xsl:template>

    <!-- Control Property Template -->
    <xsl:template  match="Item[@ItemType='ControlProperty' and not(@Visibility='None')]">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:attribute name="text">
                <xsl:value-of select="DisplayName"/>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="SourceID">
                <xsl:value-of select ="TargetID"/>
            </xsl:attribute>
            <xsl:attribute name="SourcePath">
                <xsl:value-of select ="TargetPath"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormInstanceID">
                <xsl:value-of select="$SubFormInstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="InstanceID">
                <xsl:value-of select="$InstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>
            <xsl:attribute name="icon">
                <xsl:text>ControlProperty</xsl:text>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes"/>
        </xsl:element>
    </xsl:template>

    <!-- Control Field Category Template -->
    <xsl:template  match="Item[@ItemType='ControlField' and not(@Visibility='None')]" mode="category">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:attribute name="text">
                <xsl:value-of select="DisplayName"/>
            </xsl:attribute>
            <xsl:attribute name="icon">
                <xsl:choose>
                    <xsl:when test="./@Icon">
                        <xsl:value-of select="./@Icon"/>
                        <xsl:text> not-draggable</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:text>folder not-draggable</xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
            <xsl:apply-templates select="Items/Item[@ItemType='ControlField' and not(@Visibility='None')]">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
                <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
            </xsl:apply-templates>
        </xsl:element>
    </xsl:template>

    <!-- Control Field Template -->
    <xsl:template  match="Item[@ItemType='ControlField' and not(@Visibility='None')]">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:attribute name="text">
                <xsl:value-of select="DisplayName"/>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="SourceID">
                <xsl:value-of select ="SourceID"/>
            </xsl:attribute>
            <xsl:attribute name="SourcePath">
                <xsl:value-of select ="SourcePath"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormInstanceID">
                <xsl:value-of select="$SubFormInstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="InstanceID">
                <xsl:value-of select="$InstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>
            <xsl:attribute name="icon">
                <xsl:choose>
                    <xsl:when test="./@Icon">
                        <xsl:value-of select="./@Icon"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:text>ControlProperty</xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes"/>
        </xsl:element>
    </xsl:template>

    <!-- Expressions Template -->
    <xsl:template name ="Expressions">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:if test="Items/Item[@ItemType='Expression']">
            <xsl:element name="node">
                <xsl:attribute name="text">
                    <xsl:value-of select="$Expressions"/>
                </xsl:attribute>
                <xsl:attribute name="icon">expressions not-draggable</xsl:attribute>
                <xsl:apply-templates select="Items/Item[@ItemType='Expression']">
                    <xsl:with-param name="InstanceID" select="$InstanceID" />
                    <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID" />
                </xsl:apply-templates>
            </xsl:element>
        </xsl:if>
    </xsl:template>

    <!-- Expression Template -->
    <xsl:template  match="Item[@ItemType='Expression']">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:variable name="Name">
                <xsl:choose>
                    <xsl:when test="Name">
                        <xsl:value-of select ="Name"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select ="@Name"/>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:variable>
            <xsl:variable name="Guid">
                <xsl:choose>
                    <xsl:when test="@Guid">
                        <xsl:value-of select ="@Guid"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select ="@ID"/>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:variable>
            <xsl:attribute name="id">
                <xsl:value-of select="$Guid"/>
            </xsl:attribute>
            <xsl:attribute name="Guid">
                <xsl:value-of select="$Guid"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormInstanceID">
                <xsl:value-of select="$SubFormInstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="InstanceID">
                <xsl:value-of select="$InstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>

            <xsl:attribute name="Name">
                <xsl:value-of select ="$Name"/>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:value-of select ="$Name"/>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:text>expression</xsl:text>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>
        </xsl:element>
    </xsl:template>

    <!-- Form Parameter Template -->
    <xsl:template  match="Item[@ItemType='FormParameter']">
        <xsl:element name="node">
            <xsl:attribute name="Name">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:value-of select ="DisplayName"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:choose>
                    <xsl:when test="@SubType = 'DateTime' or @SubType = 'datetime'">
                        <xsl:text>date-time</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
                        <xsl:text>number</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Boolean' or @SubType = 'yesno'">
                        <xsl:text>yesno</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Text' or @SubType = 'text'">
                        <xsl:text>text</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:text>text</xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>
        </xsl:element>
    </xsl:template>

    <!-- Object Property Template -->
    <xsl:template  match="Item[@ItemType='ObjectProperty' or @ItemType= 'MethodRequiredProperty' or @ItemType= 'MethodOptionalProperty' or @ItemType= 'MethodReturnedProperty' or @ItemType= 'MethodParameter']">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:attribute name="SubFormInstanceID">
                <xsl:value-of select="$SubFormInstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="InstanceID">
                <xsl:value-of select="$InstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:value-of select ="DisplayName"/>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:choose>
                    <xsl:when test="@SubType = 'AutoGuid' or @SubType = 'autoguid'">
                        <xsl:text>auto-guidFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'AutoNumber' or @SubType = 'autonumber' or @SubType = 'Autonumber'">
                        <xsl:text>auto-numberFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'DateTime' or @SubType = 'datetime'">
                        <xsl:text>date-timeFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Date' or @SubType = 'date'">
                        <xsl:text>dateFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Time' or @SubType = 'time'">
                        <xsl:text>timeFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Decimal' or @SubType = 'decimal'">
                        <xsl:text>decimalFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'File' or @SubType = 'file'">
                        <xsl:text>fileFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Guid' or @SubType = 'guid'">
                        <xsl:text>guidFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'HyperLink' or @SubType = 'hyperlink' or @SubType = 'Hyperlink' or @SubType = 'hyperLink'">
                        <xsl:text>hyperlinkFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Image' or @SubType = 'image'">
                        <xsl:text>imageFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Memo' or @SubType = 'memo'">
                        <xsl:text>memoFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
                        <xsl:text>numberFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'YesNo' or @SubType = 'yesno'">
                        <xsl:text>yesnoFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'MultiValue' or @SubType = 'multiValue' or @SubType = 'Multivalue'  or @SubType = 'multivalue'">
                        <xsl:text>multi-valueFF</xsl:text>
                    </xsl:when>
                    <xsl:when test="@SubType = 'Text' or @SubType = 'text'">
                        <xsl:text>textFF</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:text>textFF</xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>
        </xsl:element>
    </xsl:template>

    <!-- Object Method Template -->
    <xsl:template  match="Item[@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod']">
        <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:param name="SubFormInstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
        <xsl:element name="node">
            <xsl:attribute name="id">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:value-of select ="Name"/>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:value-of select ="DisplayName"/>
            </xsl:attribute>
            <xsl:call-template name="AddDataAttributes">
            </xsl:call-template>
            <xsl:attribute name="icon">
                <xsl:text>smartobject-method not-draggable</xsl:text>
            </xsl:attribute>
            <xsl:if test="Items/Item[@ItemType = 'MethodParameter']">
                <xsl:element name="Item">
                    <xsl:attribute name="node">
                        <xsl:value-of select="$Parameters"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="Items/Item[@ItemType='MethodParameter']">
                        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                    </xsl:apply-templates>
                </xsl:element>
            </xsl:if>
            <xsl:if test="Items/Item[@ItemType = 'MethodRequiredProperty' or @ItemType = 'MethodOptionalProperty']">
                <xsl:element name="node">
                    <xsl:attribute name="text">
                        <xsl:value-of select="$InputProperties"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="Items/Item[@ItemType='MethodRequiredProperty']">
                        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                        <xsl:with-param name="InstanceID" select="$InstanceID"></xsl:with-param>
                        <!--<xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID"></xsl:with-param>-->
                        <!-- Must be put back when SubformInstanceID for targets is implemented-->
                    </xsl:apply-templates>
                    <xsl:apply-templates select="Items/Item[@ItemType='MethodOptionalProperty']">
                        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                    </xsl:apply-templates>
                </xsl:element>
            </xsl:if>
            <xsl:if test="Items/Item[@ItemType = 'MethodReturnedProperty']">
                <xsl:element name="node">
                    <xsl:attribute name="text">
                        <xsl:value-of select="$ReturnProperties"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="Items/Item[@ItemType='MethodReturnedProperty']">
                        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                        <xsl:with-param name="InstanceID" select="$InstanceID"></xsl:with-param>
                        <xsl:with-param name="SubFormInstanceID" select="$SubFormInstanceID"></xsl:with-param>
                    </xsl:apply-templates>
                </xsl:element>
            </xsl:if>
        </xsl:element>
    </xsl:template>

    <xsl:template name="AddDataAttributes">
        <xsl:for-each select="./@*">
            <xsl:variable name="nodeName">
                <xsl:value-of select="local-name()"/>
            </xsl:variable>
            <xsl:if test="((translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'name') and (translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'id') and (translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'icon') and (translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'text'))">
                <xsl:attribute name="{$nodeName}">
                    <xsl:value-of select="."/>
                </xsl:attribute>
            </xsl:if>
        </xsl:for-each>
        <xsl:for-each select="./*">
            <xsl:if test="local-name() != 'Items'">
                <xsl:variable name="nodeName">
                    <xsl:value-of select="local-name()"/>
                </xsl:variable>
                <xsl:if test="((translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'name') and (translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'id') and (translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'icon') and (translate($nodeName, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') != 'text'))">
                    <xsl:attribute name="{$nodeName}">
                        <xsl:value-of select="."/>
                    </xsl:attribute>
                </xsl:if>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>

    <xsl:template name="ParentSoGuid">
        <xsl:choose>
            <xsl:when test="@ItemType = 'Object' or @ItemType='FieldContext'">
                <xsl:value-of select="@Guid"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:for-each select="../../.">
                    <xsl:call-template name="ParentSoGuid"/>
                </xsl:for-each>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- Process Template -->
    <xsl:template name="AddWIIcon">
        <xsl:attribute name="icon">
            <xsl:if test="@ItemType='ProcessFolder'">
                <xsl:text>workflows not-draggable</xsl:text>
            </xsl:if>
            <xsl:if test="@ItemType='Process'">
                <xsl:text>workflow</xsl:text>
            </xsl:if>
            <xsl:if test="@ItemType='ProcessProperty' or @ItemType='ActivityProperty'">
                <xsl:if test="Name='Folio' or Name='SerialNumber' or Name='Name' or Name='DisplayName' or Name='Data' or Name='Description' or Name='Instructions' or Name='ViewFlow' or Name='OriginatorName' or Name='OriginatorDisplayName' or Name='OriginatorDescription' or Name='OriginatorLabel' or Name='OriginatorFQN'">
                    <xsl:text>text</xsl:text>
                </xsl:if>
                <xsl:if test="Name='Priority' or Name='ExpectedDuration' or Name='ID'">
                    <xsl:text>number</xsl:text>
                </xsl:if>
                <xsl:if test="Name='ActionName'">
                    <xsl:text>workflow-action-name</xsl:text>
                </xsl:if>
                <xsl:if test="Name='Guid'">
                    <xsl:text>guid</xsl:text>
                </xsl:if>
                <xsl:if test="Name='StartDate'">
                    <xsl:text>datetime</xsl:text>
                </xsl:if>
                <xsl:if test="Name='Originator' or Name='OriginatorManager'">
                    <xsl:text>user</xsl:text>
                </xsl:if>
                <xsl:if test="Name='OriginatorEmail'">
                    <xsl:text>mail</xsl:text>
                </xsl:if>
                <xsl:if test="Name='OriginatorManagedUsers'">
                    <xsl:text>group</xsl:text>
                </xsl:if>
            </xsl:if>
            <xsl:if test="@ItemType='Result' and Name='getworkflowactions' ">
                <xsl:text>workflow-actions</xsl:text>
            </xsl:if>
            <xsl:if test="@ItemType='ProcessDataField' or @ItemType='ActivityDataField'">
                <xsl:text>data-field</xsl:text>
            </xsl:if>
            <xsl:if test="@ItemType='ProcessXmlField' or @ItemType='ActivityXmlField' or @ItemType='ProcessItemReference'">
                <xsl:text>xml-field</xsl:text>
            </xsl:if>
            <xsl:if test="@ItemType='Activity'">
                <xsl:text>process-activities</xsl:text>
            </xsl:if>
            <xsl:if test="@ItemType='ProcessInstance'">
                <xsl:text>process-instance</xsl:text>
            </xsl:if>
            <xsl:if test="@disabled">
                <xsl:text> disabled</xsl:text>
            </xsl:if>
        </xsl:attribute>
    </xsl:template>

    <xsl:template match="Item[@ItemType='ProcessSet']">
        <xsl:apply-templates select="Items/Item"/>
    </xsl:template>

    <xsl:template name="WINodeAttributes">
        <xsl:call-template name="AddWIIcon">
        </xsl:call-template>
        <xsl:attribute name="id">
            <xsl:value-of select ="Name"/>
        </xsl:attribute>
        <xsl:attribute name="Name">
            <xsl:value-of select ="Name"/>
        </xsl:attribute>
        <xsl:attribute name="text">
            <xsl:value-of select ="DisplayName"/>
        </xsl:attribute>
        <xsl:attribute name="SubFormID">
            <xsl:value-of select="$SubFormID"/>
        </xsl:attribute>
        <xsl:call-template name="AddDataAttributes">
        </xsl:call-template>
    </xsl:template>

    <xsl:template match="Item[(@ItemType='ProcessFolder' or @ItemType='Process' or @ItemType = 'ProcessProperty' or @ItemType = 'ActivityProperty' or @ItemType='Activity' or @ItemType='ProcessInstance') and Name!='ActionName' and Name!='getworkflowactions' ]">
        <xsl:element name="node">
            <xsl:call-template name="WINodeAttributes">
            </xsl:call-template>
            <xsl:apply-templates select="Items/Item[@ItemType!='ProcessDataField' and @ItemType!='ProcessXmlField' and @ItemType!='ActivityDataField' and @ItemType!='ActivityXmlField']"/>
            <xsl:apply-templates mode="ProcessDataField" select="Items[Item[@ItemType='ProcessDataField']]"/>
            <xsl:apply-templates mode="ActivityDataField" select="Items[Item[@ItemType='ActivityDataField']]"/>
            <xsl:apply-templates mode="ProcessXmlField" select="Items[Item[@ItemType='ProcessXmlField' ]]"/>
            <xsl:apply-templates mode="ActivityXmlField" select="Items[Item[@ItemType='ActivityXmlField']]"/>
            <xsl:apply-templates mode="ProcessItemReferences" select="Items[Item[@ItemType='ProcessItemReference']]"/>
        </xsl:element>
    </xsl:template>

    <xsl:template mode="ProcessItemReferences" match="Items[Item[@ItemType='ProcessItemReference']]">
        <xsl:element name="node">
            <xsl:attribute name="Icon">
                <xsl:text>xml-reference not-draggable</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:text>Item References</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:text>ItemReferences</xsl:text>
            </xsl:attribute>
            <xsl:for-each select="Item[@ItemType='ProcessItemReference']">
                <xsl:element name="node">
                    <xsl:call-template name="WINodeAttributes">
                    </xsl:call-template>
                </xsl:element>
            </xsl:for-each>
        </xsl:element>
    </xsl:template>

    <xsl:template mode="ProcessDataField" match="Items[Item[@ItemType='ProcessDataField']]">
        <xsl:element name="node" >
            <xsl:attribute name="icon">
                <xsl:text>data-fields not-draggable</xsl:text>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:text>Data Fields</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="id">
                <xsl:text>ProcessDataField</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="SubFormID">
                <xsl:value-of select="$SubFormID"/>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:text>Data Fields</xsl:text>
            </xsl:attribute>
            <xsl:for-each select="Item[@ItemType='ProcessDataField']">
                <xsl:element name="node">
                    <xsl:call-template name="WINodeAttributes">
                    </xsl:call-template>
                </xsl:element>
            </xsl:for-each>
        </xsl:element>
    </xsl:template>

    <xsl:template mode="ProcessXmlField" match="Items[Item[@ItemType='ProcessXmlField']]">
        <xsl:element name="node">
            <xsl:attribute name="icon">
                <xsl:text>xml-fields not-draggable</xsl:text>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:text>Xml Fields</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:text>Xml Fields</xsl:text>
            </xsl:attribute>
            <xsl:for-each select="Item[@ItemType='ProcessXmlField']">
                <xsl:element name="node">
                    <xsl:call-template name="WINodeAttributes">
                    </xsl:call-template>
                </xsl:element>
            </xsl:for-each>
        </xsl:element>
    </xsl:template>

    <xsl:template mode="ActivityDataField" match="Items[Item[@ItemType='ActivityDataField']]">
        <xsl:element name="node">
            <xsl:attribute name="icon">
                <xsl:text>data-fields not-draggable</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:text>Data Fields</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:text>Data Fields</xsl:text>
            </xsl:attribute>
            <xsl:for-each select="Item[@ItemType='ActivityDataField']">
                <xsl:element name="node">
                    <xsl:call-template name="WINodeAttributes">
                    </xsl:call-template>
                </xsl:element>
            </xsl:for-each>
        </xsl:element>
    </xsl:template>

    <xsl:template mode="ActivityXmlField"  match="Items[Item[@ItemType='ActivityXmlField']]">
        <xsl:element name="node">
            <xsl:attribute name="icon">
                <xsl:text>xml-fields not-draggable</xsl:text>
                <xsl:if test="@disabled">
                    <xsl:text> disabled</xsl:text>
                </xsl:if>
            </xsl:attribute>
            <xsl:attribute name="text">
                <xsl:text>Xml Fields</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="Name">
                <xsl:text>Xml Fields</xsl:text>
            </xsl:attribute>
            <xsl:for-each select="Item[@ItemType='ActivityXmlField']">
                <xsl:element name="node">
                    <xsl:call-template name="WINodeAttributes">
                    </xsl:call-template>
                </xsl:element>
            </xsl:for-each>
        </xsl:element>
    </xsl:template>

    <xsl:template name="AddTitleAttribute">
        <xsl:attribute name="title">
            <xsl:if test="string-length(Name) &gt; 0">
                <xsl:call-template name="replace-string">
                    <xsl:with-param name="text" select="$TitleSystemName"/>
                    <xsl:with-param name="replace" select="'{0}'" />
                    <xsl:with-param name="with" select="Name"/>
                </xsl:call-template>
                <xsl:if test="string-length(Description) &gt; 0">
                    <xsl:text>\n</xsl:text>
                </xsl:if>
            </xsl:if>
            <xsl:if test="string-length(Description) &gt; 0">
                <xsl:call-template name="replace-string">
                    <xsl:with-param name="text" select="$TitleDescription"/>
                    <xsl:with-param name="replace" select="'{0}'" />
                    <xsl:with-param name="with" select="Description"/>
                </xsl:call-template>
            </xsl:if>
        </xsl:attribute>
    </xsl:template>

    <xsl:template name="replace-string">
        <xsl:param name="text"/>
        <xsl:param name="replace"/>
        <xsl:param name="with"/>
        <xsl:choose>
            <xsl:when test="contains($text,$replace)">
                <xsl:value-of select="substring-before($text,$replace)"/>
                <xsl:value-of select="$with"/>
                <xsl:call-template name="replace-string">
                    <xsl:with-param name="text" select="substring-after($text,$replace)"/>
                    <xsl:with-param name="replace" select="$replace"/>
                    <xsl:with-param name="with" select="$with"/>
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$text"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>
