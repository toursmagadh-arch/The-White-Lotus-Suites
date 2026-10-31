import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  FileJson,
  Server,
  Database
} from 'lucide-react';
import { useHotel } from '../context/HotelContext';

export const SettingsView: React.FC = () => {
  const {
    hotelSettings,
    updateHotelSettings,
    resetToDefaultData,
    exportDatabaseJSON,
    importDatabaseJSON,
    auditLogs
  } = useHotel();

  // Local form state
  const [name, setName] = useState(hotelSettings.name);
  const [tagline, setTagline] = useState(hotelSettings.tagline);
  const [email, setEmail] = useState(hotelSettings.email);
  const [phone, setPhone] = useState(hotelSettings.phone);
  const [address, setAddress] = useState(hotelSettings.address);
  const [city, setCity] = useState(hotelSettings.city);
  const [state, setState] = useState(hotelSettings.state);
  const [country, setCountry] = useState(hotelSettings.country);
  const [pinCode, setPinCode] = useState(hotelSettings.pinCode);
  const [gstin, setGstin] = useState(hotelSettings.gstin);
  const [currencySymbol, setCurrencySymbol] = useState(hotelSettings.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(hotelSettings.currencyCode);
  const [taxRate, setTaxRate] = useState(hotelSettings.taxRate.toString());
  const [serviceChargeRate, setServiceChargeRate] = useState(hotelSettings.serviceChargeRate.toString());
  const [checkInTime, setCheckInTime] = useState(hotelSettings.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState(hotelSettings.checkOutTime);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateHotelSettings({
      name,
      tagline,
      email,
      phone,
      address,
      city,
      state,
      country,
      pinCode,
      gstin,
      currencySymbol,
      currencyCode,
      taxRate: parseFloat(taxRate) || 18.0,
      serviceChargeRate: parseFloat(serviceChargeRate) || 5.0,
      checkInTime,
      checkOutTime
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3500);
  };

  const handleDownloadBackup = () => {
    const dataStr = exportDatabaseJSON();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `Grand_Royale_PMS_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDatabaseJSON(content);
        if (res.success) {
          setImportStatusMsg('Backup restored successfully!');
        } else {
          setImportStatusMsg(`Restore failed: ${res.error}`);
        }
        setTimeout(() => setImportStatusMsg(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleResetFactoryData = () => {
    if (confirm('WARNING: Are you sure you want to restore factory default seed data? All custom bookings and entries will be replaced with luxury initial demo records.')) {
      resetToDefaultData();
      alert('System restored to default initial seed records.');
      location.reload();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Settings Form */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Property Identity, Legal & Tax Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Parameters configured here propagate directly to printable tax invoices, registration forms, and currency displays.
            </p>
          </div>

          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved Successfully</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
          {/* General Property Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">Hotel Legal Enterprise Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Hotel Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Official Reservations Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Concierge Telephone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">GSTIN Tax Registration ID</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-amber-400"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">Property Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">City & Postal PIN Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-2/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400"
                  required
                />
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-amber-400 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Taxes, Currency & Arrival Hours */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Service Charge (%)</label>
              <input
                type="number"
                step="0.1"
                value={serviceChargeRate}
                onChange={(e) => setServiceChargeRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Currency Symbol & Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold font-mono focus:border-amber-400"
                  required
                />
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-2/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Standard Check-In / Out</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-center font-mono focus:border-amber-400"
                  placeholder="14:00"
                  required
                />
                <input
                  type="text"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-center font-mono focus:border-amber-400"
                  placeholder="11:00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Save Hotel Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup, Disaster Recovery & Factory Reset */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <FileJson className="w-4 h-4 text-amber-400" />
          <span>Database Backup & Disaster Recovery</span>
        </h3>
        <p className="text-xs text-slate-400">
          Export full JSON state snapshots of all rooms, active folios, guests, inventory, and restaurant orders for offline retention or system migration.
        </p>

        {importStatusMsg && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 text-amber-200 rounded-lg text-xs font-medium">
            {importStatusMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Database JSON Backup</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restore from JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetFactoryData}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Restore Default Seed Data</span>
          </button>
        </div>
      </div>

      {/* PHP & MySQL Deployment Bundle Card */}
      <div className="bg-slate-900/90 border border-amber-500/20 p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Full PHP + MySQL (XAMPP / cPanel) Source Code</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Converted standalone PHP 8.x + MariaDB system located in <code className="text-amber-300 font-mono">/php-hotel-pms/</code> with all 14 modules.
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
            24 PHP & SQL Files Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>MySQL Database Schema & Data</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Contains all 17 tables (rooms, bookings, guests, folios, KOT orders, inventory, maintenance) in standard SQL format.
            </p>
            <div className="text-[11px] text-amber-400 font-mono">
              Database: hotel_pms | Admin: admin / Admin@123
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>XAMPP & Chrome Ready</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Simply place in <code className="text-slate-300 font-mono">htdocs/php-hotel-pms</code> and open in Chrome at <code className="text-amber-300 font-mono">http://localhost/php-hotel-pms/</code>.
            </p>
            <div className="text-[11px] text-slate-400">
              Check the <strong>PHP Code & Chrome Guide</strong> tab in the sidebar for the full tutorial and code viewer.
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Audit Trail Log Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>System Audit Trail & Security Logs ({auditLogs.length} Events)</span>
          </h3>
          <span className="text-xs text-slate-400">Tamper-evident operational logging</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-72 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Authorized Staff</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2 px-3 font-sans text-slate-200 font-medium whitespace-nowrap">{log.userName}</td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
