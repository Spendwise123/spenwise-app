import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

const ASSET_TYPES = ['stocks', 'crypto', 'bonds', 'mutual-funds', 'real-estate'];
const ASSET_ICONS = {
    stocks: '📈', crypto: '₿', bonds: '🏛️', 'mutual-funds': '📊', 'real-estate': '🏠'
};

export default function InvestmentsScreen() {
    const { authFetch } = useAuth();
    const [investments, setInvestments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({
        assetName: '', assetType: 'stocks', quantity: '', purchasePrice: '', currentPrice: '', notes: ''
    });

    const fetchData = async () => {
        try {
            const [invRes, sumRes] = await Promise.all([
                authFetch('/investments'),
                authFetch('/investments/summary'),
            ]);
            if (invRes.ok) setInvestments(await invRes.json());
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (err) {
            console.log('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));

    const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

    const handleAdd = async () => {
        if (!form.assetName || !form.quantity || !form.purchasePrice) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }
        try {
            const res = await authFetch('/investments', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    currentPrice: form.currentPrice || form.purchasePrice,
                }),
            });
            if (res.ok) {
                setModalVisible(false);
                setForm({ assetName: '', assetType: 'stocks', quantity: '', purchasePrice: '', currentPrice: '', notes: '' });
                fetchData();
            } else {
                const data = await res.json();
                Alert.alert('Error', data.message);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to add investment');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Investment', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    await authFetch(`/investments/${id}`, { method: 'DELETE' });
                    fetchData();
                }
            },
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Investments</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Portfolio Summary */}
                {summary && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Portfolio Value</Text>
                        <Text style={styles.summaryValue}>₱{(summary.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryItemLabel}>Invested</Text>
                                <Text style={styles.summaryItemValue}>₱{(summary.totalInvested || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryItemLabel}>Profit/Loss</Text>
                                <Text style={[styles.summaryItemValue, {
                                    color: (summary.totalProfitLoss || 0) >= 0 ? COLORS.success : COLORS.danger
                                }]}>
                                    {(summary.totalProfitLoss || 0) >= 0 ? '+' : ''}₱{(summary.totalProfitLoss || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryItemLabel}>Return</Text>
                                <Text style={[styles.summaryItemValue, {
                                    color: (summary.percentChange || 0) >= 0 ? COLORS.success : COLORS.danger
                                }]}>
                                    {(summary.percentChange || 0) >= 0 ? '+' : ''}{(summary.percentChange || 0).toFixed(2)}%
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Investment List */}
                <Text style={styles.sectionTitle}>Holdings ({investments.length})</Text>
                {investments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📈</Text>
                        <Text style={styles.emptyText}>No investments yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to add your first investment</Text>
                    </View>
                ) : (
                    investments.map((inv) => {
                        const pl = (inv.currentPrice - inv.purchasePrice) * inv.quantity;
                        const plPercent = inv.purchasePrice > 0 ? ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice * 100) : 0;
                        return (
                            <TouchableOpacity key={inv._id} style={styles.investmentCard} onLongPress={() => handleDelete(inv._id)}>
                                <View style={styles.investmentHeader}>
                                    <Text style={styles.investmentIcon}>{ASSET_ICONS[inv.assetType] || '📈'}</Text>
                                    <View style={styles.investmentInfo}>
                                        <Text style={styles.investmentName}>{inv.assetName}</Text>
                                        <Text style={styles.investmentType}>{inv.assetType} · {inv.quantity} units</Text>
                                    </View>
                                    <View style={styles.investmentValues}>
                                        <Text style={styles.investmentValue}>₱{(inv.currentPrice * inv.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                                        <Text style={[styles.investmentPL, { color: pl >= 0 ? COLORS.success : COLORS.danger }]}>
                                            {pl >= 0 ? '+' : ''}₱{pl.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({plPercent.toFixed(1)}%)
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Investment</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.inputLabel}>Asset Name *</Text>
                            <TextInput style={styles.input} placeholder="e.g., Apple Inc." placeholderTextColor={COLORS.textMuted}
                                value={form.assetName} onChangeText={(v) => setForm({ ...form, assetName: v })} />

                            <Text style={styles.inputLabel}>Asset Type</Text>
                            <View style={styles.typeRow}>
                                {ASSET_TYPES.map((t) => (
                                    <TouchableOpacity key={t}
                                        style={[styles.typeChip, form.assetType === t && styles.typeChipActive]}
                                        onPress={() => setForm({ ...form, assetType: t })}>
                                        <Text style={[styles.typeChipText, form.assetType === t && styles.typeChipTextActive]}>
                                            {ASSET_ICONS[t]} {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Quantity *</Text>
                            <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric" value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} />

                            <Text style={styles.inputLabel}>Purchase Price *</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric" value={form.purchasePrice} onChangeText={(v) => setForm({ ...form, purchasePrice: v })} />

                            <Text style={styles.inputLabel}>Current Price</Text>
                            <TextInput style={styles.input} placeholder="Same as purchase" placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric" value={form.currentPrice} onChangeText={(v) => setForm({ ...form, currentPrice: v })} />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                                <Text style={styles.submitBtnText}>Add Investment</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding.lg, marginBottom: 20 },
    title: { fontSize: 28, color: COLORS.text, ...FONTS.bold },
    addBtn: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    summaryCard: { marginHorizontal: SIZES.padding.lg, backgroundColor: COLORS.card, borderRadius: SIZES.radius.xl, padding: 20, marginBottom: 20, ...SHADOWS.medium },
    summaryLabel: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
    summaryValue: { fontSize: 32, color: COLORS.text, ...FONTS.extraBold, marginVertical: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    summaryItem: {},
    summaryItemLabel: { fontSize: 12, color: COLORS.textMuted },
    summaryItemValue: { fontSize: 14, color: COLORS.text, ...FONTS.semiBold, marginTop: 2 },
    sectionTitle: { fontSize: 18, color: COLORS.text, ...FONTS.bold, paddingHorizontal: SIZES.padding.lg, marginBottom: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 18, color: COLORS.text, ...FONTS.semiBold },
    emptySubtext: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    investmentCard: { marginHorizontal: SIZES.padding.lg, backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg, padding: 16, marginBottom: 10, ...SHADOWS.small },
    investmentHeader: { flexDirection: 'row', alignItems: 'center' },
    investmentIcon: { fontSize: 32, marginRight: 12 },
    investmentInfo: { flex: 1 },
    investmentName: { fontSize: 16, color: COLORS.text, ...FONTS.semiBold },
    investmentType: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    investmentValues: { alignItems: 'flex-end' },
    investmentValue: { fontSize: 16, color: COLORS.text, ...FONTS.bold },
    investmentPL: { fontSize: 12, ...FONTS.medium, marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, color: COLORS.text, ...FONTS.bold },
    inputLabel: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: COLORS.card, borderRadius: SIZES.radius.md, padding: 14, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    typeChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
    typeChipText: { fontSize: 12, color: COLORS.textSecondary },
    typeChipTextActive: { color: COLORS.primary, ...FONTS.semiBold },
    submitBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius.md, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    submitBtnText: { color: COLORS.white, fontSize: 16, ...FONTS.semiBold },
});
