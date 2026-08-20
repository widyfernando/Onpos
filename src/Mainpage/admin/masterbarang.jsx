import React, { useCallback, useEffect, useState } from "react";
import { Edit, Loader2, Package, Plus, Save, Search, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import API from "../../utils/axiosInstance";

const emptyForm = { item_id: "", nama: "", satuan_id: "", kategori_id: "", locator: "", harga_modal: "", harga: "", minimum_stock: "5" };
const money = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const MasterBarang = ({ onClose }) => {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/inventory/items", { params: { search: searchTerm, limit: 120 } });
      setItems(response.data.data || []);
    } catch (err) {
      console.error("Gagal memuat master barang:", err);
      Swal.fire("Error", "Gagal memuat master barang.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 150);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    Promise.all([API.get("/satuan_barang"), API.get("/kategori_barang")])
      .then(([unitResponse, categoryResponse]) => {
        setUnits(unitResponse.data.data || []);
        setCategories(categoryResponse.data.data || []);
      })
      .catch((err) => console.error("Gagal memuat referensi barang:", err));
  }, []);

  const openAdd = () => {
    setFormData(emptyForm);
    setModalMode("add");
  };

  const openEdit = (item) => {
    setFormData({
      item_id: item.item_id,
      nama: item.nama || "",
      satuan_id: item.satuan_id || "",
      kategori_id: item.kategori_id || "",
      locator: item.locator || "",
      harga_modal: item.harga_modal || "",
      harga: item.harga || "",
      minimum_stock: item.minimum_stock ?? "5",
    });
    setModalMode("edit");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nama: formData.nama,
        satuan_id: formData.satuan_id || null,
        kategori_id: formData.kategori_id || null,
        locator: formData.locator || "",
        harga_modal: formData.harga_modal || 0,
        harga: formData.harga || 0,
        minimum_stock: formData.minimum_stock || 0,
      };
      const response =
        modalMode === "edit"
          ? await API.put("/inventory/items", payload, { params: { item_id: formData.item_id } })
          : await API.post("/inventory/items", payload);

      if (response.data.status === 1) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.data.message, timer: 1600, showConfirmButton: false });
        setModalMode(null);
        fetchItems();
      } else {
        Swal.fire("Peringatan", response.data.message || "Gagal menyimpan barang.", "warning");
      }
    } catch (err) {
      console.error("Gagal menyimpan barang:", err);
      Swal.fire("Error", "Gagal menghubungi server.", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Hapus barang?",
      text: `${item.nama} akan dinonaktifkan dari master barang.`,
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await API.delete("/inventory/items", { params: { item_id: item.item_id } });
      if (response.data.status === 1) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.data.message, timer: 1500, showConfirmButton: false });
        fetchItems();
      } else {
        Swal.fire("Peringatan", response.data.message || "Gagal menghapus barang.", "warning");
      }
    } catch (err) {
      console.error("Gagal menghapus barang:", err);
      Swal.fire("Error", "Gagal menghubungi server.", "error");
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] rounded-2xl border border-white/80 bg-white/82 px-4 py-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Header title="Master Barang" desc="Kelola data barang, kategori, satuan, lokasi locator, harga modal, dan harga jual." onClose={() => onClose?.("master")} onAdd={openAdd} />

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Daftar Barang</h2>
              <p className="mt-1 text-sm text-slate-500">Total {items.length} barang aktif.</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari barang..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Barang</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kategori</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Satuan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Locator</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Harga Modal</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Harga Jual</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Min Stok</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan="8" className="px-5 py-16 text-center"><Loader2 className="mx-auto animate-spin text-blue-600" /></td></tr>
                ) : items.length ? items.map((item) => (
                  <tr key={item.item_id} className="hover:bg-blue-50/40">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-950">{item.nama}</p><p className="mt-1 font-mono text-xs text-slate-500">{item.item_id}</p></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.kategori || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.satuan || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.locator || "-"}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700">{money(item.harga_modal)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">{money(item.harga)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700">{Number(item.minimum_stock || 0).toLocaleString("id-ID")}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-50"><Edit size={15} /></button>
                        <button onClick={() => remove(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="px-5 py-16 text-center text-sm text-slate-500">Belum ada data barang.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {modalMode && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">{modalMode === "edit" ? "Edit Barang" : "Tambah Barang"}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4 p-6">
              <Field label="Nama Barang" value={formData.nama} onChange={(value) => setFormData((c) => ({ ...c, nama: value }))} required />
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Kategori</label>
                <select value={formData.kategori_id} onChange={(e) => setFormData((c) => ({ ...c, kategori_id: e.target.value }))} className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih</option>
                  {categories.map((category) => <option key={category.kategori_id} value={category.kategori_id}>{category.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">Satuan</label>
                <select value={formData.satuan_id} onChange={(e) => setFormData((c) => ({ ...c, satuan_id: e.target.value }))} className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih</option>
                  {units.map((unit) => <option key={unit.satuan_id} value={unit.satuan_id}>{unit.nama}</option>)}
                </select>
              </div>
              <Field label="Lokasi Locator" value={formData.locator} onChange={(value) => setFormData((c) => ({ ...c, locator: value }))} placeholder="Contoh: Gudang A / Rak 01 / Bin 03" />
              <Field label="Harga Modal" type="number" value={formData.harga_modal} onChange={(value) => setFormData((c) => ({ ...c, harga_modal: value }))} />
              <Field label="Harga Jual" type="number" value={formData.harga} onChange={(value) => setFormData((c) => ({ ...c, harga: value }))} />
              <Field label="Minimum Stok" type="number" value={formData.minimum_stock} onChange={(value) => setFormData((c) => ({ ...c, minimum_stock: value }))} />
              <Actions saving={saving} onCancel={() => setModalMode(null)} />
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

const Header = ({ title, desc, onClose, onAdd }) => (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600"><Package size={16} /> Master Data</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{desc}</p>
    </div>
    <div className="flex gap-2">
      <button onClick={onAdd} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={17} /> Tambah Barang</button>
      <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-red-50 hover:text-red-600"><X size={19} /></button>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div>
    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">{label}</label>
    <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

const Actions = ({ saving, onCancel }) => (
  <div className="flex gap-2 pt-4">
    <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">Batal</button>
    <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan</button>
  </div>
);

export default MasterBarang;
