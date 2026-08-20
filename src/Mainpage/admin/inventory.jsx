import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Barcode,
  History,
  Loader2,
  PackagePlus,
  Save,
  Search,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import API from "../../utils/axiosInstance";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const formatMoney = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const transactionInitial = { item_id: "", nama: "", tipe: "MASUK", qty: "", harga: "", catatan: "" };

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const barcodeSvg = (value, height = 58) => {
  const text = String(value || "");
  let checksum = 104;
  const codes = [104];

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index) - 32;
    if (code < 0 || code > 95) continue;
    codes.push(code);
    checksum += code * index + code;
  }

  codes.push(checksum % 103, 106);
  let x = 10;
  const bars = [];

  codes.forEach((code) => {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) return;
    [...pattern].forEach((width, index) => {
      const barWidth = Number(width) * 2;
      if (index % 2 === 0) {
        bars.push(`<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#111827" />`);
      }
      x += barWidth;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x + 10}" height="${height}" viewBox="0 0 ${x + 10} ${height}">${bars.join("")}</svg>`;
};

const uniqueLocators = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const locator = String(item.locator || "").trim();
    if (!locator || map.has(locator.toLowerCase())) return;
    map.set(locator.toLowerCase(), locator);
  });
  return [...map.values()];
};

const stockStatus = (itemOrStock) => {
  const value = Number(typeof itemOrStock === "object" ? itemOrStock.stok : itemOrStock || 0);
  const minimum = Number(typeof itemOrStock === "object" ? itemOrStock.minimum_stock ?? 5 : 5);
  if (value <= 0) return { label: "Kosong", className: "bg-red-50 text-red-700 border-red-200", rowClass: "bg-red-50/40 hover:bg-red-50" };
  if (value <= minimum) return { label: "Mau Habis", className: "bg-amber-50 text-amber-700 border-amber-200", rowClass: "bg-amber-50/40 hover:bg-amber-50" };
  return { label: "Aman", className: "bg-emerald-50 text-emerald-700 border-emerald-200", rowClass: "hover:bg-blue-50/40" };
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [transactionModal, setTransactionModal] = useState(null);
  const [transactionForm, setTransactionForm] = useState(transactionInitial);
  const [historyModal, setHistoryModal] = useState(null);
  const [historyData, setHistoryData] = useState({ transactions: [], prices: [] });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/inventory/items", { params: { search: searchTerm, limit: 120 } });
      setItems(response.data.data || []);
    } catch (err) {
      console.error("Gagal memuat inventory:", err);
      Swal.fire("Error", "Gagal memuat data inventory.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 150);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        stok: acc.stok + Number(item.stok || 0),
        nilai: acc.nilai + Number(item.stok || 0) * Number(item.harga_modal || 0),
        stokRendah: acc.stokRendah + (stockStatus(item).label === "Mau Habis" ? 1 : 0),
        stokKosong: acc.stokKosong + (Number(item.stok || 0) <= 0 ? 1 : 0),
      }),
      { stok: 0, nilai: 0, stokRendah: 0, stokKosong: 0 }
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const status = stockStatus(item).label;
      if (stockFilter === "low") return status === "Mau Habis";
      if (stockFilter === "empty") return status === "Kosong";
      if (stockFilter === "safe") return status === "Aman";
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "stock_asc") return Number(a.stok || 0) - Number(b.stok || 0);
      if (sortBy === "stock_desc") return Number(b.stok || 0) - Number(a.stok || 0);
      if (sortBy === "value_desc") return Number(b.stok || 0) * Number(b.harga_modal || 0) - Number(a.stok || 0) * Number(a.harga_modal || 0);
      if (sortBy === "name") return String(a.nama || "").localeCompare(String(b.nama || ""), "id");
      if (sortBy === "locator") return String(a.locator || "").localeCompare(String(b.locator || ""), "id");
      return 0;
    });
  }, [items, sortBy, stockFilter]);

  const openTransaction = (item, tipe) => {
    setTransactionForm({
      item_id: item?.item_id || "",
      nama: item?.nama || "",
      tipe,
      qty: "",
      harga: tipe === "MASUK" ? item?.harga_modal || "" : "",
      catatan: "",
    });
    setTransactionModal(tipe);
  };

  const openHistory = async (item) => {
    setHistoryModal(item);
    setHistoryData({ transactions: [], prices: [] });
    try {
      const response = await API.get("/inventory/history", { params: { item_id: item.item_id } });
      setHistoryData({
        transactions: response.data.transactions || [],
        prices: response.data.prices || [],
      });
    } catch (err) {
      console.error("Gagal memuat history:", err);
      Swal.fire("Error", "Gagal memuat history inventory.", "error");
    }
  };

  const printBarcode = (targetItems) => {
    const list = Array.isArray(targetItems) ? targetItems : [targetItems];
    const labels = list
      .map((item) => `
        <section class="label">
          <div class="name">${item.nama}</div>
          <div class="barcode">${barcodeSvg(item.item_id)}</div>
          <div class="sku">${item.item_id}</div>
          <div class="meta">${item.satuan || "-"} | Jual ${formatMoney(item.harga)}</div>
        </section>
      `)
      .join("");
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode SKU</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, sans-serif; margin: 0; color: #111827; }
            .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .label { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; text-align: center; break-inside: avoid; min-height: 118px; }
            .name { font-size: 12px; font-weight: 700; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .barcode svg { max-width: 100%; height: 54px; }
            .sku { font-family: Consolas, monospace; font-size: 13px; font-weight: 700; letter-spacing: 1px; margin-top: 6px; }
            .meta { font-size: 10px; color: #6b7280; margin-top: 3px; }
          </style>
        </head>
        <body><main class="sheet">${labels}</main></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const printLocatorBarcode = (target) => {
    const locators = Array.isArray(target)
      ? uniqueLocators(target)
      : [String(target?.locator || target || "").trim()].filter(Boolean);

    if (!locators.length) {
      Swal.fire("Peringatan", "Locator belum diisi.", "warning");
      return;
    }

    const labels = locators
      .map((locator) => {
        const relatedItems = items.filter((item) => String(item.locator || "").trim().toLowerCase() === locator.toLowerCase());
        return `
          <section class="label">
            <div class="title">LOCATOR</div>
            <div class="name">${locator}</div>
            <div class="barcode">${barcodeSvg(`LOC:${locator}`)}</div>
            <div class="sku">LOC:${locator}</div>
            <div class="meta">${relatedItems.length} barang</div>
          </section>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode Locator</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, sans-serif; margin: 0; color: #111827; }
            .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .label { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; text-align: center; break-inside: avoid; min-height: 126px; }
            .title { font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 1px; margin-bottom: 4px; }
            .name { font-size: 14px; font-weight: 800; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .barcode svg { max-width: 100%; height: 54px; }
            .sku { font-family: Consolas, monospace; font-size: 13px; font-weight: 700; letter-spacing: 1px; margin-top: 6px; }
            .meta { font-size: 10px; color: #6b7280; margin-top: 3px; }
          </style>
        </head>
        <body><main class="sheet">${labels}</main></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const submitTransaction = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        item_id: transactionForm.item_id,
        tipe: transactionForm.tipe,
        qty: transactionForm.qty,
        harga: transactionForm.tipe === "MASUK" ? transactionForm.harga : null,
        catatan: transactionForm.catatan,
      };
      const response = await API.post("/inventory/transactions", payload);

      if (response.data.status === 1) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.data.message, timer: 1600, showConfirmButton: false });
        setTransactionModal(null);
        fetchItems();
      } else {
        Swal.fire("Peringatan", response.data.message || "Gagal menyimpan transaksi.", "warning");
      }
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
      Swal.fire("Error", err.response?.data?.message || "Gagal menghubungi server.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] rounded-2xl border border-white/80 bg-white/82 px-4 py-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
              <PackagePlus size={16} />
              Inventory Control
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Inventory</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Kelola stok barang, barang masuk, barang keluar, update harga, dan log history.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button onClick={() => printBarcode(items)} disabled={!items.length} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
              <Barcode size={17} />
              Print Semua SKU
            </button>
            <button onClick={() => printLocatorBarcode(items)} disabled={!uniqueLocators(items).length} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
              <Barcode size={17} />
              Print Locator
            </button>
            <button onClick={() => openTransaction(null, "MASUK")} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto">
              <ArrowDownToLine size={17} />
              Barang Masuk
            </button>
          </div>
        </div>

        {(totals.stokRendah > 0 || totals.stokKosong > 0) && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-bold text-amber-950">Perhatian stok</p>
            <p className="mt-1">
              Ada {formatNumber(totals.stokRendah)} barang mau habis dan {formatNumber(totals.stokKosong)} barang kosong. Baris terkait diberi warna kuning/merah.
            </p>
          </div>
        )}

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Item</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{items.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Stok</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(totals.stok)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Estimasi Modal Stok</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{formatMoney(totals.nilai)}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Mau Habis</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{formatNumber(totals.stokRendah)}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Kosong</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{formatNumber(totals.stokKosong)}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Daftar Inventory</h2>
                <p className="mt-1 text-sm text-slate-500">Tampil {visibleItems.length} dari {items.length} barang aktif.</p>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[180px_180px_320px]">
                <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="all">Semua Status</option>
                  <option value="low">Mau Habis</option>
                  <option value="empty">Kosong</option>
                  <option value="safe">Aman</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="created">Terbaru</option>
                  <option value="stock_asc">Stok Terendah</option>
                  <option value="stock_desc">Stok Tertinggi</option>
                  <option value="value_desc">Modal Terbesar</option>
                  <option value="name">Nama A-Z</option>
                  <option value="locator">Locator A-Z</option>
                </select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari barang, scan SKU atau locator..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100">
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Barang</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Kategori</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Satuan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Locator</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Stok</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Harga Modal</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Harga Jual</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-16 text-center">
                      <Loader2 className="mx-auto mb-3 animate-spin text-blue-600" size={26} />
                      <p className="text-sm font-semibold text-slate-700">Memuat inventory</p>
                    </td>
                  </tr>
                ) : visibleItems.length > 0 ? (
                  visibleItems.map((item) => {
                    const status = stockStatus(item);
                    return (
                    <tr key={item.item_id} className={`transition ${status.rowClass}`}>
                      <td className="min-w-[240px] px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{item.nama}</p>
                          {status.label !== "Aman" && <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>}
                        </div>
                        <p className="mt-1 font-mono text-xs text-slate-500">{item.item_id}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.kategori || "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.satuan || "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{item.locator || "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <p className={`text-sm font-bold ${status.label === "Kosong" ? "text-red-700" : status.label === "Mau Habis" ? "text-amber-700" : "text-slate-950"}`}>{formatNumber(item.stok)}</p>
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-700">{formatMoney(item.harga_modal)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-700">{formatMoney(item.harga)}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openTransaction(item, "MASUK")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50" title="Barang masuk">
                            <ArrowDownToLine size={15} />
                          </button>
                          <button onClick={() => openHistory(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-100 text-violet-600 hover:bg-violet-50" title="History">
                            <History size={15} />
                          </button>
                          <button onClick={() => printBarcode(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" title="Print barcode SKU">
                            <Barcode size={15} />
                          </button>
                          <button onClick={() => printLocatorBarcode(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 text-indigo-600 hover:bg-indigo-50" title="Print barcode locator">
                            <Barcode size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-5 py-16 text-center text-sm text-slate-500">Tidak ada data sesuai filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {loading ? (
              <div className="px-5 py-12 text-center">
                <Loader2 className="mx-auto mb-3 animate-spin text-blue-600" size={26} />
                <p className="text-sm font-semibold text-slate-700">Memuat inventory</p>
              </div>
            ) : visibleItems.length > 0 ? (
              visibleItems.map((item) => {
                const status = stockStatus(item);
                return (
                <article key={item.item_id} className={`p-4 ${status.label === "Kosong" ? "bg-red-50/40" : status.label === "Mau Habis" ? "bg-amber-50/40" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold text-slate-950">{item.nama}</p>
                        {status.label !== "Aman" && <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>}
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-500">{item.item_id}</p>
                    </div>
                    <button onClick={() => printBarcode(item)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" title="Print barcode SKU">
                      <Barcode size={15} />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Info label="Kategori" value={item.kategori || "-"} />
                    <Info label="Satuan" value={item.satuan || "-"} />
                    <Info label="Locator" value={item.locator || "-"} />
                    <Info label="Stok" value={`${formatNumber(item.stok)} - ${status.label}`} strong />
                    <Info label="Harga Modal" value={formatMoney(item.harga_modal)} strong />
                    <Info label="Harga Jual" value={formatMoney(item.harga)} strong />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => openTransaction(item, "MASUK")} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700">
                      <ArrowDownToLine size={14} />
                      Masuk
                    </button>
                    <button onClick={() => openHistory(item)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-violet-100 text-xs font-bold text-violet-600 hover:bg-violet-50">
                      <History size={14} />
                      History
                    </button>
                    <button onClick={() => printLocatorBarcode(item)} className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-indigo-100 text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                      <Barcode size={14} />
                      Print Locator
                    </button>
                  </div>
                </article>
              );
              })
            ) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">Tidak ada data sesuai filter.</div>
            )}
          </div>
        </section>
      </section>

      {transactionModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <ModalHeader title={transactionModal === "MASUK" ? "Barang Masuk" : "Barang Keluar"} subtitle={transactionForm.nama} onClose={() => setTransactionModal(null)} />
            <form onSubmit={submitTransaction} className="space-y-4 p-6">
              <ItemLookup
                items={items}
                value={transactionForm.item_id}
                nama={transactionForm.nama}
                onChange={(value) => {
                  const selected = items.find((item) => item.item_id.toLowerCase() === value.trim().toLowerCase());
                  setTransactionForm((current) => ({
                    ...current,
                    item_id: value,
                    nama: selected?.nama || "",
                    harga: current.tipe === "MASUK" && selected ? selected.harga_modal || "" : current.harga,
                  }));
                }}
              />
              <Input label="Qty" type="number" value={transactionForm.qty} onChange={(value) => setTransactionForm((current) => ({ ...current, qty: value }))} required />
              {transactionForm.tipe === "MASUK" && <Input label="Harga Modal / Harga Beli" type="number" value={transactionForm.harga} onChange={(value) => setTransactionForm((current) => ({ ...current, harga: value }))} />}
              <Textarea label="Catatan" value={transactionForm.catatan} onChange={(value) => setTransactionForm((current) => ({ ...current, catatan: value }))} />
              <ModalActions saving={saving} onCancel={() => setTransactionModal(null)} />
            </form>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <ModalHeader title="Log History Inventory" subtitle={`${historyModal.item_id} - ${historyModal.nama}`} onClose={() => setHistoryModal(null)} />
            <div className="grid max-h-[72vh] grid-cols-1 gap-4 overflow-auto p-6 lg:grid-cols-2">
              <HistoryTable title="Barang Masuk / Keluar" rows={historyData.transactions} type="transactions" />
              <HistoryTable title="History Harga" rows={historyData.prices} type="prices" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
    <button type="button" onClick={onClose} className="text-gray-400 transition hover:text-red-500">
      <X size={20} />
    </button>
  </div>
);

const Input = ({ label, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div>
    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">{label}</label>
    <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

const Info = ({ label, value, strong = false }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-1 break-words text-sm ${strong ? "font-bold text-slate-950" : "font-medium text-slate-700"}`}>{value}</p>
  </div>
);

const ItemLookup = ({ items, value, nama, onChange }) => {
  const suggestions = value
    ? items
        .filter((item) => {
          const keyword = value.toLowerCase();
          return item.item_id.toLowerCase().includes(keyword) || item.nama.toLowerCase().includes(keyword);
        })
        .slice(0, 5)
    : [];

  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Kode Barang / SKU</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Scan atau ketik kode barang"
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      {nama ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{nama}</p>
      ) : value ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Barang belum ditemukan. Tambahkan dulu dari Master Barang.</p>
      ) : null}
      {suggestions.length > 0 && !nama && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {suggestions.map((item) => (
            <button
              key={item.item_id}
              type="button"
              onClick={() => onChange(item.item_id)}
              className="block w-full px-3 py-2 text-left text-xs transition hover:bg-blue-50"
            >
              <span className="font-bold text-slate-800">{item.item_id}</span>
              <span className="ml-2 text-slate-500">{item.nama}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Textarea = ({ label, value, onChange }) => (
  <div>
    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">{label}</label>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

const ModalActions = ({ saving, onCancel }) => (
  <div className="flex gap-2 pt-4">
    <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50">
      Batal
    </button>
    <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      Simpan
    </button>
  </div>
);

const HistoryTable = ({ title, rows, type }) => (
  <section className="rounded-lg border border-slate-200">
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
    </div>
    <div className="max-h-80 overflow-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <tbody className="divide-y divide-slate-100">
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={type === "prices" ? row.history_id : row.transaksi_id}>
                <td className="px-4 py-3">
                  {type === "prices" ? (
                    <>
                      <p className="font-semibold text-slate-900">{formatMoney(row.harga_lama)} -> {formatMoney(row.harga_baru)}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.catatan || "-"}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-900">{row.tipe} qty {formatNumber(row.qty)}</p>
                      <p className="mt-1 text-xs text-slate-500">Stok {formatNumber(row.stok_sebelum)} -> {formatNumber(row.stok_sesudah)}</p>
                    </>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-slate-500">{row.created_at}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-8 text-center text-slate-400">Belum ada history.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default Inventory;
