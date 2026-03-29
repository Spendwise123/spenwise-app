import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

const CATEGORIES = [
    { name: 'Food', icon: '🍔', color: '#EF4444' },
    { name: 'Transport', icon: '🚗', color: '#F59E0B' },
    { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
    { name: 'Bills', icon: '💡', color: '#8B5CF6' },
    { name: 'Entertainment', icon: '🎮', color: '#3B82F6' },
    { name: 'Health', icon: '🏥', color: '#10B981' },
    { name: 'Education', icon: '📚', color: '#6366F1' },
    { name: 'Other', icon: '📌', color: '#64748B' },
];

export default function BudgetScreen() {
    const { authFetch } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [expModal, setExpModal] = useState({ visible: false, budgetId: null, budgetName: '' });
    const [form, setForm] = useState({ name: '', category: 'Food', limitAmount: '', period: 'monthly' });
    const [expForm, setExpForm] = useState({ description: '', amount: '' });

    const fetchData = async () => {
        try {
            const [budRes, sumRes] = await Promise.all([
                authFetch('/budgets'), authFetch('/budgets/summary'),
            ]);
            if (budRes.ok) setBudgets(await budRes.json());
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (err) { console.log('Error:', err); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

    const handleAdd = async () => {
        if (!form.name || !form.limitAmount) { Alert.alert('Error', 'Please fill required fields'); return; }
        try {
            const cat = CATEGORIES.find(c => c.name === form.category);
            const res = await authFetch('/budgets', {
                method: 'POST',
                body: JSON.stringify({ ...form, icon: cat?.icon || '📊', color: cat?.color || '#6366F1' }),
            });
            if (res.ok) { setModalVisible(false); setForm({ name: '', category: 'Food', limitAmount: '', period: 'monthly' }); fetchData(); }
            else { const d = await res.json(); Alert.alert('Error', d.message); }
        } catch { Alert.alert('Error', 'Failed to create budget'); }
    };

    const handleAddExpense = async () => {
        if (!expForm.description || !expForm.amount) { Alert.alert('Error', 'Please fill required fields'); return; }
        try {
            const res = await authFetch(`/budgets/${expModal.budgetId}/expense`, {
                method: 'POST', body: JSON.stringify(expForm),
            });
            if (res.ok) { setExpModal({ visible: false, budgetId: null, budgetName: '' }); setExpForm({ description: '', amount: '' }); fetchData(); }
            else { const d = await res.json(); Alert.alert('Error', d.message); }
        } catch { Alert.alert('Error', 'Failed to add expense'); }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Budget', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await authFetch(`/budgets/${id}`, { method: 'DELETE' }); fetchData(); } },
        ]);
    };

    if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

    return (
        <View style={styles.container}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
                <View style={styles.header}>
                    <Text style={styles.title}>Budget</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {summary && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Spending</Text>
                        <Text style={styles.summaryValue}>₱{(summary.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        <View style={styles.totalProgressWrap}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, {
                                    width: `${summary.totalLimit > 0 ? Math.min((summary.totalSpent / summary.totalLimit) * 100, 100) : 0}%`,
                                    backgroundColor: summary.totalSpent > summary.totalLimit ? COLORS.danger : COLORS.primary,
                                }]} />
                            </View>
                            <Text style={styles.totalProgressText}>₱{(summary.totalRemaining || 0).toLocaleString()} remaining of ₱{(summary.totalLimit || 0).toLocaleString()}</Text>
                        </View>
                        {summary.overBudget > 0 && (
                            <Text style={styles.overBudgetText}>⚠️ {summary.overBudget} budget(s) exceeded</Text>
                        )}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Categories ({budgets.length})</Text>
                {budgets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📊</Text>
                        <Text style={styles.emptyText}>No budgets yet</Text>
                        <Text style={styles.emptySubtext}>Create a budget to track spending</Text>
                    </View>
                ) : (
                    budgets.map((budget) => {
                        const isOver = budget.spentAmount > budget.limitAmount;
                        return (
                            <TouchableOpacity key={budget._id} style={styles.budgetCard}
                                onPress={() => setExpModal({ visible: true, budgetId: budget._id, budgetName: budget.name })}
                                onLongPress={() => handleDelete(budget._id)}>
                                <View style={styles.budgetHeader}>
                                    <Text style={styles.budgetIcon}>{budget.icon || '📊'}</Text>
                                    <View style={styles.budgetInfo}>
                                        <Text style={styles.budgetName}>{budget.name}</Text>
                                        <Text style={styles.budgetCategory}>{budget.category} · {budget.period}</Text>
                                    </View>
                                    <View style={styles.budgetAmounts}>
                                        <Text style={[styles.budgetSpent, isOver && { color: COLORS.danger }]}>
                                            ₱{(budget.spentAmount || 0).toLocaleString()}
                                        </Text>
                                        <Text style={styles.budgetLimit}>/ ₱{(budget.limitAmount || 0).toLocaleString()}</Text>
                                    </View>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, {
                                        width: `${budget.percentUsed || 0}%`,
                                        backgroundColor: isOver ? COLORS.danger : (budget.color || COLORS.primary),
                                    }]} />
                                </View>
                                <Text style={[styles.budgetPercent, isOver && { color: COLORS.danger }]}>
                                    {(budget.percentUsed || 0).toFixed(0)}% used
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Budget Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>New Budget</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.inputLabel}>Budget Name *</Text>
                            <TextInput style={styles.input} placeholder="e.g., Monthly Groceries" placeholderTextColor={COLORS.textMuted}
                                value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
                            <Text style={styles.inputLabel}>Category</Text>
                            <View style={styles.catRow}>
                                {CATEGORIES.map((c) => (
                                    <TouchableOpacity key={c.name} style={[styles.catChip, form.category === c.name && { backgroundColor: c.color + '20', borderColor: c.color }]}
                                        onPress={() => setForm({ ...form, category: c.name })}>
                                        <Text style={styles.catChipText}>{c.icon} {c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.inputLabel}>Limit Amount *</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric" value={form.limitAmount} onChangeText={(v) => setForm({ ...form, limitAmount: v })} />
                            <Text style={styles.inputLabel}>Period</Text>
                            <View style={styles.periodRow}>
                                {['weekly', 'monthly', 'yearly'].map((p) => (
                                    <TouchableOpacity key={p} style={[styles.periodBtn, form.period === p && styles.periodBtnActive]}
                                        onPress={() => setForm({ ...form, period: p })}>
                                        <Text style={[styles.periodBtnText, form.period === p && styles.periodBtnTextActive]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}><Text style={styles.submitBtnText}>Create Budget</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Add Expense Modal */}
            <Modal visible={expModal.visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Add Expense</Text>
                            <TouchableOpacity onPress={() => setExpModal({ visible: false, budgetId: null, budgetName: '' })}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
                        </View>
                        <Text style={styles.payLabel}>{expModal.budgetName}</Text>
                        <Text style={styles.inputLabel}>Description *</Text>
                        <TextInput style={styles.input} placeholder="What did you spend on?" placeholderTextColor={COLORS.textMuted}
                            value={expForm.description} onChangeText={(v) => setExpForm({ ...expForm, description: v })} />
                        <Text style={styles.inputLabel}>Amount *</Text>
                        <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric" value={expForm.amount} onChangeText={(v) => setExpForm({ ...expForm, amount: v })} />
                        <TouchableOpacity style={styles.submitBtn} onPress={handleAddExpense}><Text style={styles.submitBtnText}>Add Expense</Text></TouchableOpacity>
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
    addBtn: { backgroundColor: COLORS.info, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    summaryCard: { marginHorizontal: SIZES.padding.lg, backgroundColor: COLORS.card, borderRadius: SIZES.radius.xl, padding: 20, marginBottom: 20, ...SHADOWS.medium },
    summaryLabel: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
    summaryValue: { fontSize: 32, color: COLORS.text, ...FONTS.extraBold, marginVertical: 4 },
    totalProgressWrap: { marginTop: 12 },
    totalProgressText: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
    overBudgetText: { color: COLORS.danger, fontSize: 13, ...FONTS.medium, marginTop: 8 },
    sectionTitle: { fontSize: 18, color: COLORS.text, ...FONTS.bold, paddingHorizontal: SIZES.padding.lg, marginBottom: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 18, color: COLORS.text, ...FONTS.semiBold },
    emptySubtext: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    budgetCard: { marginHorizontal: SIZES.padding.lg, backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg, padding: 16, marginBottom: 10, ...SHADOWS.small },
    budgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    budgetIcon: { fontSize: 28, marginRight: 12 },
    budgetInfo: { flex: 1 },
    budgetName: { fontSize: 16, color: COLORS.text, ...FONTS.semiBold },
    budgetCategory: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    budgetAmounts: { alignItems: 'flex-end' },
    budgetSpent: { fontSize: 16, color: COLORS.text, ...FONTS.bold },
    budgetLimit: { fontSize: 12, color: COLORS.textMuted },
    progressBarBg: { height: 6, backgroundColor: COLORS.backgroundLight, borderRadius: 3 },
    progressBarFill: { height: 6, borderRadius: 3 },
    budgetPercent: { fontSize: 12, color: COLORS.primary, ...FONTS.medium, marginTop: 6, textAlign: 'right' },
    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, color: COLORS.text, ...FONTS.bold },
    inputLabel: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: COLORS.card, borderRadius: SIZES.radius.md, padding: 14, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    catChipText: { fontSize: 12, color: COLORS.text },
    periodRow: { flexDirection: 'row', gap: 10 },
    periodBtn: { flex: 1, padding: 12, borderRadius: SIZES.radius.md, backgroundColor: COLORS.card, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    periodBtnActive: { backgroundColor: COLORS.info + '20', borderColor: COLORS.info },
    periodBtnText: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
    periodBtnTextActive: { color: COLORS.info },
    submitBtn: { backgroundColor: COLORS.info, borderRadius: SIZES.radius.md, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    submitBtnText: { color: COLORS.white, fontSize: 16, ...FONTS.semiBold },
    payLabel: { fontSize: 16, color: COLORS.textSecondary, ...FONTS.medium },
});
