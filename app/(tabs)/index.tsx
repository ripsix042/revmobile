import { useCallback, useState } from 'react';
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeBottomTabBarHeight } from '@/hooks/use-safe-bottom-tab-bar-height';
import { Link, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { GlassCardBase } from '../../constants/theme';
import { dashboardApi } from '@/utils/api';
import { formatCurrency } from '../../utils/format';

type DashboardStats = {
  todaySales: number;
  monthlySales: number;
  lowStockCount: number;
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useSafeBottomTabBarHeight();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    monthlySales: 0,
    lowStockCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats({
        todaySales: data.todaySales,
        monthlySales: data.monthlySales,
        lowStockCount: data.lowStockCount,
      });
    } catch {
      setStats({
        todaySales: 0,
        monthlySales: 0,
        lowStockCount: 0,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  return (
    <ImageBackground
      source={require('../../assets/images/omyre1.png')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="contain"
    >
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 50 }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + tabBarHeight }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Dashboard</Text>

        <Animated.View entering={FadeIn.delay(40)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Sales</Text>
            <View style={[styles.iconBadge, styles.iconBadgePeach]}>
              <MaterialCommunityIcons name="cash" size={18} color="#c45a59" />
            </View>
          </View>
          <Text style={styles.cardValue}>{formatCurrency(stats.todaySales)}</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(80)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Sales</Text>
            <View style={[styles.iconBadge, styles.iconBadgeBlue]}>
              <MaterialCommunityIcons name="calendar-month" size={18} color="#5476b4" />
            </View>
          </View>
          <Text style={styles.cardValue}>{formatCurrency(stats.monthlySales)}</Text>
        </Animated.View>

        <Link href="/products?tab=inactive" asChild>
          <Pressable>
            <Animated.View entering={FadeIn.delay(120)} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Low Stock Alerts</Text>
                <View style={[styles.iconBadge, styles.iconBadgePink]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#d16a9d" />
                </View>
              </View>
              <Text style={styles.cardValue}>{stats.lowStockCount ?? 0} Products</Text>
            </Animated.View>
          </Pressable>
        </Link>

        <View style={styles.actionsRow}>
        <Link href="/new-sale" asChild>
          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>New Sale</Text>
          </Pressable>
        </Link>

        <Link href="/products" asChild>
          <Pressable accessibilityRole="button" style={styles.secondaryButton}>
            <MaterialCommunityIcons name="package-variant" size={18} color="#5a5a73" />
            <Text style={styles.secondaryButtonText}>Add Product</Text>
          </Pressable>
        </Link>
        </View>
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
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Merriweather',
    fontSize: 30,
    fontWeight: '900',
    color: '#2f2f3a',
    marginBottom: 14,
  },
  card: {
    ...GlassCardBase,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: 'Merriweather',
    fontSize: 14,
    color: '#4a4a5f',
  },
  cardValue: {
    fontFamily: 'Merriweather',
    fontSize: 22,
    fontWeight: '600',
    color: '#2f2f3a',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgePeach: {
    backgroundColor: 'rgba(253,230,226,0.9)',
  },
  iconBadgeBlue: {
    backgroundColor: 'rgba(231,240,255,0.9)',
  },
  iconBadgePink: {
    backgroundColor: 'rgba(248,231,241,0.9)',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    ...GlassCardBase,
    backgroundColor: 'rgba(214, 108, 120, 0.66)',
    borderColor: 'rgba(214, 108, 120, 0.95)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    ...GlassCardBase,
    backgroundColor: 'rgba(108, 148, 214, 0.66)',
    borderColor: 'rgba(108, 148, 214, 0.95)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Merriweather',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
