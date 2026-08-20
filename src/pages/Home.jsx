// src/pages/Home.jsx

// Import React dan hooks
import React, { useState, useRef, useEffect } from "react";

// Import komponen halaman
import Dashboard from "../components/dashboard";
import Otoritaspengguna from "../Mainpage/admin/otoritaspengguna";
import Mastergroup from "../Mainpage/admin/mastergroup";
import MasterMenu from "../Mainpage/admin/mastermenu";
import MasterSatuanBarang from "../Mainpage/admin/mastersatuanbarang";
import MasterKategoriBarang from "../Mainpage/admin/masterkategoribarang";
import Inventory from "../Mainpage/admin/inventory";
import MasterBarang from "../Mainpage/admin/masterbarang";
import StockOpname from "../Mainpage/admin/stockopname";
import SalesTransaction from "../Mainpage/admin/salestransaction";
import Reports from "../Mainpage/admin/reports";
import Settings from "../components/settings";
import Pengaturanpengguna from "../Mainpage/admin/pengaturanpengguna";
import { getStoredUser } from "../utils/authStorage";
import API from "../utils/axiosInstance";

// Import ikon (sebelumnya di Header.jsx)
import { FaTachometerAlt, FaCog, FaUsers, FaBars, FaTimes, FaSignOutAlt, FaThLarge, FaBoxes, FaClipboardCheck, FaShoppingCart, FaFileAlt } from "react-icons/fa";
import { BiStore } from "react-icons/bi";

// Perhatikan: kita tambahkan prop 'user' di sini
const Home = ({ onLogout, user = {} }) => {
  const activeUser = user || getStoredUser() || {};
  const displayName = activeUser.nama || activeUser.name || activeUser.username || "User";
  const displayEmail = activeUser.email || activeUser.username || "-";
  // State halaman aktif (dari Home)
  const [activePage, setActivePage] = useState("dashboard"); // default halaman

  // State yang dipindahkan dari Header.jsx
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allowedPages, setAllowedPages] = useState(new Set(["dashboard"]));
  const dropdownRef = useRef(null);
