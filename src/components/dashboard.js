import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  PackageCheck,
  ShoppingCart,
  UsersRound,
  WalletCards,
} from "lucide-react";
import API from "../utils/axiosInstance";

const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#64748b", "#ec4899"];
const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const formatMoney = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const emptyData = {
  inventory: { summary: {}, by_category: [], stock_status: [], low_stock: [], transaction_types: [] },
  sales: { summary: {}, by_day: [], recent_orders: [], payment_methods: [] },
  users: { summary: {}, by_group: [] },
  menu: {},
  master_counts: {},
};

const Dashboard = ({ onSelectMenu }) => {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await API.get("/dashboard/summary");
        if (!active) return;
        setData(response.data || emptyData);
        setError(null);
      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
        if (active) setError("Gagal memuat data dashboard dari server.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      active = false;
    };
  }, []);

  const report = useMemo(() => {
    const inventory = data.inventory || emptyData.inventory;
    const sales = data.sales || emptyData.sales;
    const users = data.users || emptyData.users;
    const inv = inventory.summary || {};
    const sale = sales.summary || {};
    const user = users.summary || {};
    const menu = data.menu || {};
    const master = data.master_counts || {};
    const estimasiModal = Number(inv.estimasi_modal || 0);
    const estimasiJual = Number(inv.estimasi_jual || 0);

    return {
      inventory,
      sales,
      users,
      menu,
      master,
      stats: [
        { label: "Penjualan Hari Ini", value: formatMoney(sale.sales_today), note: `${formatNumber(sale.orders_today)} transaksi hari ini`, icon: WalletCards, tone: "text-emerald-600 bg-emerald-50" },
        { label: "Total Order", value: formatNumber(sale.total_orders), note: `Akumulasi ${formatMoney(sale.total_sales)}`, icon: ShoppingCart, tone: "text-blue-600 bg-blue-50" },
        { label: "Total Stok", value: formatNumber(inv.total_stok), note: `${formatNumber(inv.total_items)} barang aktif`, icon: Boxes, tone: "text-amber-600 bg-amber-50" },
        { label: "User Aktif", value: formatNumber(user.active_users), note: `${formatNumber(user.total_users)} total user`, icon: UsersRound, tone: "text-violet-600 bg-violet-50" },
      ],
      stockValue: [
        { label: "Modal", value: estimasiModal },
        { label: "Nilai Jual", value: estimasiJual },
        { label: "Potensi Margin", value: estimasiJual - estimasiModal },
      ],
    };
  }, [data]);

  const handleOpen = (key) => {
    if (onSelectMenu) onSelectMenu(key);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] rounded-2xl border border-white/80 bg-white/72 px-4 py-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="relative mb-6 min-h-[210px] overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-r from-white via-blue-50/70 to-white p-6 shadow-sm sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Dashboard ERP</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Ringkasan Operasional BikeStore</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Semua angka diambil dari database inventory, transaksi, user, master, dan menu.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => handleOpen("transaksi-penjualan")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5">
                <ShoppingCart size={17} /> Transaksi Baru
              </button>
              <button onClick={() => handleOpen("inventory")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-white/90 px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Boxes size={17} /> Buka Inventory
              </button>
              <button onClick={() => handleOpen("reports")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <FileText size={17} /> Lihat Report
              </button>
            </div>
          </div>
          <img src="/dashboard-bike-3d.png" alt="Komponen sepeda 3D" className="pointer-events-none absolute -bottom-10 -right-12 hidden h-[280px] w-[430px] object-contain mix-blend-multiply lg:block" />
        </div>

        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {report.stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.05 }} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-3 text-2xl font-bold text-slate-950">{loading ? "..." : item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.tone}`}>
                    <Icon size={21} />
                  </div>
                </div>
                <p className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-500">
                  <ArrowUpRight size={14} />
                  {item.note}
                </p>
              </motion.div>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-6 flex h-72 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm">
            <Loader2 className="mr-2 animate-spin text-blue-600" size={20} />
            Memuat dashboard live...
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <ChartPanel title="Grafik Stok Per Kategori" subtitle="Bar biru = estimasi modal, bar hijau = qty stok." action={() => handleOpen("inventory")}>
                <BarChart rows={report.inventory.by_category} valueKey="estimasi_modal" secondaryKey="total_stok" valueFormatter={formatMoney} secondaryFormatter={formatNumber} />
              </ChartPanel>

              <ChartPanel title="Pie Status Stok" subtitle="Pembagian barang aman, rendah, dan kosong.">
                <PieChart rows={report.inventory.stock_status} />
              </ChartPanel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <ChartPanel title="Tren Penjualan 7 Hari" subtitle="Total transaksi penjualan per hari.">
                <LineChart rows={report.sales.by_day} />
              </ChartPanel>

              <ChartPanel title="Metode Pembayaran" subtitle="Pie chart nilai transaksi per metode.">
                <PieChart rows={report.sales.payment_methods} />
              </ChartPanel>

              <ChartPanel title="Modal Estimasi" subtitle="Nilai modal, nilai jual, dan margin stok.">
                <ValueStack rows={report.stockValue} />
              </ChartPanel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
              <ChartPanel title="Pergerakan Stok 30 Hari" subtitle="Jumlah transaksi inventory berdasarkan tipe.">
                <BarChart rows={report.inventory.transaction_types} valueKey="count" secondaryKey="qty" valueFormatter={formatNumber} secondaryFormatter={formatNumber} />
              </ChartPanel>

              <ChartPanel title="User Per Grup" subtitle="Distribusi user berdasarkan master grup.">
                <PieChart rows={report.users.by_group} />
              </ChartPanel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <RecentOrders rows={report.sales.recent_orders} />
              <LowStock rows={report.inventory.low_stock} onOpen={() => handleOpen("stock-opname")} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
              <SystemData menu={report.menu} master={report.master} />
              <Attention total={report.inventory.summary?.stok_rendah} onOpen={() => handleOpen("inventory")} />
            </div>
          </>
        )}
      </section>
    </main>
  );
};

