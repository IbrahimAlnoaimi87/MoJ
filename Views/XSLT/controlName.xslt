<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl" xmlns:fn="http://www.w3.org/2005/xpath-functions">

	<xsl:output method="xml" indent="no"/>
	<xsl:output omit-xml-declaration="yes"/>
	<xsl:param name="controlName"></xsl:param>
	<xsl:param name="controlSuffix"></xsl:param>

	<xsl:template match="/">

		<xsl:apply-templates select="SourceCode.Forms/Views/View/Controls"></xsl:apply-templates>
	</xsl:template>

	<xsl:template match="Controls">
		<xsl:call-template name="IsNameUnique">
			<xsl:with-param name="name">
				<xsl:value-of select="$controlName"/>
			</xsl:with-param>
			<xsl:with-param name="suffix">
				<xsl:value-of select="$controlSuffix"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="IsNameUnique">
		<xsl:param name="name">
			<xsl:value-of select="$controlName"/>
		</xsl:param>
		<xsl:param name="suffix">
			<xsl:value-of select="$controlSuffix"/>
		</xsl:param>
		<xsl:choose>
			<xsl:when test="Control[Name = concat($name, $suffix)]">
				<xsl:call-template name="IsNameUnique">
					<xsl:with-param name="name">
						<xsl:value-of select="$name"/>
					</xsl:with-param>
					<xsl:with-param name="suffix">
						<xsl:choose>
							<xsl:when test="string-length($suffix) = 0">1</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="number($suffix) + number(1)"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:element name="Name">
					<xsl:value-of select="concat($name, $suffix)"/>
				</xsl:element>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
