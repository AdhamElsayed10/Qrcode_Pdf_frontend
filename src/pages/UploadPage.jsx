import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, X, CheckCircle2, Loader2,
  ExternalLink, Download, Copy, Check, AlertCircle, ArrowRight,
  Trash2, FileUp, Files
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

export default function UploadPage() {
  const navigate = useNavigate();

  // Multi-file state — array of File objects
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const dropInputRef = useRef(null);

  // Per-file upload status: { [filename]: 'pending' | 'uploading' | 'completed' | 'failed' }
  const [fileStatuses, setFileStatuses] = useState({});

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

// QR Settings state (fixed defaults - settings UI disabled)
  const [qrSettings] = useState({
    qrPosition: 'custom',
    qrSize: 50,
    customX: 48,
    customY: 620,
    applyTo: 'all',
  });

  const hasFiles = files.length > 0;

  // ── PDF validation ──
  const isValidPDF = (file) => file.type === 'application/pdf';

  // ── Add files (from drop or browse) ──
  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter(isValidPDF);
    const invalidCount = incoming.length - valid.length;
    if (invalidCount > 0) toast.error(`${invalidCount} file(s) skipped — only PDFs are accepted`);

    // Avoid duplicates by name+size
    setFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const newFiles = valid.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...newFiles];
    });
  }, []);

  // ── Remove a file ──
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Clear all files ──
  const clearAll = () => setFiles([]);

  // ── Browse handler ──
  const handleBrowse = (e) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  // ── Drop handler ──
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  // ── Upload: send all files as 'files' field ──
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one PDF file');
      return;
    }

    // Mark all files as 'uploading'
    const initialStatuses = {};
    files.forEach((f) => { initialStatuses[f.name] = 'uploading'; });
    setFileStatuses(initialStatuses);
    setResults(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    setLoading(true);
    setUploadProgress(0);

    try {
      const res = await api.post('/documents/upload', formData, {
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });

      // Map results back to file names
      const newStatuses = {};
      const docs = res.data.documents || [];
      docs.forEach((doc) => {
        newStatuses[doc.title + '.pdf'] = doc.processingStatus === 'COMPLETED' ? 'completed' : 'failed';
      });
      setFileStatuses(newStatuses);

      setResults(docs);
      toast.success(`${docs.length} document(s) uploaded successfully!`);
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      const status = err.response?.status;
      console.error(`[Upload] Error (${status}):`, serverMsg || err.message);
      toast.error(serverMsg || `Upload failed (${status || 'network error'})`);

      // Mark all as failed
      const failedStatuses = {};
      files.forEach((f) => { failedStatuses[f.name] = 'failed'; });
      setFileStatuses(failedStatuses);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // ── Actions ──
  const handleViewDocument = (doc) => {
    window.open(doc.qrUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleCopyUrl = async (doc) => {
    try {
      await navigator.clipboard.writeText(doc.qrUrl);
      setCopiedId(doc.id);
      toast.success('QR URL copied!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'uploading': return <Loader2 size={14} className="animate-spin text-brand-400" />;
      case 'completed': return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'failed': return <AlertCircle size={14} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Upload PDFs</h1>
        <p className="text-slate-400 text-sm mt-1">
          Drop PDF files to auto-generate QR codes — upload one or multiple at once
        </p>
      </div>

      {/* ── Drop Zone ── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <FileUp size={16} className="text-brand-400" />
          Select PDF Files
        </h2>

        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => dropInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl py-12 px-6 transition-all duration-200 cursor-pointer text-center
            ${dragOver
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5'
            }
          `}
        >
          <input
            ref={dropInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleBrowse}
          />
          <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload size={22} className="text-slate-400" />
          </div>
          <p className="text-base font-medium text-slate-300">
            Drop PDF files here or click to browse
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Select one PDF or multiple PDFs — all will be processed independently
          </p>
        </div>
      </div>

      {/* ── File List ── */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">
              <Files size={14} className="inline mr-1.5 text-brand-400" />
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </p>
            <button
              onClick={clearAll}
              disabled={loading}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {files.map((file, idx) => {
              const status = fileStatuses[file.name];
              return (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center gap-3 p-2.5 bg-surface-800/40 rounded-lg group"
                >
                  <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate leading-tight">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                  </div>
                  {/* Status icon or remove button */}
                  {loading && status ? (
                    <div className="flex-shrink-0">{statusIcon(status)}</div>
                  ) : (
                    <button
                      onClick={() => removeFile(idx)}
                      disabled={loading}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={`Remove ${file.name}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Upload progress bar ── */}
      {loading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Uploading...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Upload button ── */}
      <button
        onClick={handleUpload}
        disabled={loading || !hasFiles}
        className="btn-primary text-base px-6 py-3 w-full sm:w-auto"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {loading
          ? 'Processing...'
          : 'Upload & Generate QR Codes'}
      </button>

      {/* ── Results ── */}
      {results && (
        <div className="card border-emerald-500/30 bg-emerald-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Upload Successful
            </h3>
            <button
              onClick={() => navigate('/dashboard/documents')}
              className="btn-secondary text-xs"
            >
              <ArrowRight size={12} />
              View All Documents
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.map((doc) => {
              const isCopied = copiedId === doc.id;
              const isFailed = doc.processingStatus === 'FAILED';
              return (
                <div key={doc.id} className={`p-3 bg-surface-800/50 rounded-lg ${isFailed ? 'border border-red-500/20' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200">{doc.title}</p>
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
                            <AlertCircle size={10} />
                            Failed
                          </span>
                        )}
                        {!isFailed && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} />
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-1 truncate">{doc.qrUrl}</p>
                    </div>
                  </div>
                  {!isFailed && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="btn-secondary text-xs py-1.5 px-3"
                        title="View PDF"
                      >
                        <ExternalLink size={12} />
                        View PDF
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="btn-secondary text-xs py-1.5 px-3"
                        title="Download PDF"
                      >
                        <Download size={12} />
                        Download
                      </button>
                      <button
                        onClick={() => handleCopyUrl(doc)}
                        className="btn-secondary text-xs py-1.5 px-3"
                        title="Copy QR URL"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {isCopied ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
