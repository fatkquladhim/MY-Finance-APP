import type { FinancialSummary } from '@/types/insights';

export function getBaseSystemPrompt(): string {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `Anda adalah asisten keuangan pribadi yang cerdas dan ramah untuk pengguna Indonesia. 
Nama Anda adalah "FinBot" - Financial Bot Assistant.

PERAN ANDA:
1. ANALISIS data keuangan pengguna dan berikan insight yang dipersonalisasi
2. SARANKAN strategi penganggaran, tabungan, dan investasi
3. JAWAB pertanyaan umum tentang keuangan pribadi
4. DORONG kebiasaan keuangan yang sehat

PEDOMAN:
- Selalu bersikap suportif dan tidak menghakimi tentang kebiasaan pengeluaran
- Berikan saran yang actionable dan spesifik bila memungkinkan
- Gunakan format Rupiah (Rp) untuk referensi mata uang
- Pertimbangkan konteks keuangan Indonesia (bank lokal, opsi investasi seperti reksadana, saham IDX, emas, deposito)
- Jika ditanya tentang produk investasi spesifik, berikan informasi edukatif saja
- JANGAN pernah memberikan rekomendasi saham spesifik atau menjamin return investasi
- Ingatkan pengguna untuk berkonsultasi dengan penasihat keuangan berlisensi untuk keputusan besar

FORMAT RESPONS:
- Gunakan bahasa Indonesia yang natural dan mudah dipahami
- Gunakan emoji secukupnya untuk membuat percakapan lebih ramah 💰
- Format angka dengan pemisah ribuan (contoh: Rp 1.500.000)
- Gunakan bullet points atau numbered lists untuk informasi yang kompleks

BATASAN:
- Jangan memberikan advice tentang aktivitas ilegal atau penghindaran pajak
- Jangan menyimpan atau meminta informasi sensitif seperti PIN atau password
- Jika tidak yakin, sarankan untuk berkonsultasi dengan profesional

Tanggal saat ini: ${currentDate}`;
}

export function formatFinancialContext(data: FinancialSummary): string {
  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
  
  let context = `
═══════════════════════════════════════════════════════
SNAPSHOT KEUANGAN PENGGUNA (Data Real-time)
═══════════════════════════════════════════════════════

📊 RINGKASAN PENDAPATAN & PENGELUARAN (${data.overview.periodStart} - ${data.overview.periodEnd}):
• Total Pendapatan: ${formatCurrency(data.overview.totalIncome)}
• Total Pengeluaran: ${formatCurrency(data.overview.totalExpense)}
• Net Savings: ${formatCurrency(data.overview.netSavings)}
• Saving Rate: ${data.overview.totalIncome > 0 ? Math.round((data.overview.netSavings / data.overview.totalIncome) * 100) : 0}%
`;

  if (data.topCategories.length > 0) {
    context += `
📈 TOP KATEGORI PENGELUARAN:
${data.topCategories.map((c, i) => 
  `${i + 1}. ${c.category}: ${formatCurrency(c.total)} (${c.percentage}%) ${getTrendEmoji(c.trend)}`
).join('\n')}
`;
  }

  if (data.portfolio.totalValue > 0) {
    context += `
💼 RINGKASAN PORTOFOLIO:
• Total Nilai: ${formatCurrency(data.portfolio.totalValue)}
• Gain/Loss: ${data.portfolio.gainLoss >= 0 ? '+' : ''}${formatCurrency(data.portfolio.gainLoss)}
• Alokasi: ${Object.entries(data.portfolio.allocation)
  .map(([type, value]) => `${type}: ${formatCurrency(value)}`)
  .join(', ')}
`;
  }

  if (data.budgets.length > 0) {
    context += `
💵 BUDGET AKTIF:
${data.budgets.map(b => {
  const usagePercent = Math.round((b.spent / b.limit) * 100);
  const statusEmoji = usagePercent >= 90 ? '🔴' : usagePercent >= 70 ? '🟡' : '🟢';
  return `• ${b.category}: ${formatCurrency(b.spent)} / ${formatCurrency(b.limit)} (${usagePercent}%) ${statusEmoji}`;
}).join('\n')}
`;
  }

  if (data.goals.length > 0) {
    context += `
🎯 SAVING GOALS:
${data.goals.map(g => {
  const daysText = g.daysRemaining !== null ? `${g.daysRemaining} hari tersisa` : 'Tanpa deadline';
  return `• ${g.name}: ${g.progress}% tercapai (${daysText})`;
}).join('\n')}
`;
  }

  context += `
═══════════════════════════════════════════════════════
Gunakan data di atas untuk memberikan saran yang dipersonalisasi.
═══════════════════════════════════════════════════════
`;

  return context;
}

function getTrendEmoji(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    default: return '➡️';
  }
}
