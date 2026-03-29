import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

export default function SavingsScreen() {
    const { authFetch } = useAuth();
    const [goals, setGoals] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [txModal, setTxModal] = useState({ visible: false, goalId: null, goalName: '' });
    const [form, setForm] = useState({ goalName: '', targetAmount: '', deadline: '' });
    const [txForm, setTxForm] = useState({ type: 'deposit', amount: '', note: '' });

    const fetchData = async () => {
        try {
            const [goalsRes, sumRes] = await Promise.all([
                authFetch('/savings'),
                authFetch('/savings/summary'),
            ]);
            if (goalsRes.ok) setGoals(await goalsRes.json());
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (err) {
            console.log('Error:', err);
        } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

    const handleAddGoal = async () => {
        if (!form.goalName || !form.targetAmount) {
            Alert.alert('Error', 'Please fill in required fields'); return;
        }
        try {
            const res = await authFetch('/savings', { method: 'POST', body: JSON.stringify(form) });
            if (res.ok) { setModalVisible(false); setForm({ goalName: '', targetAmount: '', deadline: '' }); fetchData(); }
            else { const d = await res.json(); Alert.alert('Error', d.message); }
        } catch { Alert.alert('Error', 'Failed to create goal'); }
    };

    const handleTransaction = async () => {
        if (!txForm.amount) { Alert.alert('Error', 'Please enter amount'); return; }
        try {
            const res = await authFetch(`/savings/${txModal.goalId}/transaction`, {
                method: 'POST', body: JSON.stringify(txForm),
            });
            if (res.ok) { setTxModal({ visible: false, goalId: null, goalName: '' }); setTxForm({ type: 'deposit', amount: '', note: '' }); fetchData(); }
            else { const d = await res.json(); Alert.alert('Error', d.message); }
        } catch { Alert.alert('Error', 'Transaction failed'); }
    };

    if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

    return (
        <View style={styles.container}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
                <View style={styles.header}>
                    <Text style={styles.title}>Savings</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {summary && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Saved</Text>
                        <Text style={styles.summaryValue}>₱{(summary.totalSaved || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Active</Text><Text style={styles.summaryItemValue}>{summary.activeGoals}</Text></View>
                            <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Completed</Text><Text style={styles.summaryItemValue}>{summary.completedGoals}</Text></View>
                            <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Target</Text><Text style={styles.summaryItemValue}>₱{(summary.totalTarget || 0).toLocaleString()}</Text></View>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Goals ({goals.length})</Text>
                {goals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🎯</Text>
                        <Text style={styles.emptyText}>No savings goals yet</Text>
                        <Text style={styles.emptySubtext}>Create a goal to start saving</Text>
                    </View>
                ) : (
                    goals.map((goal) => (
                        <TouchableOpacity key={goal._id} style={styles.goalCard}
                            onPress={() => setTxModal({ visible: true, goalId: goal._id, goalName: goal.goalName })}>
                            <View style={styles.goalHeader}>
                                <Text style={styles.goalIcon}>{goal.icon || '💰'}</Text>
                                <View style={styles.goalInfo}>
                                    <Text style={styles.goalName}>{goal.goalName}</Text>
                                    <Text style={styles.goalStatus}>{goal.status === 'completed' ? '✅ Completed' : 'Active'}</Text>
                                </View>
                                <Text style={styles.goalAmount}>₱{(goal.currentAmount || 0).toLocaleString()}</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${goal.progress || 0}%`, backgroundColor: goal.color || COLORS.primary }]} />
                            </View>
                            <View style={styles.goalFooter}>
                                <Text style={styles.goalProgress}>{(goal.progress || 0).toFixed(0)}%</Text>
                                <Text style={styles.goalTarget}>of ₱{(goal.targetAmount || 0).toLocaleString()}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Goal Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>New Savings Goal</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>Goal Name *</Text>
                        <TextInput style={styles.input} placeholder="e.g., Emergency Fund" placeholderTextColor={COLORS.textMuted}
                            value={form.goalName} onChangeText={(v) => setForm({ ...form, goalName: v })} />
                        <Text style={styles.inputLabel}>Target Amount *</Text>
                        <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric" value={form.targetAmount} onChangeText={(v) => setForm({ ...form, targetAmount: v })} />
                        <TouchableOpacity style={styles.submitBtn} onPress={handleAddGoal}>
                            <Text style={styles.submitBtnText}>Create Goal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Deposit/Withdraw Modal */}
            <Modal visible={txModal.visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{txModal.goalName}</Text>
                            <TouchableOpacity onPress={() => setTxModal({ visible: false, goalId: null, goalName: '' })}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
                        </View>
                        <View style={styles.txTypeRow}>
                            <TouchableOpacity style={[styles.txTypeBtn, txForm.type === 'deposit' && styles.txTypeBtnActive]}
                                onPress={() => setTxForm({ ...txForm, type: 'deposit' })}>
                                <Text style={[styles.txTypeBtnText, txForm.type === 'deposit' && styles.txTypeBtnTextActive]}>Deposit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.txTypeBtn, txForm.type === 'withdrawal' && styles.txTypeBtnActiveW]}
                                onPress={() => setTxForm({ ...txForm, type: 'withdrawal' })}>
                                <Text style={[styles.txTypeBtnText, txForm.type === 'withdrawal' && styles.txTypeBtnTextActive]}>Withdraw</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>Amount *</Text>
                        <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric" value={txForm.amount} onChangeText={(v) => setTxForm({ ...txForm, amount: v })} />
                        <Text style={styles.inputLabel}>Note</Text>
                        <TextInput style={styles.input} placeholder="Optional" placeholderTextColor={COLORS.textMuted}
                            value={txForm.note} onChangeText={(v) => setTxForm({ ...txForm, note: v })} />
                        <TouchableOpacity style={[styles.submitBtn, txForm.type === 'withdrawal' && { backgroundColor: COLORS.warning }]} onPress={handleTransaction}>
                            <Text style={styles.submitBtnText}>{txForm.type === 'deposit' ? 'Deposit' : 'Withdraw'}</Text>
                        </TouchableOpacity>
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
    addBtn: { backgroundColor: COLORS.secondary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
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
    goalCard: { marginHorizontal: SIZES.padding.lg, backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg, padding: 16, marginBottom: 10, ...SHADOWS.small },
    goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    goalIcon: { fontSize: 32, marginRight: 12 },
    goalInfo: { flex: 1 },
    goalName: { fontSize: 16, color: COLORS.text, ...FONTS.semiBold },
    goalStatus: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    goalAmount: { fontSize: 16, color: COLORS.text, ...FONTS.bold },
    progressBarBg: { height: 8, backgroundColor: COLORS.backgroundLight, borderRadius: 4 },
    progressBarFill: { height: 8, borderRadius: 4 },
    goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    goalProgress: { fontSize: 13, color: COLORS.primary, ...FONTS.semiBold },
    goalTarget: { fontSize: 13, color: COLORS.textMuted },
    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, color: COLORS.text, ...FONTS.bold },
    inputLabel: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: COLORS.card, borderRadius: SIZES.radius.md, padding: 14, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
    submitBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius.md, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    submitBtnText: { color: COLORS.white, fontSize: 16, ...FONTS.semiBold },
    txTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    txTypeBtn: { flex: 1, padding: 12, borderRadius: SIZES.radius.md, backgroundColor: COLORS.card, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    txTypeBtnActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
    txTypeBtnActiveW: { backgroundColor: COLORS.warning + '20', borderColor: COLORS.warning },
    txTypeBtnText: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.semiBold },
    txTypeBtnTextActive: { color: COLORS.text },
});
