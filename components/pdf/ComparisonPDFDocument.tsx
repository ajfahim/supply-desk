import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { IProductComparison } from '@/lib/models/ProductComparison';

// Register fonts (optional - you can use system fonts)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  companyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e40af',
  },
  companySubtitle: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 500,
  },
  metaText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  productSection: {
    marginBottom: 30,
    pageBreakInside: false,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  comparisonTable: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#d1d5db',
    minHeight: 140,
  },
  tableCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'flex-start',
  },
  tableCellImage: {
    width: 120,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'flex-start',
  },
  tableCellSmall: {
    width: 80,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'flex-start',
  },
  tableCellMedium: {
    width: 100,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'flex-start',
  },
  tableCellLarge: {
    flex: 2,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'flex-start',
  },
  tableCellNotes: {
    width: 60,
    padding: 8,
    justifyContent: 'flex-start',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },
  brandText: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 4,
  },
  modelText: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: 600,
    color: '#059669',
    marginTop: 4,
  },
  productImage: {
    width: 100,
    height: 100,
    objectFit: 'cover',
    marginBottom: 8,
    alignSelf: 'center',
  },
  noImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  noImageText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface ComparisonPDFDocumentProps {
  title: string;
  clientName?: string;
  requirementId?: string;
  comparisons: IProductComparison[];
  createdBy: string;
  createdAt: Date;
}

export const ComparisonPDFDocument: React.FC<ComparisonPDFDocumentProps> = ({
  title,
  clientName,
  requirementId,
  comparisons,
  createdBy,
  createdAt,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {clientName && (
            <Text style={styles.subtitle}>Client: {clientName}</Text>
          )}
          {requirementId && (
            <Text style={styles.subtitle}>Requirement ID: {requirementId}</Text>
          )}
          
          <View style={styles.headerInfo}>
            <View>
              <Text style={styles.metaText}>Generated: {formatDate(createdAt)}</Text>
              <Text style={styles.metaText}>By: {createdBy}</Text>
            </View>
          </View>
        </View>

        {/* Product Comparisons */}
        {comparisons.map((comparison, index) => (
          <View key={index} style={styles.productSection} wrap={false}>
            <Text style={styles.productTitle}>{comparison.productName}</Text>
            
            {comparison.items.length > 0 && (
              <View style={styles.comparisonTable}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <View style={styles.tableCellImage}>
                    <Text style={styles.headerText}>Image</Text>
                  </View>
                  <View style={styles.tableCellMedium}>
                    <Text style={styles.headerText}>Brand & Model</Text>
                  </View>
                  <View style={styles.tableCellLarge}>
                    <Text style={styles.headerText}>Specifications</Text>
                  </View>
                  <View style={styles.tableCellSmall}>
                    <Text style={styles.headerText}>Price</Text>
                  </View>
                  <View style={styles.tableCellNotes}>
                    <Text style={styles.headerText}>Notes</Text>
                  </View>
                </View>

                {/* Table Rows */}
                {comparison.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.tableRow}>
                    {/* Image Cell */}
                    <View style={styles.tableCellImage}>
                      {item.image ? (
                        <Image src={item.image} style={styles.productImage} />
                      ) : (
                        <View style={styles.noImagePlaceholder}>
                          <Text style={styles.noImageText}>No Image</Text>
                        </View>
                      )}
                    </View>

                    {/* Brand & Model Cell */}
                    <View style={styles.tableCellMedium}>
                      <Text style={styles.brandText}>{item.brand}</Text>
                      <Text style={styles.modelText}>{item.model}</Text>
                    </View>

                    {/* Specifications Cell */}
                    <View style={styles.tableCellLarge}>
                      <Text style={styles.cellText}>{item.specifications}</Text>
                    </View>

                    {/* Price Cell */}
                    <View style={styles.tableCellSmall}>
                      <Text style={styles.priceText}>
                        {formatPrice(item.price, item.currency)}
                      </Text>
                    </View>

                    {/* Notes Cell */}
                    <View style={styles.tableCellNotes}>
                      <Text style={styles.cellText}>{item.notes || '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          This comparison report was generated by Supply Desk - Steelroot Traders
        </Text>
      </Page>
    </Document>
  );
};
