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
		<xsl:element name="div">
			<xsl:attribute name="id">
				<xsl:text>MethodParent</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:text>dataitemcontainer</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="allows">
				<xsl:text>method</xsl:text>
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
			<xsl:apply-templates select="smartobject/smartobjectroot/methods/method"/>
		</xsl:element>

	</xsl:template>

	<xsl:template match="smartobject/smartobjectroot/methods/method">
		<xsl:variable name="MethodId" select="@name"/>
		<xsl:variable name="MethodFriendlyName" select="metadata/display/displayname"/>
		<xsl:variable name="thissoguid" select="../../../smartobjectroot/@guid"/>
		<xsl:choose>
			<xsl:when test="$isListing = '1'">
				<xsl:element name="div">
					<xsl:attribute name="id">
						<xsl:text>method_</xsl:text>
						<xsl:value-of select="$MethodId"/>
					</xsl:attribute>
					<xsl:attribute name="class">
						<xsl:text>draggable toolboxitem </xsl:text> 
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:attribute name="itemtype">
						<xsl:text>method</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="methodtype">
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:attribute name="inputproperties">
						<xsl:apply-templates select="input/property" mode="method"/>
					</xsl:attribute>
					<xsl:attribute name="references">
						<xsl:text></xsl:text>
					</xsl:attribute>
					<xsl:attribute name="soid">
						<xsl:value-of select="$thissoguid"/>
					</xsl:attribute>
					<xsl:attribute name="methodid">
						<xsl:value-of select="$MethodId"/>
					</xsl:attribute>
					<xsl:attribute name="friendlyname">
						<xsl:value-of select="$MethodFriendlyName"/>
					</xsl:attribute>
					<xsl:attribute name="title">
						<xsl:value-of select="$MethodFriendlyName"/>
					</xsl:attribute>
					<xsl:choose>
						<xsl:when test="@type != 'list'">
							<xsl:attribute name="style">
								<xsl:text>display: none</xsl:text>
							</xsl:attribute>
							<xsl:attribute name="available">
								<xsl:text>false</xsl:text>
							</xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="available">
								<xsl:text>true</xsl:text>
							</xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
		  <xsl:value-of select="$MethodFriendlyName"/>
				</xsl:element>
			</xsl:when>
			<xsl:when test="$isListing = '0'">
				<xsl:element name="div">
					<xsl:attribute name="id">
						<xsl:text>method_</xsl:text>
						<xsl:value-of select="$MethodId"/>
					</xsl:attribute>
					<xsl:attribute name="class">
						<xsl:text>draggable toolboxitem </xsl:text> 
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:attribute name="itemtype">
						<xsl:text>method</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="methodtype">
						<xsl:value-of select="@type"/>
					</xsl:attribute>
					<xsl:attribute name="inputproperties">
						<xsl:apply-templates select="input/property" mode="method"/>
					</xsl:attribute>
					<xsl:attribute name="custom">
						<xsl:value-of select="$MethodId"/>
						<xsl:text>~button~</xsl:text>
						<xsl:text>~method</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="references">
						<xsl:text></xsl:text>
					</xsl:attribute>
					<xsl:attribute name="soid">
						<xsl:value-of select="$thissoguid"/>
					</xsl:attribute>
					<xsl:attribute name="methodid">
						<xsl:value-of select="$MethodId"/>
					</xsl:attribute>
					<xsl:attribute name="friendlyname">
						<xsl:value-of select="$MethodFriendlyName"/>
					</xsl:attribute>
					<xsl:choose>
						<xsl:when test="@type = 'list'">
							<xsl:attribute name="style">
								<xsl:text>display: none</xsl:text>
							</xsl:attribute>
							<xsl:attribute name="available">
								<xsl:text>false</xsl:text>
							</xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="available">
								<xsl:text>true</xsl:text>
							</xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
		  <xsl:value-of select="$MethodFriendlyName"/>
				</xsl:element>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="input/property" mode="method">
		<xsl:variable name="thisName" select="@name"/>
		<xsl:choose>
			<xsl:when test="count(../../requiredproperties/property[@name=$thisName]) &gt; 0">
				<xsl:text>*_</xsl:text>
			</xsl:when>
		</xsl:choose>
		<xsl:value-of select="@name"/>
		<xsl:text>,</xsl:text>
	</xsl:template>
</xsl:stylesheet>