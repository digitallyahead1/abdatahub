import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/transaction_details_sheet.dart';

class TransactionsTab extends StatefulWidget {
  const TransactionsTab({super.key});

  @override
  State<TransactionsTab> createState() => _TransactionsTabState();
}

class _TransactionsTabState extends State<TransactionsTab> {
  String _filterType = 'all'; // 'all', 'credit', 'debit'
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const String _searchHistoryKey = 'user_tx_search_history';
  List<String> _recentSearches = [];

  static const List<String> _popularNetworks = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'];

  @override
  void initState() {
    super.initState();
    _loadSearchHistory();
    // Refresh history when page is loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<WalletProvider>(context, listen: false).fetchWalletData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadSearchHistory() async {
    try {
      final savedJson = await _storage.read(key: _searchHistoryKey);
      if (savedJson != null && savedJson.isNotEmpty) {
        final List<dynamic> decoded = jsonDecode(savedJson);
        setState(() {
          _recentSearches = decoded.map((e) => e.toString()).take(8).toList();
        });
      }
    } catch (_) {
      // Ignore storage read error
    }
  }

  Future<void> _saveSearchQuery(String query) async {
    final trimmed = query.trim();
    if (trimmed.length < 2) return;

    final updated = [
      trimmed,
      ..._recentSearches.where((s) => s.toLowerCase() != trimmed.toLowerCase()),
    ].take(8).toList();

    setState(() {
      _recentSearches = updated;
    });

    try {
      await _storage.write(key: _searchHistoryKey, value: jsonEncode(updated));
    } catch (_) {
      // Ignore storage write error
    }
  }

  Future<void> _removeSearchItem(String item) async {
    final updated = _recentSearches.where((s) => s.toLowerCase() != item.toLowerCase()).toList();
    setState(() {
      _recentSearches = updated;
    });
    try {
      await _storage.write(key: _searchHistoryKey, value: jsonEncode(updated));
    } catch (_) {
      // Ignore
    }
  }

  Future<void> _clearSearchHistory() async {
    setState(() {
      _recentSearches = [];
    });
    try {
      await _storage.delete(key: _searchHistoryKey);
    } catch (_) {
      // Ignore
    }
  }