const ChartPanel = ({ title, subtitle, children, action }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action && (
        <button onClick={action} className="shrink-0 rounded-lg border border-blue-100 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
          Buka
        </button>
      )}
    </div>
    {children}
  </section>
);

const BarChart = ({ rows = [], valueKey, secondaryKey, valueFormatter, secondaryFormatter }) => {
  const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row[valueKey] || 0))), 1);
  const maxSecondary = Math.max(...rows.map((row) => Math.abs(Number(row[secondaryKey] || 0))), 1);

  if (!rows.length) return <EmptyChart />;

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{row.label}</p>
              {row.item_count !== undefined && <p className="text-xs text-slate-500">{formatNumber(row.item_count)} item</p>}
            </div>
            <p className="whitespace-nowrap font-bold text-slate-950">{valueFormatter(Number(row[valueKey] || 0))}</p>
          </div>
          <div className="grid grid-cols-[1fr_76px] items-center gap-3">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(4, (Math.abs(Number(row[valueKey] || 0)) / maxValue) * 100)}%` }} />
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100" title={secondaryFormatter(Number(row[secondaryKey] || 0))}>
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, (Math.abs(Number(row[secondaryKey] || 0)) / maxSecondary) * 100)}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PieChart = ({ rows = [] }) => {
  const total = rows.reduce((sum, row) => sum + Number(row.value || row.count || 0), 0);
  let current = 0;
  const gradient = rows.length && total > 0
    ? rows.map((row, index) => {
        const value = Number(row.value || row.count || 0);
        const start = current;
        current += (value / total) * 100;
        return `${colors[index % colors.length]} ${start}% ${current}%`;
      }).join(", ")
    : "#e2e8f0 0% 100%";

  if (!rows.length || total <= 0) return <EmptyChart />;

  return (
    <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[180px_1fr]">
      <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-center text-sm font-bold text-slate-900">
          {formatNumber(total)}
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => {
          const value = Number(row.value || row.count || 0);
          return (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="truncate font-medium text-slate-700">{row.label || "-"}</span>
              </div>
              <span className="font-bold text-slate-950">{formatNumber(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LineChart = ({ rows = [] }) => {
  const max = Math.max(...rows.map((row) => Number(row.total || 0)), 1);
  if (!rows.length) return <EmptyChart />;

  return (
    <div className="flex h-64 items-end gap-3">
      {rows.map((row) => {
        const height = Math.max(4, (Number(row.total || 0) / max) * 100);
        return (
          <div key={row.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-lg bg-slate-50 px-1">
              <div className="w-full rounded-t-lg bg-blue-600" style={{ height: `${height}%` }} title={formatMoney(row.total)} />
            </div>
            <p className="text-center text-[11px] font-semibold text-slate-500">{row.label}</p>
          </div>
        );
      })}
    </div>
  );
};

const ValueStack = ({ rows }) => (
  <div className="space-y-4">
    {rows.map((row, index) => (
      <div key={row.label} className="rounded-lg p-4" style={{ backgroundColor: `${colors[index % colors.length]}12` }}>
        <p className="text-sm font-medium" style={{ color: colors[index % colors.length] }}>{row.label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{formatMoney(row.value)}</p>
      </div>
    ))}
  </div>
);

const RecentOrders = ({ rows }) => (
  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Order Terbaru</h2>
        <p className="mt-1 text-sm text-slate-500">Data dari tabel sales_orders.</p>
      </div>
      <FileText className="text-slate-400" size={23} />
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Order</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Item</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Metode</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.length ? rows.map((order) => (
            <tr key={order.sales_id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-4"><p className="text-sm font-semibold text-slate-900">{order.sales_id}</p><p className="text-xs text-slate-500">{order.created_at}</p>{order.status === "BATAL" && <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">BATAL</span>}</td>
              <td className="max-w-[320px] truncate px-5 py-4 text-sm text-slate-600">{order.items}</td>
              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{order.metode_pembayaran}</td>
              <td className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${order.status === "BATAL" ? "text-slate-400 line-through" : "text-slate-950"}`}>{formatMoney(order.total)}</td>
            </tr>
          )) : (
            <tr><td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">Belum ada transaksi.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const LowStock = ({ rows, onOpen }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Stok Rendah</h2>
        <p className="mt-1 text-sm text-slate-500">Prioritas restock atau stock opname.</p>
      </div>
      <PackageCheck className="text-amber-600" size={24} />
    </div>
    <div className="space-y-3">
      {rows.length ? rows.map((item) => (
        <button key={item.item_id} onClick={onOpen} className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-left hover:bg-amber-50">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{item.nama}</p>
            <p className="mt-1 text-sm text-slate-500">{item.item_id} | {item.kategori}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(item.stok || 0) <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{formatNumber(item.stok)} tersisa</span>
        </button>
      )) : <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Tidak ada item stok rendah.</div>}
    </div>
  </section>
);