// --- LOGIKA REVISI: DISABLE NAVIGASI ---
  // Daftar halaman yang akan mengunci navigasi menu utama
  const lockedPages = ["master", "data-barang-umum", "master-barang", "master-satuan-barang", "master-kategori-barang", "inventory", "transaksi-penjualan", "stock-opname", "reports", "otoritas", "master-group", "pengaturan-pengguna", "master-users"];
  const inventoryFlowPages = ["inventory", "master-barang", "data-barang-umum", "master-kategori-barang", "master-satuan-barang", "stock-opname"];
  const isLocked = lockedPages.includes(activePage);
  const allMenuItems = [
    { icon: <FaTachometerAlt />, label: "Dashboard", key: "dashboard" },
    { icon: <FaBoxes />, label: "Inventory", key: "inventory" },
    { icon: <FaShoppingCart />, label: "Transaksi", key: "transaksi-penjualan" },
    { icon: <FaFileAlt />, label: "Report", key: "reports" },
    // { icon: <FaUsers />, label: "Otoritas", key: "otoritas" },
    { icon: <FaCog />, label: "Settings", key: "settings" },
  ];
  const menuItems = allMenuItems.filter(
    (item) =>
      item.key === "dashboard" ||
      allowedPages.has(item.key) ||
      (item.key === "inventory" && inventoryFlowPages.some((key) => allowedPages.has(key)))
  );
  const inventoryTabs = [
    { icon: <FaBoxes />, label: "Stok", key: "inventory" },
    { icon: <FaThLarge />, label: "Master Barang", key: "master-barang" },
    { icon: <FaThLarge />, label: "Kategori", key: "master-kategori-barang" },
    { icon: <FaThLarge />, label: "Satuan", key: "master-satuan-barang" },
    { icon: <FaClipboardCheck />, label: "Stock Opname", key: "stock-opname" },
  ];
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeUser.grup_id) return;

    API.get("/hak_akses", { params: { grup_id: activeUser.grup_id } })
      .then((response) => {
        const paths = (response.data.data || []).map((entry) => entry.path).filter(Boolean);
        setAllowedPages(new Set(paths.length ? [...paths, "dashboard"] : ["dashboard"]));
      })
      .catch((error) => {
        console.error("Gagal memuat hak akses menu:", error);
        setAllowedPages(new Set(["dashboard"]));
      });
  }, [activeUser.grup_id]);

  const exitLockedPage = () => {
    setActivePage("dashboard");
    setMenuOpen(false);
  };

  // Render halaman berdasarkan state activePage (dari Home)
  const renderInventoryModule = (content) => (
    <div>
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {inventoryTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePage(tab.key)}
              className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                activePage === tab.key || (tab.key === "master-barang" && activePage === "data-barang-umum")
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {content}
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onSelectMenu={setActivePage} onLogout={onLogout} />;
      case "otoritas":
        return <Otoritaspengguna onClose={setActivePage} onLogout={onLogout} />;
      case "master":
        return <MasterMenu onClose={setActivePage} onSelectMenu={setActivePage} />;
      case "master-satuan-barang":
        return renderInventoryModule(<MasterSatuanBarang onClose={() => setActivePage("inventory")} />);
      case "master-kategori-barang":
        return renderInventoryModule(<MasterKategoriBarang onClose={() => setActivePage("inventory")} />);
      case "master-barang":
      case "data-barang-umum":
        return renderInventoryModule(<MasterBarang onClose={() => setActivePage("inventory")} />);
      case "inventory":
        return renderInventoryModule(<Inventory onSelectMenu={setActivePage} />);
      case "transaksi-penjualan":
        return <SalesTransaction onBack={setActivePage} />;
      case "stock-opname":
        return renderInventoryModule(<StockOpname />);
      case "reports":
        return <Reports />;
      case "master-group":
        return <Mastergroup onClose={setActivePage} onLogout={onLogout} />;
      case "pengaturan-pengguna":
        return <Pengaturanpengguna onLogout={onLogout} onClose={setActivePage} />;
      case "master-users":
        return (
          <Pengaturanpengguna
            onLogout={onLogout}
            onClose={setActivePage}
            mode="master"
            title="Master Users"
            eyebrow="User Master"
            description="Kelola master data pengguna sesuai endpoint backend: daftar, tambah, edit, dan nonaktifkan user."
          />
        );
      case "settings":
        return <Settings onSelectMenu={setActivePage} onLogout={onLogout} allowedPages={allowedPages} />;
      default:
        return <Dashboard onSelectMenu={setActivePage} onLogout={onLogout} />;
    }
  };

  return (
    <div
      className="relative min-h-screen bg-white bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/bike-tools-light-background.png')" }}
    >
      <div className="pointer-events-none fixed inset-0 bg-white/25" />
      <div className="pointer-events-none fixed -left-40 top-24 h-96 w-96 rounded-full bg-blue-200/25 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-cyan-100/35 blur-3xl" />

      {/* === SEMUA JSX DARI HEADER.JSX DIPINDAHKAN KE SINI === */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/70 bg-white/82 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2.5 sm:px-6">

          {/* 1. Logo (Sekarang ada di Home.jsx) */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <BiStore className="text-xl" />
            </span>
            <div>
              <span className="block text-base font-extrabold tracking-tight text-slate-900">BikeStore</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">ERP System</span>
            </div>
          </div>

          {/* Desktop Menu */}
         <nav className="hidden items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/70 p-1 md:flex">
            {menuItems.map((item, idx) => {
              // Item didisable jika page locked DAN item tersebut bukan page yang sedang aktif
              const isInventoryFlow = inventoryFlowPages.includes(activePage) && inventoryFlowPages.includes(item.key);
              const isActive = activePage === item.key || (item.key === "inventory" && inventoryFlowPages.includes(activePage));
              const isDisabled = isLocked && activePage !== item.key && !isInventoryFlow;

              return (
                <button
                  key={idx}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                    isDisabled
                      ? "opacity-40 cursor-not-allowed text-gray-400"
                      : isActive
                        ? "bg-white text-blue-700 font-semibold shadow-sm ring-1 ring-slate-200/70"
                        : "text-slate-500 hover:bg-white/70 hover:text-blue-600"
                  }`}
                  onClick={() => !isDisabled && setActivePage(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 2. User Info & Dropdown (Sekarang ada di Home.jsx) */}
          <div className="relative flex items-center space-x-2" ref={dropdownRef}>
            {isLocked && (
              <button
                type="button"
                onClick={exitLockedPage}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                title="Keluar dan aktifkan menu header"
                aria-label="Keluar dan aktifkan menu header"
              >
                <FaTimes />
              </button>
            )}

            <button
              className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-2.5 py-1.5 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FaUsers /></span>
              <div className="hidden md:block text-left">
                <p className="font-semibold text-sm text-gray-800">{displayName}</p>
                <p className="text-xs text-gray-500">{displayEmail}</p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200/80 bg-white/95 py-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                  onClick={() => { setActivePage("pengaturan-pengguna"); setDropdownOpen(false); }}
                >
                  Profile
                </button>
                <hr className="my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  onClick={onLogout} // Menggunakan prop 'onLogout'
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden text-gray-600 text-xl"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden bg-white border-t shadow-md">
            <ul className="flex flex-col p-4 space-y-2">
              {menuItems.map((item, idx) => (
                <li key={idx}>
                  {(() => {
                    const isInventoryFlow = inventoryFlowPages.includes(activePage) && inventoryFlowPages.includes(item.key);
                    const isActive = activePage === item.key || (item.key === "inventory" && inventoryFlowPages.includes(activePage));
                    const isDisabled = isLocked && activePage !== item.key && !isInventoryFlow;

                    return (
                  <button
                    disabled={isDisabled}
                    className={`flex items-center space-x-2 p-2 rounded-md w-full ${isActive
                      ? "bg-blue-100 text-blue-600 font-semibold"
                      : isDisabled
                        ? "opacity-40 cursor-not-allowed text-gray-400"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    onClick={() => {
                      if (isDisabled) return;
                      setActivePage(item.key);
                      setMenuOpen(false);
                    }} // Menggunakan 'setActivePage'
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                    );
                  })()}
                </li>
              ))}
              {isLocked && (
                <li>
                  <button
                    onClick={exitLockedPage}
                    className="flex w-full items-center space-x-2 rounded-md p-2 text-red-600 hover:bg-red-50"
                  >
                    <FaTimes />
                    <span>Exit / Buka Header</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={onLogout} // Menggunakan prop 'onLogout'
                  className="flex items-center space-x-2 p-2 rounded-md text-red-600 hover:bg-red-50 w-full"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>
      {/* === AKHIR DARI JSX HEADER === */}

      {/* Render halaman aktif */}
      <div className="relative mx-auto mt-16 max-w-[1600px] p-3 sm:p-5">{renderPage()}</div>
    </div>
  );
};

export default Home;
