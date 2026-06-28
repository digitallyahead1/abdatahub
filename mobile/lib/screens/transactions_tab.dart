import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';

class TransactionsTab extends StatefulWidget {
  const TransactionsTab({Key? key}) : super(key: key);

  @override
  State<TransactionsTab> createState() => _TransactionsTabState();
}

class _TransactionsTabState extends State<TransactionsTab> {
  String _filterType = 'all'; // 'all', 'credit', 'debit'

  @override
  void initState() {
    super.initState();
    // Refresh history when page is loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<WalletProvider>(context, listen: false).fetchWalletData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final walletProvider = Provider.of<WalletProvider>(context);
    final allTxs = walletProvider.transactions;

    final filteredTxs = allTxs.where((tx) {
      if (_filterType == 'all') return true;
      return tx['type'] == _filterType;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction History'),
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter Pills Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
              child: Row(
                children: [
                  _buildFilterPill('All Transactions', 'all'),
                  const SizedBox(width: 8),
                  _buildFilterPill('Credits', 'credit'),
                  const SizedBox(width: 8),
                  _buildFilterPill('Debits', 'debit'),
                ],
              ),
            ),

            // Transactions Feed List
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  await walletProvider.fetchWalletData();
                },
                child: walletProvider.isLoading && allTxs.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : filteredTxs.isEmpty
                        ? ListView(
                            children: [
                              SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                              const Center(
                                child: Column(
                                  children: [
                                    Icon(
                                      Icons.receipt_long_rounded,
                                      size: 64,
                                      color: AppColors.silverMuted,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'No transactions found',
                                      style: TextStyle(
                                        color: AppColors.silverMuted,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                            itemCount: filteredTxs.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final tx = filteredTxs[index];
                              return _buildTransactionRow(tx);
                            },
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterPill(String title, String type) {
    final isSelected = _filterType == type;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _filterType = type;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryBlue : AppColors.darkBgSecondary,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? AppColors.primaryBlue
                  : AppColors.silverMuted.withOpacity(0.1),
            ),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : AppColors.silverMuted,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTransactionRow(dynamic tx) {
    final isCredit = tx['type'] == 'credit';
    final amount = (tx['amount'] as num).toDouble();
    final desc = tx['description'] ?? 'Transaction';
    final ref = tx['reference'] ?? 'REF';
    final dateStr = tx['createdAt'] != null
        ? tx['createdAt'].toString().replaceAll('T', ' ').substring(0, 19)
        : '';
    final previousBalance = tx['previousBalance'] != null
        ? (tx['previousBalance'] as num).toDouble()
        : 0.0;
    final newBalance = tx['newBalance'] != null
        ? (tx['newBalance'] as num).toDouble()
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppColors.darkBgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.silverMuted.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isCredit
                      ? AppColors.success.withOpacity(0.1)
                      : AppColors.error.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                  color: isCredit ? AppColors.success : AppColors.error,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      desc,
                      style: const TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dateStr,
                      style: TextStyle(
                        color: AppColors.silverMuted.withOpacity(0.5),
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${isCredit ? "+" : "-"}₦${amount.toStringAsFixed(2)}',
                style: TextStyle(
                  color: isCredit ? AppColors.success : AppColors.error,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Color(0xFF1F2937)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Reference: $ref',
                style: TextStyle(
                  color: AppColors.silverMuted.withOpacity(0.6),
                  fontSize: 10,
                ),
              ),
              Text(
                'Bal: ₦${previousBalance.toStringAsFixed(2)} ➔ ₦${newBalance.toStringAsFixed(2)}',
                style: TextStyle(
                  color: AppColors.silverMuted.withOpacity(0.6),
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
