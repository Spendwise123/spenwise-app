import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

export default function HomeScreen() {
    const { currentUser, logout, authFetch } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        investments: { totalValue: 0, totalProfitLoss: 0 },
        savings: { totalSaved: 0, activeGoals: 0 },
        loans: { totalRemaining: 0, activeLoans: 0 },
        budgets: { totalSpent: 0, totalLimit: 0 },
    });

    const fetchSummary = async () => {
        try {
            const [invRes, savRes, loanRes, budRes] = await Promise.all([
                authFetch('/investments/summary'),
                authFetch('/savings/summary'),
                authFetch('/loans/summary'),
                authFetch('/budgets/summary'),
            ]);

            const inv = invRes.ok ? await invRes.json() : { totalValue: 0, totalProfitLoss: 0, count: 0 };
            const sav = savRes.ok ? await savRes.json() : { totalSaved: 0, activeGoals: 0 };
            const loan = loanRes.ok ? await loanRes.json() : { totalRemaining: 0, activeLoans: 0 };
            const bud = budRes.ok ? await budRes.json() : { totalSpent: 0, totalLimit: 0 };

            setSummary({ 
                investments: inv, 
                savings: sav, 
                loans: loan, 
                budgets: bud 
            });
        } catch (err) {
            console.log('Error fetching summary:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSummary();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSummary();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const netWorth = (summary.investments.totalValue || 0) +
        (summary.savings.totalSaved || 0) -
        (summary.loans.totalRemaining || 0);

    const quickActions = [
        { icon: 'trending-up', label: 'Invest', color: COLORS.primary, route: '/(tabs)/investments' },
        { icon: 'wallet', label: 'Save', color: COLORS.secondary, route: '/(tabs)/savings' },
        { icon: 'cash', label: 'Loan', color: COLORS.accent, route: '/(tabs)/loans' },
        { icon: 'pie-chart', label: 'Budget', color: COLORS.info, route: '/(tabs)/budget' },
    ];

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {currentUser?.name?.split(' ')[0]} 👋</Text>
                    <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Net Worth Card */}
            <View style={styles.netWorthCard}>
                <Text style={styles.netWorthLabel}>Net Worth</Text>
                <Text style={styles.netWorthValue}>₱{netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                <View style={styles.netWorthRow}>
                    <View style={styles.netWorthItem}>
                        <Ionicons name="arrow-up-circle" size={16} color={COLORS.success} />
                        <Text style={styles.netWorthItemText}>
                            ₱{(summary.investments.totalProfitLoss || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                    <Text style={styles.netWorthDivider}>|</Text>
                    <View style={styles.netWorthItem}>
                        <Text style={styles.netWorthSubLabel}>Portfolio P/L</Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
                {quickActions.map((action) => (
                    <TouchableOpacity
                        key={action.label}
                        style={styles.quickActionBtn}
                        onPress={() => router.push(action.route)}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                            <Ionicons name={action.icon} size={24} color={action.color} />
                        </View>
                        <Text style={styles.quickActionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Summary Cards */}
            <Text style={styles.sectionTitle}>Overview</Text>

            <View style={styles.summaryGrid}>
                <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(tabs)/investments')}>
                    <View style={[styles.summaryIconWrap, { backgroundColor: COLORS.primary + '20' }]}>
                        <Ionicons name="trending-up" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.summaryLabel}>Investments</Text>
                    <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                        ₱{(summary.investments.totalValue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={[styles.summaryChange, {
                        color: (summary.investments.totalProfitLoss || 0) >= 0 ? COLORS.success : COLORS.danger
                    }]}>
                        {(summary.investments.totalProfitLoss || 0) >= 0 ? '+' : ''}
                        ₱{(summary.investments.totalProfitLoss || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(tabs)/savings')}>
                    <View style={[styles.summaryIconWrap, { backgroundColor: COLORS.secondary + '20' }]}>
                        <Ionicons name="wallet" size={20} color={COLORS.secondary} />
                    </View>
                    <Text style={styles.summaryLabel}>Savings</Text>
                    <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                        ₱{(summary.savings.totalSaved || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={styles.summarySubtext}>{summary.savings.activeGoals || 0} active goals</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(tabs)/loans')}>
                    <View style={[styles.summaryIconWrap, { backgroundColor: COLORS.accent + '20' }]}>
                        <Ionicons name="cash" size={20} color={COLORS.accent} />
                    </View>
                    <Text style={styles.summaryLabel}>Loans</Text>
                    <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                        ₱{(summary.loans.totalRemaining || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={styles.summarySubtext}>{summary.loans.activeLoans || 0} active</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(tabs)/budget')}>
                    <View style={[styles.summaryIconWrap, { backgroundColor: COLORS.info + '20' }]}>
                        <Ionicons name="pie-chart" size={20} color={COLORS.info} />
                    </View>
                    <Text style={styles.summaryLabel}>Budget Used</Text>
                    <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                        ₱{(summary.budgets.totalSpent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={styles.summarySubtext}>
                        of ₱{(summary.budgets.totalLimit || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding.lg,
        marginBottom: 20,
    },
    greeting: {
        fontSize: 22,
        color: COLORS.text,
        ...FONTS.bold,
    },
    date: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius.full,
    },
    netWorthCard: {
        marginHorizontal: SIZES.padding.lg,
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius.xl,
        padding: 24,
        marginBottom: 24,
        ...SHADOWS.large,
    },
    netWorthLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        ...FONTS.medium,
    },
    netWorthValue: {
        fontSize: 36,
        color: COLORS.white,
        ...FONTS.extraBold,
        marginTop: 4,
    },
    netWorthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    netWorthItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    netWorthItemText: {
        color: COLORS.white,
        fontSize: 14,
        ...FONTS.semiBold,
    },
    netWorthDivider: {
        color: 'rgba(255,255,255,0.4)',
        marginHorizontal: 10,
    },
    netWorthSubLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        color: COLORS.text,
        ...FONTS.bold,
        paddingHorizontal: SIZES.padding.lg,
        marginBottom: 14,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding.lg,
        marginBottom: 28,
    },
    quickActionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: SIZES.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding.lg,
    },
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius.lg,
        padding: 16,
        width: '48%',
        marginBottom: 16,
        ...SHADOWS.small,
    },
    summaryIconWrap: {
        width: 36,
        height: 36,
        borderRadius: SIZES.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        ...FONTS.medium,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        color: COLORS.text,
        ...FONTS.bold,
        flexShrink: 1,
        minHeight: 22,
    },
    summaryChange: {
        fontSize: 12,
        ...FONTS.semiBold,
        marginTop: 2,
    },
    summarySubtext: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
});
