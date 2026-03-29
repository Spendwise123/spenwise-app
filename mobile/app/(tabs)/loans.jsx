import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Modal, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

const STATUS_COLORS = {
    pending: COLORS.warning, approved: COLORS.info, active: COLORS.primary,
    rejected: COLORS.danger, paid: COLORS.success,
};

export default function LoansScreen() {
    const { authFetch } = useAuth();
    const [loans, setLoans] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [payModal, setPayModal] = useState({ visible: false, loanId: null, loanPurpose: '' });
    const [form, setForm] = useState({ amount: '', interestRate: '5', termMonths: '12', purpose: '' });
    const [payAmount, setPayAmount] = useState('');

    const fetchData = async () => {
        try {
            const [loansRes, sumRes] = await Promise.all([
                authFetch('/loans'), authFetch('/loans/summary'),
            ]);
            if (loansRes.ok) setLoans(await loansRes.json());
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (err) { console.log('Error:', err); } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

    const handleApply = async () => {
        if (!form.amount || !form.purpose) { Alert.alert('Error', 'Please fill in required fields'); return; }
        try {
            const res = await authFetch('/loans', { method: 'POST', body: JSON.stringify(form) });
            if (res.ok) {
                setModalVisible(false);
                setForm({ amount: '', interestRate: '5', termMonths: '12', purpose: '' });
                fetchData();
                Alert.alert('Success', 'Loan application submitted! Admin will review it.');
            } else { const d = await res.json(); Alert.alert('Error', d.message); }
        } catch { Alert.alert('Error', 'Failed to apply'); }
    };

    const handlePayment = async () => {
        if (!payAmount) { Alert.alert('Error', 'Enter amount'); return; }
        try {
            const res = await authFetch(`/loans/${payModal.loanId}/payment`, {
                method: 'POST', body: JSON.stringify({ amount: payAmount }),
            });
            if (res.ok) {
                setPayModal({ visible: false, loanId: null, loanPurpose: '' });
                setPayAmount('');
                fetchData();
                Alert.alert('Success', 'Payment recorded!');
            } else { const d = await res.json(); Alert.alert('Error', d.message); }
        } catch { Alert.alert('Error', 'Payment failed'); }
    };

    if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

    return (
        <View style={styles.container}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
                <View style={styles.header}>
                    <Text style={styles.title}>Loans</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {summary && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Outstanding Balance</Text>
                        <Text style={styles.summaryValue}>₱{(summary.totalRemaining || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Total Borrowed</Text><Text style={styles.summaryItemValue}>₱{(summary.totalBorrowed || 0).toLocaleString()}</Text></View>
                            <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Total Paid</Text><Text style={styles.summaryItemValue}>₱{(summary.totalPaid || 0).toLocaleString()}</Text></View>
                            <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>Pending</Text><Text style={styles.summaryItemValue}>{summary.pendingLoans || 0}</Text></View>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>My Loans ({loans.length})</Text>
                {loans.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>💵</Text>
                        <Text style={styles.emptyText}>No loans yet</Text>
                        <Text style={styles.emptySubtext}>Apply for a loan to get started</Text>
                    </View>
                ) : (
                    loans.map((loan) => (
                        <TouchableOpacity key={loan._id} style={styles.loanCard}
                            onPress={() => loan.status === 'active' && setPayModal({ visible: true, loanId: loan._id, loanPurpose: loan.purpose })}>
                            <View style={styles.loanHeader}>
                                <View style={styles.loanInfo}>
                                    <Text style={styles.loanPurpose}>{loan.purpose}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[loan.status] || COLORS.textMuted) + '20' }]}>
                                        <Text style={[styles.statusText, { color: STATUS_COLORS[loan.status] || COLORS.textMuted }]}>{loan.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <Text style={styles.loanAmount}>₱{(loan.amount || 0).toLocaleString()}</Text>
                            </View>
                            <View style={styles.loanDetails}>
                                <View style={styles.loanDetail}><Text style={styles.loanDetailLabel}>Rate</Text><Text style={styles.loanDetailValue}>{loan.interestRate}%</Text></View>
                                <View style={styles.loanDetail}><Text style={styles.loanDetailLabel}>Term</Text><Text style={styles.loanDetailValue}>{loan.termMonths}mo</Text></View>
                                <View style={styles.loanDetail}><Text style={styles.loanDetailLabel}>Monthly</Text><Text style={styles.loanDetailValue}>₱{(loan.monthlyPayment || 0).toLocaleString()}</Text></View>
                                <View style={styles.loanDetail}><Text style={styles.loanDetailLabel}>Remaining</Text><Text style={styles.loanDetailValue}>₱{(loan.remainingBalance || 0).toLocaleString()}</Text></View>
                            </View>
                            {loan.status === 'active' && (
                                <View style={styles.loanProgressWrap}>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, {
                                            width: `${loan.amount > 0 ? ((1 - loan.remainingBalance / loan.amount) * 100) : 0}%`
                                        }]} />
                                    </View>
                                    <Text style={styles.loanProgressText}>{loan.amount > 0 ? ((1 - loan.remainingBalance / loan.amount) * 100).toFixed(0) : 0}% paid</Text>
                                </View>
                            )}
                            {loan.adminNote ? <Text style={styles.adminNote}>📝 {loan.adminNote}</Text> : null}
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Apply Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Apply for Loan</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.inputLabel}>Loan Amount *</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} />
                            <Text style={styles.inputLabel}>Interest Rate (%)</Text>
                            <TextInput style={styles.input} placeholder="5" placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric" value={form.interestRate} onChangeText={(v) => setForm({ ...form, interestRate: v })} />
                            <Text style={styles.inputLabel}>Term (Months)</Text>
                            <TextInput style={styles.input} placeholder="12" placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric" value={form.termMonths} onChangeText={(v) => setForm({ ...form, termMonths: v })} />
                            <Text style={styles.inputLabel}>Purpose *</Text>
                            <TextInput style={styles.input} placeholder="e.g., Home Renovation" placeholderTextColor={COLORS.textMuted}
                                value={form.purpose} onChangeText={(v) => setForm({ ...form, purpose: v })} />
                            <TouchableOpacity style={styles.submitBtn} onPress={handleApply}><Text style={styles.submitBtnText}>Submit Application</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Payment Modal */}
            <Modal visible={payModal.visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Make Payment</Text>
                            <TouchableOpacity onPress={() => setPayModal({ visible: false, loanId: null, loanPurpose: '' })}><Ionicons name="close" size={24} color={COLORS.textSecondary} /></TouchableOpacity>
                        </View>
                        <Text style={styles.payLabel}>{payModal.loanPurpose}</Text>
                        <Text style={styles.inputLabel}>Amount *</Text>
                        <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
                        <TouchableOpacity style={styles.submitBtn} onPress={handlePayment}><Text style={styles.submitBtnText}>Submit Payment</Text></TouchableOpacity>
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
    addBtn: { backgroundColor: COLORS.accent, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
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
    loanCard: { marginHorizontal: SIZES.padding.lg, backgroundColor: COLORS.card, borderRadius: SIZES.radius.lg, padding: 16, marginBottom: 10, ...SHADOWS.small },
    loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    loanInfo: { flex: 1 },
    loanPurpose: { fontSize: 16, color: COLORS.text, ...FONTS.semiBold, marginBottom: 6 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, ...FONTS.bold },
    loanAmount: { fontSize: 18, color: COLORS.text, ...FONTS.bold },
    loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    loanDetail: {},
    loanDetailLabel: { fontSize: 11, color: COLORS.textMuted },
    loanDetailValue: { fontSize: 13, color: COLORS.text, ...FONTS.medium, marginTop: 2 },
    loanProgressWrap: { marginTop: 8 },
    progressBarBg: { height: 6, backgroundColor: COLORS.backgroundLight, borderRadius: 3 },
    progressBarFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    loanProgressText: { fontSize: 12, color: COLORS.primary, ...FONTS.medium, marginTop: 4, textAlign: 'right' },
    adminNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, fontStyle: 'italic' },
    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, color: COLORS.text, ...FONTS.bold },
    inputLabel: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: COLORS.card, borderRadius: SIZES.radius.md, padding: 14, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
    submitBtn: { backgroundColor: COLORS.accent, borderRadius: SIZES.radius.md, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    submitBtnText: { color: COLORS.white, fontSize: 16, ...FONTS.semiBold },
    payLabel: { fontSize: 16, color: COLORS.textSecondary, ...FONTS.medium },
});
