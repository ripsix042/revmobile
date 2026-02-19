import { useCallback, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';

import { GlassCardBase } from '../constants/theme';
import { productsApi } from '@/utils/api';
import { formatCurrency } from '../utils/format';

type Product = {
  id: number | string;
  name: string;
  sellingPrice: number;
  quantity: number;
  lowStockLevel: number;
};

export default function LowStockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLowStock = useCallback(async () => {
    try {
      const list = await productsApi.list();
      const lowStock = list
        .filter((p) => p.quantity <= (p.lowStockLevel ?? 0))
        .map((p) => ({
          id: p.id,
          name: p.name,
          sellingPrice: p.sellingPrice,
          quantity: p.quantity,
          lowStockLevel: p.lowStockLevel ?? 0,
        }))
        .sort((a, b) => a.quantity - b.quantity);
      setProducts(lowStock);
    } catch {
      setProducts([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLowStock();
    setRefreshing(false);
  }, [loadLowStock]);

  useFocusEffect(
    useCallback(() => {
      loadLowStock();
    }, [loadLowStock])
  );

  return (
    <ImageBackground
      source={require('../assets/images/omyre1.png')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="contain"
    >
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 50 }]}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color="#2f2f3a" />
          </Pressable>
          <Text style={styles.title}>Low Stock Alerts</Text>
          <View style={styles.headerSpacer} />
        </View>

        {products.length === 0 ? (
          <Animated.Text entering={FadeIn} style={styles.emptyText}>
            No low stock items right now.
          </Animated.Text>
        ) : (
          products.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 40)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.productRow}>
                  <View style={styles.iconBadge}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#b5535a" />
                  </View>
                  <View>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.priceText}>{formatCurrency(item.sellingPrice)}</Text>
                  </View>
                </View>
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>
                    Low stock
                  </Text>
                </View>
              </View>
              <Text style={styles.quantityText}>In stock: {item.quantity}</Text>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
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
  listContent: {
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Merriweather',
    fontSize: 20,
    fontWeight: '600',
    color: '#2f2f3a',
    marginBottom: 12,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerSpacer: {
    width: 60,
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
  emptyText: {
    textAlign: 'center',
    color: '#7a7a8a',
    marginTop: 24,
  },
  card: {
    ...GlassCardBase,
    padding: 16,
    marginBottom: 12,
    borderColor: 'rgba(108, 148, 214, 0.95)',
    backgroundColor: 'rgba(108, 148, 214, 0.29)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fde7e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontFamily: 'Merriweather',
    fontSize: 16,
    fontWeight: '600',
    color: '#2f2f3a',
  },
  priceText: {
    fontSize: 14,
    color: '#6b6b7b',
    marginTop: 2,
  },
  lowStockBadge: {
    backgroundColor: '#fde7e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lowStockText: {
    fontSize: 12,
    color: '#b5535a',
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 14,
    color: '#6b6b7b',
  },
});
