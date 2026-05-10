/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  MapPin, 
  Save, 
  LogOut, 
  Loader2, 
  Database,
  CheckCircle2,
  AlertCircle 
} from "lucide-react";
import { Enumerator, BuildingRecord } from "./types";
import { SheetService } from "./services/sheetService";

export default function App() {
  const [usernameInput, setUsernameInput] = useState("");
  const [currentUser, setCurrentUser] = useState<Enumerator | null>(null);
  const [records, setRecords] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-login from local storage if needed
  useEffect(() => {
    try {
      const saved = localStorage.getItem("current_session_user");
      if (saved && saved !== "undefined") {
        const user = JSON.parse(saved);
        if (user && user.username) {
          setCurrentUser(user);
          loadData(user);
        }
      }
    } catch (err) {
      console.error("Failed to restore session", err);
      localStorage.removeItem("current_session_user");
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const user = await SheetService.getEnumeratorByUsername(usernameInput);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("current_session_user", JSON.stringify(user));
        await loadData(user);
      } else {
        setError("Username not found in List sheet.");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (user: Enumerator) => {
    setLoading(true);
    try {
      const data = await SheetService.getRecordsForEnumerator(user);
      setRecords(data);
    } catch (err) {
      setError("Failed to load data from Data sheet.");
    } finally {
      setLoading(false);
    }
  };

  const validateRecords = () => {
    if (records.length < 10) {
      setError("System error: Record list is incomplete.");
      return false;
    }

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      
      // All fields are mandatory for all 10 records
      if (!r.seId?.trim() || !r.ownerName?.trim() || !r.mobileNumber?.trim()) {
        setError(`Card ${i + 1}: All fields are mandatory. Please fill data for all 10 buildings.`);
        return false;
      }
      
      // Indian Mobile Number Validation (10 digits, starts with 6-9)
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(r.mobileNumber.trim())) {
        setError(`Card ${i + 1}: Please enter a valid 10-digit Indian mobile number.`);
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(false);

    if (!validateRecords()) {
      return;
    }

    setSaving(true);
    try {
      await SheetService.saveRecords(currentUser, records);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save data. Please check your connection or Apps Script setup.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRecords([]);
    setUsernameInput("");
    localStorage.removeItem("current_session_user");
  };

  const updateRecord = (index: number, field: keyof BuildingRecord, value: string) => {
    const newRecords = [...records];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setRecords(newRecords);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-100 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden"
        >
          <div className="p-8 pb-4 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-100 shadow-sm">
              <User size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 leading-tight">Enumerator Login</h1>
            <p className="text-zinc-500 text-sm mt-1">Please enter your username to access the records</p>
          </div>

          <div className="p-8 pt-4">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                  Username / उपयोगकर्ता नाम
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                    <User size={18} />
                  </div>
                  <input
                    id="username"
                    autoFocus
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. ev_1007001_rksaini"
                    className="block w-full pl-11 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-zinc-900 font-medium placeholder:text-zinc-300 shadow-inner"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-4 text-xs font-semibold bg-red-50 text-red-600 rounded-xl border border-red-100"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !usernameInput.trim()}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Access Data Sheet</span>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center text-[10px] text-zinc-400 font-mono tracking-tighter uppercase">
              Connected to: {SheetService.name} Engine
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <User size={16} className="text-zinc-400" />
              <span className="text-xs font-mono uppercase text-zinc-500">Enumerator</span>
              <span className="text-sm font-bold">{currentUser.name}</span>
            </div>
            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-zinc-400" />
              <span className="text-xs font-mono uppercase text-zinc-500">Allocated HLB</span>
              <span className="text-sm font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                {currentUser.hlb}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm shadow-blue-500/20"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? "Submitting..." : "Submit"}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Data Entry Sheet</h2>
              <p className="text-zinc-500 text-sm italic font-serif">Updating records for {currentUser.name}</p>
            </div>
            
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium"
                >
                  <CheckCircle2 size={18} />
                  Successfully updated in Data sheet
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 text-sm bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-zinc-300" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Record Entry</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">
                      SE ID / पहचान संख्या
                    </label>
                    <input 
                      type="text" 
                      value={record.seId} 
                      onChange={(e) => updateRecord(idx, "seId", e.target.value)}
                      placeholder="SE-001"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">
                      Owner Name / भवन स्वामी
                    </label>
                    <input 
                      type="text" 
                      value={record.ownerName} 
                      onChange={(e) => updateRecord(idx, "ownerName", e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">
                      Mobile / मोबाइल नम्बर
                    </label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={record.mobileNumber} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          updateRecord(idx, "mobileNumber", val);
                        }}
                        placeholder="9876543210"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-sm tracking-widest"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
