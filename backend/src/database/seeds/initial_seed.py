"""
Database seeds for AB Data Hub
Run with: python seed.py or ts-node src/database/seeds/seed.ts
"""

import asyncio
from datetime import datetime

# Data plans seed
DATA_PLANS = [
    {
        "network": "mtn",
        "amount": 100,
        "volume": "500MB",
        "validity": "Daily",
        "is_active": True,
    },
    {
        "network": "mtn",
        "amount": 200,
        "volume": "1.5GB",
        "validity": "7 Days",
        "is_active": True,
    },
    {
        "network": "airtel",
        "amount": 100,
        "volume": "500MB",
        "validity": "Daily",
        "is_active": True,
    },
    {
        "network": "glo",
        "amount": 100,
        "volume": "1GB",
        "validity": "Daily",
        "is_active": True,
    },
    {
        "network": "9mobile",
        "amount": 100,
        "volume": "500MB",
        "validity": "Daily",
        "is_active": True,
    },
]

# Airtime amounts
AIRTIME_AMOUNTS = [100, 200, 500, 1000, 2000, 5000, 10000]

# Cable packages seed
CABLE_PACKAGES = [
    {"provider": "dstv", "package": "Compact", "amount": 5000, "is_active": True},
    {"provider": "dstv", "package": "Premium", "amount": 15000, "is_active": True},
    {"provider": "gotv", "package": "Max", "amount": 8000, "is_active": True},
    {"provider": "startimes", "package": "Basic", "amount": 3500, "is_active": True},
]

# Electricity providers
ELECTRICITY_DISCOS = [
    {"code": "ikedc", "name": "Ikeja Electric", "is_active": True},
    {"code": "ekedc", "name": "Enugu Electricity", "is_active": True},
    {"code": "aedc", "name": "Abuja Electricity", "is_active": True},
    {"code": "kedco", "name": "Kano Electricity", "is_active": True},
]

# Exam pins seed
EXAM_PINS = [
    {"exam_type": "waec", "quantity": 1, "amount": 3500, "is_active": True},
    {"exam_type": "waec", "quantity": 5, "amount": 16500, "is_active": True},
    {"exam_type": "neco", "quantity": 1, "amount": 3500, "is_active": True},
    {"exam_type": "jamb", "quantity": 1, "amount": 4000, "is_active": True},
    {"exam_type": "nabteb", "quantity": 1, "amount": 3500, "is_active": True},
]

# Referral commission seed
REFERRAL_COMMISSION = 0.05  # 5% commission on referrals
