import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ReceiptModal } from '@/components/receipt-modal';
import { GlassCardBase } from '../../constants/theme';
import { invoicesApi } from '@/utils/api';
import { formatCurrency } from '../../utils/format';
import type { ReceiptItem } from '../../utils/receipt';

type Invoice = {
  id: number | string;
  invoiceNumber?: string;
  totalAmount: number;
  createdAt: string;
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function MonthlyInvoicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { month, year } = useLocalSearchParams<{ month?: string; year?: string }>();
  const monthNum = Number(month);
  const yearNum = Number(year);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSharingInvoiceId, setIsSharingInvoiceId] = useState<number | string | null>(null);
  const [receiptModal, setReceiptModal] = useState<{
    invoice: Invoice;
    items: ReceiptItem[];
  } | null>(null);

  const monthLabel = months[monthNum - 1] ?? `Month ${monthNum}`;

  const loadInvoices = useCallback(async () => {
    if (!monthNum || !yearNum || Number.isNaN(monthNum) || Number.isNaN(yearNum)) {
      setInvoices([]);
      return;
    }
    try {
      const list = await invoicesApi.list();
      const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      const filtered = list
        .filter((inv) => {
          const t = new Date(inv.createdAt).getTime();
          return t >= startTime && t < endTime;
        })
        .map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: inv.totalAmount,
          createdAt: inv.createdAt,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(filtered);
    } catch {
      setInvoices([]);
    }
  }, [monthNum, yearNum]);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  }, [loadInvoices]);

  const handleOpenReceipt = async (invoice: Invoice) => {
    setIsSharingInvoiceId(invoice.id);
    try {
      const full = await invoicesApi.getOne(invoice.id);
      if (!full) {
        setReceiptModal({ invoice, items: [] });
        return;
      }
      const items: ReceiptItem[] = (full.items ?? []).map((row) => ({
        productName: row.productName ?? '',
        quantity: row.quantity,
        price: row.price,
      }));
      setReceiptModal({ invoice, items });
    } catch (error) {
      console.warn('Failed to load receipt', error);
    } finally {
      setIsSharingInvoiceId(null);
    }
  };

  return (
    <>
    <ImageBackground
      source={require('../../assets/images/omyre1.png')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="contain"
    >
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 50 }]}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color="#2f2f3a" />
        </Pressable>
        <Text style={styles.title}>
          {monthLabel} {yearNum}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {invoices.length === 0 ? (
          <Animated.Text entering={FadeIn} style={styles.emptyText}>
            No invoices for this month.
          </Animated.Text>
        ) : (
          invoices.map((item, index) => (
            <Link key={item.id} href={`/invoice/${item.id}` as any} asChild>
              <Pressable style={styles.card}>
                <Animated.View entering={FadeInDown.delay(index * 40)}>
                  <View style={styles.cardContent}>
                    <View>
                      <Text style={styles.invoiceTitle}>
                        Invoice #{item.invoiceNumber ?? item.id}
                      </Text>
                      <Text style={styles.invoiceDetail}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.amountAndShareRow}>
                      <Text style={styles.invoiceAmount}>{formatCurrency(item.totalAmount)}</Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>
            </Link>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
    {receiptModal && (
      <ReceiptModal
        visible={!!receiptModal}
        onClose={() => setReceiptModal(null)}
        invoice={{
          id: receiptModal.invoice.invoiceNumber ?? receiptModal.invoice.id,
          createdAt: receiptModal.invoice.createdAt,
          totalAmount: receiptModal.invoice.totalAmount,
        }}
        items={receiptModal.items}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    backgroundColor: '#f6b9fa',
    width: '100%',
    height: '100%',
  },
  backgroundImage: { 
    opacity: 0.8,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Merriweather',
    fontSize: 24,
    fontWeight: '600',
    color: '#2f2f3a',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    ...GlassCardBase,
    padding: 14,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceTitle: {
    fontFamily: 'Merriweather',
    fontSize: 16,
    fontWeight: '600',
    color: '#2f2f3a',
  },
  invoiceDetail: {
    fontSize: 14,
    color: '#6b6b7b',
  },
  invoiceAmount: {
    fontSize: 16,
    color: '#2f2f3a',
    fontWeight: '600',
  },
  amountAndShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#eef1f7',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
});
