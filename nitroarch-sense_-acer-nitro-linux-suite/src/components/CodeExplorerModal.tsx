import React, { useState } from 'react';
import {
  FolderTree,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  Package,
  Terminal,
  FileText,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';
import { NITRO_PROJECT_FILES, ProjectFile } from '../data/nitroProjectFiles';

interface CodeExplorerProps {
  onClose?: () => void;
}

export const CodeExplorerModal: React.FC<CodeExplorerProps> = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(NITRO_PROJECT_FILES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredFiles = NITRO_PROJECT_FILES.filter((f) => {
    const matchesSearch =
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopyCode = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSingleFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      NITRO_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nitroarch-sense-v1.3.0.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating zip:', e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b0e14] text-slate-200">
      {/* Top Banner & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 p-4 bg-[#0e121b]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1793d1]/10 border border-[#1793d1]/30 text-[#1793d1]">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-base font-bold text-white tracking-wide">
              NITROARCH-SENSE: PRODUCTION CODEBASE REPOSITORY
            </h2>
            <p className="text-xs text-slate-400">
              100% Complete C++20 Root Daemon · Qt6/QML Wayland UI · CMake · Systemd · NVML Dynamic
            </p>
          </div>
        </div>

        {/* Global Download Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 rounded bg-gradient-to-r from-[#1793d1] to-sky-600 px-3.5 py-1.5 text-xs font-mono font-bold text-white shadow-md hover:from-sky-500 hover:to-sky-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isZipping ? 'Generating ZIP...' : 'Download Full Project (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: File Explorer Sidebar + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Sidebar (Files List) */}
        <div className="lg:col-span-4 border-r border-slate-800/80 p-3 bg-[#0a0d13] flex flex-col">
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search files (e.g. PID, RAPL, QML)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-800 bg-[#0d1017] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-[#1793d1] focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="mb-2 flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All (21)' },
              { id: 'daemon', label: 'Daemon' },
              { id: 'ui', label: 'Qt6/QML' },
              { id: 'build', label: 'CMake' },
              { id: 'systemd', label: 'Systemd' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded px-2 py-0.5 text-[11px] font-mono transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[520px]">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left rounded-md p-2 transition-all flex items-start gap-2.5 border ${
                    isSelected
                      ? 'bg-[#141b29] border-[#1793d1]/60 text-white shadow-sm'
                      : 'border-transparent bg-slate-900/40 text-slate-300 hover:bg-slate-900 hover:border-slate-800'
                  }`}
                >
                  <FileCode
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      file.language === 'qml'
                        ? 'text-[#ff9900]'
                        : file.category === 'daemon'
                        ? 'text-[#1793d1]'
                        : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold truncate">
                        {file.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {file.language}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
                      {file.descriptionAr}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Code Viewer */}
        <div className="lg:col-span-8 flex flex-col bg-[#07090e]">
          {/* Active File Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-2.5 bg-[#0a0d13]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white">
                {selectedFile.path}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                {selectedFile.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded bg-slate-800/90 hover:bg-slate-700 px-2.5 py-1 text-xs font-mono text-slate-200 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadSingleFile}
                className="flex items-center gap-1.5 rounded bg-slate-800/90 hover:bg-slate-700 px-2.5 py-1 text-xs font-mono text-slate-200 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save File</span>
              </button>
            </div>
          </div>

          {/* Description Callout */}
          <div className="border-b border-slate-800/60 bg-[#0d111a] px-4 py-2 text-xs">
            <p className="text-slate-300 font-medium">
              <strong className="text-white">الوصف: </strong>
              {selectedFile.descriptionAr}
            </p>
          </div>

          {/* Code Text Area */}
          <div className="flex-1 overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-300 max-h-[500px] overflow-y-auto">
            <pre className="whitespace-pre">{selectedFile.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