const SystemData = ({ menu, master }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Data Sistem</h2>
        <p className="mt-1 text-sm text-slate-500">Jumlah master dan menu dari database.</p>
      </div>
      <CheckCircle2 className="text-emerald-600" size={24} />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MiniStat label="Menu Aktif" value={menu.active_menus} icon={ClipboardList} />
      <MiniStat label="Kategori" value={master.kategori_barang} icon={Boxes} />
      <MiniStat label="Satuan" value={master.satuan_barang} icon={PackageCheck} />
      <MiniStat label="Grup" value={master.grup} icon={UsersRound} />
      <MiniStat label="Departemen" value={master.departemen} icon={ClipboardList} />
      <MiniStat label="Jabatan" value={master.jabatan} icon={ClipboardList} />
      <MiniStat label="Total Menu" value={menu.total_menus} icon={ClipboardList} />
      <MiniStat label="Menu Nonaktif" value={menu.inactive_menus} icon={AlertTriangle} />
    </div>
  </section>
);

const MiniStat = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-slate-200 p-4">
    <Icon className="mb-3 text-blue-600" size={18} />
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-xl font-bold text-slate-950">{formatNumber(value)}</p>
  </div>
);

const Attention = ({ total, onOpen }) => (
  <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={22} />
        <div>
          <h2 className="font-bold text-amber-950">Perlu Perhatian</h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Ada {formatNumber(total)} item stok rendah atau kosong yang perlu dicek dari Inventory.
          </p>
        </div>
      </div>
      <button onClick={onOpen} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100">Cek</button>
    </div>
  </section>
);

const EmptyChart = () => (
  <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
    Belum ada data.
  </div>
);

export default Dashboard;
