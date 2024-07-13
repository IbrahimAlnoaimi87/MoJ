<!---This xslt file converts a single (source) xml island files to html that will be displayed-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html"/>
	<xsl:param name="soguid"/>
	<xsl:param name="isListing"/>

	<!--Entrypoint-->
	<xsl:template match="/">
		<xsl:variable name="thissoguid" select="smartobject/smartobjectroot/@guid"/>
		<xsl:variable name="thissoname" select="smartobject/smartobjectroot/@name"/>
		<xsl:variable name="isextendable" select="smartobject/smartobjectroot/@isextendible"/>

		<div style="padding-left: 4px; width: 100%;">
			<table id="tblSystemProperties" cellpadding="0" cellspacing="0" style="width: 96%; min-width: 100%">
				<tr>
					<td>
						<xsl:element name="div">
							<xsl:attribute name="id">
								<xsl:text>SystemPropParent</xsl:text>
							</xsl:attribute>
							<xsl:attribute name="class">
								<xsl:text>scrollDiv</xsl:text>
							</xsl:attribute>
							<xsl:attribute name="style">
								<xsl:text>height: expression(document.documentElement.clientHeight - 322); width: 100%</xsl:text>
							</xsl:attribute>
							<xsl:attribute name="allows">
								<xsl:text>property</xsl:text>
							</xsl:attribute>
							<xsl:attribute name="soguid">
								<xsl:value-of select="$thissoguid"/>
							</xsl:attribute>
							<xsl:attribute name="soname">
								<xsl:value-of select="$thissoname"/>
							</xsl:attribute>
							<xsl:attribute name="isextendible">
								<xsl:value-of select="$isextendable"/>
							</xsl:attribute>
							<xsl:apply-templates select="smartobject/smartobjectroot/properties/property"/>
						</xsl:element>
					</td>
				</tr>
			</table>
		</div>
	</xsl:template>

	<xsl:template match="smartobject/smartobjectroot/properties/property">
		<xsl:choose>
			<xsl:when test="@system = 'true'">
				<xsl:element name="div">
					<xsl:attribute name="id">
						<xsl:value-of select="@name"/>
					</xsl:attribute>
					<xsl:attribute name="class">
						<xsl:text>draggable</xsl:text> 
					</xsl:attribute>
					<xsl:attribute name="onmousedown">
						<xsl:text>startD()</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="ondragend">
						<xsl:text>release()</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="ondragstart">
						<xsl:text>fnHandleDragStart()</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="custom">
						<xsl:value-of select="@name"/>
						<xsl:text>~</xsl:text>
						<xsl:choose>
							<xsl:when test="$isListing = 'true'">
								<xsl:text>Div</xsl:text>
							</xsl:when>
							<xsl:otherwise>
								<xsl:text>Textbox</xsl:text>
							</xsl:otherwise>
						</xsl:choose>
						<xsl:text>~~property</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="friendlyname">
						<xsl:value-of select="metadata/display/displayname"/>
					</xsl:attribute>
					<xsl:attribute name="propertytype">
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:attribute name="isunique">
						<xsl:value-of select="@unique"/>
					</xsl:attribute>
					<xsl:attribute name="issystem">
						<xsl:value-of select="@system"/>
					</xsl:attribute>					
					<xsl:attribute name="isnew">
						<xsl:text>false</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="references">
						<xsl:choose>
							<xsl:when test="count(metadata/associations/association) &gt; 0">
								<xsl:apply-templates select="metadata/associations/association"/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:text></xsl:text>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
					<xsl:attribute name="title">
						<xsl:text>Type: </xsl:text>
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:value-of select="metadata/display/displayname"/>
				</xsl:element>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="input/property" mode="referencemethod">
		<xsl:variable name="PropertyName" select="@name"/>
		<xsl:variable name="PropertyFriendlyName" select="../../../../properties/property[@name=$PropertyName]/metadata/display/displayname"/>
		<xsl:value-of select="$PropertyName"/>
		<xsl:text>]</xsl:text>
		<xsl:value-of select="$PropertyFriendlyName"/>
		<xsl:text>]</xsl:text>
		<xsl:text>~</xsl:text>
	</xsl:template>

	<xsl:template match="metadata/associations/association">
		<xsl:variable name="ReferencedName" select="../association"/>
		<xsl:variable name="ReferenceGUID" select="../../../../../associations/association[@name=$ReferencedName]/@guid" />
		<xsl:variable name="ParentProp" select="../../../../../associations/association[@name=$ReferencedName]/properties/property/@name" />
		<xsl:variable name="MapToProp" select="../../../../../associations/association[@name=$ReferencedName]/properties/property/@mapto" />
		<xsl:variable name="ReferenceFriendlyName" select="../../../../../../associations/smartobjectroot[@name=$ReferencedName and @guid=$ReferenceGUID]/metadata/display/displayname" />
		<xsl:value-of select="$ReferencedName"/>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$ReferenceFriendlyName"/>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$ReferenceGUID"/>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$MapToProp"/>
		<xsl:text>|</xsl:text>
		<xsl:for-each select="../../../../../../associations/smartobjectroot[@name=$ReferencedName and @guid=$ReferenceGUID]/methods/method">
			<xsl:variable name="MethodName" select="@name"/>
			<xsl:variable name="MethodType" select="@type"/>
			<xsl:variable name="MethodFriendlyName" select="metadata/display/displayname"/>
			<xsl:if test="$MethodType = 'list'">
				<xsl:value-of select="$MethodName"/>
				<xsl:text>[</xsl:text>
				<xsl:value-of select="$MethodFriendlyName"/>
				<xsl:text>[</xsl:text>
				<xsl:apply-templates select="input/property" mode="referencemethod"/>
			</xsl:if>
		</xsl:for-each>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$ParentProp"/>
	</xsl:template>
</xsl:stylesheet>