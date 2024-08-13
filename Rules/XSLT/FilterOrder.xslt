<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl"
>
	<xsl:output method="xml" indent="no"/>

	<xsl:output omit-xml-declaration="yes"/>

	<xsl:param name="ResultName"/>
	<xsl:param name="SubFormID" />

	<xsl:template match="/">
		<xsl:choose>
			<xsl:when test="string-length($ResultName) > 0">
				<xsl:apply-templates select="/Item/Items[@ResultName = $ResultName]"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="/Item/Items"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="Items">
		<xsl:element name="Items">
			<!-- View plugin -->
			<xsl:apply-templates select="Item[@ItemType='View']">
			</xsl:apply-templates>

			<!-- Object plugin -->
			<xsl:apply-templates select="Item[@ItemType='Object']">
			</xsl:apply-templates>

			<!-- Form plugin -->
			<xsl:apply-templates select="Item[@ItemType='Form']">
			</xsl:apply-templates>
		</xsl:element>
	</xsl:template>


	<!-- Form Template -->
	<xsl:template match="Item[@ItemType='Form']">
		<xsl:choose>
			<xsl:when test="Items/Item">
				<xsl:apply-templates select="Items/Item[@ItemType='View']">
				</xsl:apply-templates>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<!-- View Template -->
	<xsl:template match="Item[@ItemType='View']">
		<xsl:variable name="InstanceID" select="InstanceID"></xsl:variable>
		<xsl:choose>
			<xsl:when test ="Items/Item">
				<xsl:apply-templates select="Items/Item[@ItemType='FieldContext']">
					<xsl:with-param name="InstanceID" select="$InstanceID" />
				</xsl:apply-templates>
				<xsl:apply-templates select="Items/Item[@ItemType='Object']">
					<xsl:with-param name="InstanceID" select="$InstanceID" />
				</xsl:apply-templates>
			</xsl:when>
			<xsl:otherwise>
				<xsl:element name="DisplayName">
					<xsl:text>No items to display</xsl:text>
				</xsl:element>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<!-- Object Template -->
	<xsl:template match="Item[@ItemType='Object' or @ItemType='FieldContext']">
		<xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
		<xsl:param name="ContextGuid" select="@Guid" />
		<xsl:param name="ObjectDisplayName" select="DisplayName/." />
		<xsl:choose>
			<xsl:when test="Items/Item">
				<xsl:apply-templates select="Items/Item[@ItemType='ObjectProperty' or @ItemType='ViewField']">
					<xsl:with-param name="InstanceID" select="$InstanceID"/>
					<xsl:with-param name="ContextGuid" select="$ContextGuid" />
					<xsl:with-param name="ObjectDisplayName" select="$ObjectDisplayName" />
				</xsl:apply-templates>
				<xsl:apply-templates select="Items/Item[(@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod')  and @SubType='list']">
					<xsl:with-param name="InstanceID" select="$InstanceID"/>
					<xsl:with-param name="ContextGuid" select="$ContextGuid" />
					<xsl:with-param name="ObjectDisplayName" select="$ObjectDisplayName" />
				</xsl:apply-templates>
				<xsl:apply-templates select="Items/Item[@ItemType='Object']">
					<xsl:with-param name="InstanceID" select="$InstanceID"/>
				</xsl:apply-templates>
			</xsl:when>
		</xsl:choose>

	</xsl:template>

	<!-- View Details Template -->
	<xsl:template  match="Item[@ItemType='ViewField']">
		<xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
		<xsl:param name="ContextGuid"></xsl:param>
		<xsl:param name="ObjectDisplayName"/>
		<xsl:element name="Item">
			<xsl:attribute name="InstanceID">
				<xsl:value-of select="$InstanceID"/>
			</xsl:attribute>
			<xsl:attribute name="SubFormID">
				<xsl:value-of select="$SubFormID"/>
			</xsl:attribute>
			<xsl:attribute name="Icon">
				<xsl:choose>
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
					<xsl:when test="@SubType = 'HyperLink' or @SubType = 'hyperlink' or @SubType = 'Hyperlink' or @SubType = 'hyperLink'">
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
					<xsl:when test="@SubType = 'MultiValue' or @SubType = 'multiValue' or @SubType = 'Multivalue'  or @SubType = 'multivalue'">
						<xsl:text>multi-value</xsl:text>
					</xsl:when>
					<xsl:when test="@SubType = 'Text' or @SubType = 'text'">
						<xsl:text>text</xsl:text>
					</xsl:when>
					<xsl:when test="@ItemType='FieldContext'">
						<xsl:text>smartobject</xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="translate(@SubType,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')"/>
						<xsl:text>-control</xsl:text>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:attribute name="ContextGuid">
				<xsl:value-of select="$ContextGuid"/>
			</xsl:attribute>
			<xsl:call-template name="AddAttributes">
				<xsl:with-param name="ObjectDisplayName" select="$ObjectDisplayName" />
			</xsl:call-template>
		</xsl:element>
	</xsl:template>

	<!-- Object Property Template -->
	<xsl:template  match="Item[@ItemType='ObjectProperty' or @ItemType= 'MethodRequiredProperty' or @ItemType= 'MethodOptionalProperty' or @ItemType= 'MethodReturnedProperty' or @ItemType= 'MethodParameter']">
		<xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
		<xsl:param name="ContextGuid"></xsl:param>
		<xsl:param name="ObjectDisplayName"/>
		<xsl:element name="Item">
			<xsl:attribute name="InstanceID">
				<xsl:value-of select="$InstanceID"/>
			</xsl:attribute>
			<xsl:attribute name="SubFormID">
				<xsl:value-of select="$SubFormID"/>
			</xsl:attribute>
			<xsl:attribute name="Icon">
				<xsl:choose>
					<xsl:when test="@SubType = 'AutoGuid' or @SubType = 'autoguid'">
						<xsl:text>auto-guid</xsl:text>
					</xsl:when>
					<xsl:when test="@SubType = 'AutoNumber' or @SubType = 'autonumber' or @SubType = 'Autonumber'">
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
					<xsl:when test="@SubType = 'HyperLink' or @SubType = 'hyperlink' or @SubType = 'Hyperlink' or @SubType = 'hyperLink'">
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
					<xsl:when test="@SubType = 'MultiValue' or @SubType = 'multiValue' or @SubType = 'Multivalue'  or @SubType = 'multivalue'">
						<xsl:text>multi-value</xsl:text>
					</xsl:when>
					<xsl:when test="@SubType = 'Text' or @SubType = 'text'">
						<xsl:text>text</xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>text</xsl:text>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:if test="Item[@ItemType='MethodRequiredProperty']">
				<xsl:attribute name="IsRequired">
					<xsl:text>True</xsl:text>
				</xsl:attribute>
			</xsl:if>
			<xsl:attribute name="ContextGuid">
				<xsl:value-of select="$ContextGuid"/>
			</xsl:attribute>
			<xsl:call-template name="AddAttributes">
				<xsl:with-param name="ObjectDisplayName" select="$ObjectDisplayName" />
			</xsl:call-template>
		</xsl:element>
	</xsl:template>

	<!-- Object Method Template -->
	<xsl:template  match="Item[(@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod') and @SubType='list']">
		<xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
		<xsl:param name="ContextGuid"></xsl:param>
		<xsl:param name="ObjectDisplayName"/>
		<xsl:apply-templates select="Items/Item[@ItemType='MethodReturnedProperty']">
			<!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
			<xsl:with-param name="InstanceID" select="$InstanceID"></xsl:with-param>
			<xsl:with-param name="ContextGuid" select="$ContextGuid"></xsl:with-param>
			<xsl:with-param name="ObjectDisplayName" select="$ObjectDisplayName" />
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template name="AddAttributes">
		<xsl:param name="ObjectDisplayName"/>
		<xsl:for-each select="./@*">
			<xsl:variable name="nodeName">
				<xsl:value-of select="local-name()"/>
			</xsl:variable>
			<xsl:attribute name="{$nodeName}">
				<xsl:value-of select="."/>
			</xsl:attribute>
		</xsl:for-each>
		<xsl:for-each select="./*">
			<xsl:choose>
				<xsl:when test="local-name() = 'DisplayName'">
					<xsl:element name="DisplayName">
						<xsl:value-of select="."/>
					</xsl:element>
					<xsl:element name="ToolTip">
						<xsl:value-of select="$ObjectDisplayName"/>
						<xsl:text> - </xsl:text>
						<xsl:value-of select="."/>
					</xsl:element>
				</xsl:when>
				<xsl:when test="local-name() != 'Items'">
					<xsl:variable name="nodeName">
						<xsl:value-of select="local-name()"/>
					</xsl:variable>
					<xsl:element name="{$nodeName}">
						<xsl:value-of select="."/>
					</xsl:element>
				</xsl:when>
			</xsl:choose>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>
