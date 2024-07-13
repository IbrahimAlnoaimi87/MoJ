<!---This xslt file converts a single (source) xml island files to html that will be displayed-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html"/>
	<xsl:param name="soguid"/>
	<xsl:param name="isListing"/>

	<!--Entrypoint-->
	<xsl:template match="/">
		<xsl:variable name="thissoguid" select="smartobject/smartobjectroot/@guid"/>
		<xsl:variable name="thissoname" select="smartobject/smartobjectroot/@name"/>
		<xsl:variable name="thissofriendlyname" select="smartobject/smartobjectroot/metadata/display/displayname"/>
		<xsl:variable name="thissodescription" select="smartobject/smartobjectroot/metadata/display/description"/>
		<xsl:variable name="isextendable" select="smartobject/smartobjectroot/@isextendible"/>

		<xsl:element name="div">
			<xsl:attribute name="id">
				<xsl:text>PropParent</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:text>dataitemcontainer</xsl:text>
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
			<xsl:attribute name="sofriendlyname">
				<xsl:value-of select="$thissofriendlyname"/>
			</xsl:attribute>
			<xsl:attribute name="sodescription">
				<xsl:value-of select="$thissodescription"/>
			</xsl:attribute>
			<xsl:attribute name="isextendible">
				<xsl:value-of select="$isextendable"/>
			</xsl:attribute>
			<xsl:apply-templates select="smartobject/smartobjectroot/properties/property"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="smartobject/smartobjectroot/properties/property">
		<xsl:variable name="thissoguid" select="../../../smartobjectroot/@guid"/>
		<xsl:variable name="propertyName" select="@name" />
		<xsl:choose>
			<xsl:when test="@system = 'false'">
				<xsl:element name="div">
					<xsl:attribute name="id">
						<xsl:text>property_</xsl:text>
						<xsl:value-of select="@name"/>
					</xsl:attribute>
					<xsl:attribute name="class">
						<xsl:text>draggable toolboxitem </xsl:text> 
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:attribute name="itemtype">
						<xsl:text>property</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="friendlyname">
						<xsl:value-of select="metadata/display/displayname"/>
					</xsl:attribute>
					<xsl:attribute name="propertyid">
						<xsl:value-of select="@name"/>
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
					<xsl:attribute name="soid">
						<xsl:value-of select="$thissoguid"/>
					</xsl:attribute>
					<xsl:attribute name="references">
						<xsl:choose>
							<xsl:when test="count(associations/association) &gt; 0">
								<xsl:apply-templates select="associations/association">
									<xsl:with-param name="propName" select="$propertyName" />
								</xsl:apply-templates>
							</xsl:when>
							<xsl:otherwise>
								<xsl:text></xsl:text>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
					<xsl:attribute name="title">
						<xsl:value-of select="metadata/display/displayname"/>
						<xsl:text> - Type: </xsl:text>
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:value-of select="metadata/display/displayname"/>
				</xsl:element>
			</xsl:when>
			<xsl:when test="@system = 'true'">
				<xsl:element name="div">
					<xsl:attribute name="id">
						<xsl:text>property_</xsl:text>
						<xsl:value-of select="@name"/>
					</xsl:attribute>
					<xsl:attribute name="class">
						<xsl:text>draggable toolboxitem </xsl:text> 
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:attribute name="itemtype">
						<xsl:text>property</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="friendlyname">
						<xsl:value-of select="metadata/display/displayname"/>
					</xsl:attribute>
					<xsl:attribute name="propertyid">
						<xsl:value-of select="@name"/>
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
					<xsl:attribute name="soid">
						<xsl:value-of select="$thissoguid"/>
					</xsl:attribute>
					<xsl:attribute name="references">
						<xsl:choose>
							<xsl:when test="count(associations/association) &gt; 0">
								<xsl:apply-templates select="associations/association">
									<xsl:with-param name="propertyName" select="@name" />
								</xsl:apply-templates>
							</xsl:when>
							<xsl:otherwise>
								<xsl:text></xsl:text>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
					<xsl:attribute name="title">
						<xsl:value-of select="metadata/display/displayname"/>
						<xsl:text> - Type: </xsl:text>
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

	<xsl:template match="associations/association">
		<xsl:param name="propName" />
		<xsl:variable name="ReferencedName" select="@name" />
		<xsl:variable name="PropertyName" select="../../../property[@name='$propName']" />
		<xsl:variable name="ReferencedSOName" select="../../../../associations/association[@name=$ReferencedName]/@soname"/>
		<xsl:variable name="ReferenceGUID" select="../../../../associations/association[@name=$ReferencedName]/@guid" />
		<xsl:variable name="ParentProp" select="../../../../associations/association[@name=$ReferencedName]/properties/property/@name" />
		<xsl:variable name="MapToProp" select="$propName" />
		<xsl:variable name="ReferenceFriendlyName" select="../../../../../associations/smartobjectroot[@name=$ReferencedSOName and @guid=$ReferenceGUID]/metadata/display/displayname" />
		<xsl:value-of select="$ReferencedSOName"/>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$ReferenceFriendlyName"/>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$ReferenceGUID"/>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$ParentProp"/>
		<xsl:text>|</xsl:text>
		<xsl:value-of select="$MapToProp"/>
		<xsl:text>|</xsl:text>
		<xsl:for-each select="../../../../../associations/smartobjectroot[@name=$ReferencedSOName and @guid=$ReferenceGUID]/methods/method">
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
	</xsl:template>
</xsl:stylesheet>