  void _applySearch(String query) {
    _searchController.text = query;
    _searchController.selection = TextSelection.fromPosition(
      TextPosition(offset: _searchController.text.length),
    );
    setState(() {
      _searchQuery = query.trim();
    });
    if (query.trim().isNotEmpty) {
      _saveSearchQuery(query.trim());
    }
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _searchQuery = '';
    });
  }

  // Extract phone number from text or metadata
  String? _extractPhone(dynamic tx) {
    final metadata = tx['metadata'] as Map<String, dynamic>?;
    if (metadata != null) {
      final metaPhone = metadata['phoneNumber'] ?? metadata['phone'] ?? metadata['recipient'];
      if (metaPhone != null && metaPhone.toString().isNotEmpty) {
        return metaPhone.toString();
      }
    }

    final desc = tx['description']?.toString() ?? '';
    final match = RegExp(r'(?:\+?234|0)[789][01]\d{8}').firstMatch(desc);
    return match?.group(0);
  }

  // Extract network provider from text or metadata
  String? _extractNetwork(dynamic tx) {
    final metadata = tx['metadata'] as Map<String, dynamic>?;
    if (metadata != null) {
      final metaNet = metadata['network'] ?? metadata['provider'] ?? metadata['operator'];
      if (metaNet != null && metaNet.toString().isNotEmpty) {
        return metaNet.toString().toUpperCase();
      }
    }

    final desc = tx['description']?.toString() ?? '';
    final match = RegExp(r'\b(MTN|AIRTEL|GLO|9MOBILE|ETISALAT)\b', caseSensitive: false).firstMatch(desc);
    return match?.group(0)?.toUpperCase();
  }

  bool _matchesSearch(dynamic tx, String query) {
    if (query.isEmpty) return true;

    final queryLower = query.toLowerCase();
    final digitsOnlyQuery = queryLower.replaceAll(RegExp(r'\D'), '');

    // 1. Reference match
    final ref = (tx['reference'] ?? '').toString().toLowerCase();
    if (ref.contains(queryLower)) return true;

    // 2. Phone number match
    final phone = _extractPhone(tx);
    if (phone != null) {
      final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
      if (phone.toLowerCase().contains(queryLower)) return true;
      if (digitsOnlyQuery.isNotEmpty && cleanPhone.isNotEmpty) {
        if (cleanPhone.contains(digitsOnlyQuery) || digitsOnlyQuery.contains(cleanPhone)) {
          return true;
        }
      }
    }

    // 3. Network match
    final network = _extractNetwork(tx);
    if (network != null && network.toLowerCase().contains(queryLower)) return true;

    // 4. Description match
    final desc = (tx['description'] ?? '').toString().toLowerCase();
    if (desc.contains(queryLower)) return true;

    // 5. Service match
    final service = (tx['service'] ?? '').toString().toLowerCase();
    if (service.contains(queryLower)) return true;

    return false;
  }

  @override
  Widget build(BuildContext context) {
    final walletProvider = Provider.of<WalletProvider>(context);
    final allTxs = walletProvider.transactions;

    final filteredTxs = allTxs.where((tx) {
      final matchesType = _filterType == 'all' || tx['type'] == _filterType;
      if (!matchesType) return false;

      return _matchesSearch(tx, _searchQuery);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction History'),
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar & Filter Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20.0, 12.0, 20.0, 4.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Input Field
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.darkBgSecondary,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _searchQuery.isNotEmpty
                            ? AppColors.primaryBlue
                            : AppColors.silverMuted.withValues(alpha: 0.15),
                      ),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val.trim();
                        });
                      },
                      onSubmitted: (val) {
                        if (val.trim().isNotEmpty) {
                          _saveSearchQuery(val.trim());
                        }
                      },
                      decoration: InputDecoration(
                        hintText: 'Search phone, reference, or network...',
                        hintStyle: TextStyle(
                          color: AppColors.silverMuted.withValues(alpha: 0.5),
                          fontSize: 12,
                        ),
                        prefixIcon: Icon(
                          Icons.search_rounded,
                          color: AppColors.silverMuted,
                          size: 20,
                        ),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(
                                  Icons.close_rounded,
                                  color: AppColors.silverMuted,
                                  size: 18,
                                ),
                                onPressed: _clearSearch,
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                    ),
                  ),

                  // Search History / Recent Searches Chips
                  if (_recentSearches.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 30,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(right: 6, top: 4),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.history_rounded,
                                  size: 14,
                                  color: AppColors.silverMuted.withValues(alpha: 0.7),
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  'Recent:',
                                  style: TextStyle(
                                    color: AppColors.silverMuted.withValues(alpha: 0.7),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ..._recentSearches.map((item) {
                            final isCurrent = _searchQuery.toLowerCase() == item.toLowerCase();
                            return Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: GestureDetector(
                                onTap: () => _applySearch(item),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isCurrent
                                        ? AppColors.primaryBlue.withValues(alpha: 0.2)
                                        : AppColors.darkBgSecondary,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isCurrent
                                          ? AppColors.primaryBlue
                                          : AppColors.silverMuted.withValues(alpha: 0.12),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        item,
                                        style: TextStyle(
                                          color: isCurrent ? AppColors.accentGlow : AppColors.silverLight,
                                          fontSize: 11,
                                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      GestureDetector(
                                        onTap: () => _removeSearchItem(item),
                                        child: Icon(
                                          Icons.close_rounded,
                                          size: 12,
                                          color: AppColors.silverMuted.withValues(alpha: 0.7),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }),
                          GestureDetector(
                            onTap: _clearSearchHistory,
                            child: Padding(
                              padding: const EdgeInsets.only(left: 4, top: 4),
                              child: Text(
                                'Clear',
                                style: TextStyle(
                                  color: AppColors.silverMuted.withValues(alpha: 0.8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Quick Network Filters
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 26,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(right: 6, top: 3),
                          child: Text(
                            'Networks:',
                            style: TextStyle(
                              color: AppColors.silverMuted.withValues(alpha: 0.7),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        ..._popularNetworks.map((net) {
                          final isSelected = _searchQuery.toLowerCase() == net.toLowerCase();
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: GestureDetector(
                              onTap: () {
                                if (isSelected) {
                                  _clearSearch();
                                } else {
                                  _applySearch(net);
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primaryBlue
                                      : AppColors.darkBgSecondary,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primaryBlue
                                        : AppColors.silverMuted.withValues(alpha: 0.12),
                                  ),
                                ),
                                child: Text(
                                  net,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : AppColors.silverMuted,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Filter Pills Section (All, Credits, Debits)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
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

            // Active Search / Match indicator
            if (_searchQuery.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20.0, 0, 20.0, 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${filteredTxs.length} result${filteredTxs.length == 1 ? "" : "s"} for "$_searchQuery"',
                      style: const TextStyle(
                        color: AppColors.accentGlow,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    GestureDetector(
                      onTap: _clearSearch,
                      child: Text(
                        'Reset search',
                        style: TextStyle(
                          color: AppColors.silverMuted.withValues(alpha: 0.8),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
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
                              SizedBox(height: MediaQuery.of(context).size.height * 0.18),
                              Center(
                                child: Column(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(18),
                                      decoration: BoxDecoration(
                                        color: AppColors.darkBgSecondary,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: AppColors.silverMuted.withValues(alpha: 0.1),
                                        ),
                                      ),
                                      child: Icon(
                                        _searchQuery.isNotEmpty
                                            ? Icons.search_off_rounded
                                            : Icons.receipt_long_rounded,
                                        size: 48,
                                        color: AppColors.silverMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      _searchQuery.isNotEmpty
                                          ? 'No matching transactions'
                                          : 'No transactions found',
                                      style: TextStyle(
                                        color: AppColors.silverLight,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 40.0),
                                      child: Text(
                                        _searchQuery.isNotEmpty
                                            ? 'No records match "$_searchQuery". Try searching with a phone number, reference code, or network.'
                                            : 'Your recent transactions will appear here once you perform an activity.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          color: AppColors.silverMuted.withValues(alpha: 0.7),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    if (_searchQuery.isNotEmpty) ...[
                                      const SizedBox(height: 16),
                                      ElevatedButton(
                                        onPressed: _clearSearch,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.darkBgSecondary,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(10),
                                            side: BorderSide(
                                              color: AppColors.silverMuted.withValues(alpha: 0.2),
                                            ),
                                          ),
                                        ),
                                        child: const Text(
                                          'Clear Search',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
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
                              return GestureDetector(
                                onTap: () => TransactionDetailsSheet.show(
                                  context,
                                  tx as Map<String, dynamic>,
                                ),
                                child: _buildTransactionRow(tx),
                              );
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
                  : AppColors.silverMuted.withValues(alpha: 0.1),
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

    final phone = _extractPhone(tx);
    final network = _extractNetwork(tx);

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppColors.darkBgSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.05)),
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
                      ? AppColors.success.withValues(alpha: 0.1)
                      : AppColors.error.withValues(alpha: 0.1),
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
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          dateStr,
                          style: TextStyle(
                            color: AppColors.silverMuted.withValues(alpha: 0.5),
                            fontSize: 10,
                          ),
                        ),
                        if (network != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: AppColors.primaryBlue.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              network,
                              style: const TextStyle(
                                color: AppColors.accentGlow,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                        if (phone != null) ...[
                          const SizedBox(width: 6),
                          Text(
                            phone,
                            style: TextStyle(
                              color: AppColors.silverMuted.withValues(alpha: 0.7),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ],
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
                  color: AppColors.silverMuted.withValues(alpha: 0.6),
                  fontSize: 10,
                ),
              ),
              Text(
                'Bal: ₦${previousBalance.toStringAsFixed(2)} ➔ ₦${newBalance.toStringAsFixed(2)}',
                style: TextStyle(
                  color: AppColors.silverMuted.withValues(alpha: 0.6),
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
