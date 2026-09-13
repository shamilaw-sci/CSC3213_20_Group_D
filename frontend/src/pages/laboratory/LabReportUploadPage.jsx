/**
 * @component LabReportUploadPage
 * @desc      Form for lab staff to upload findings for a completed test.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LabReportUploadPage = () => {
  const { requestId } = useParams();
  const navigate      = useNavigate();
  const [findings, setFindings]   = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!findings.trim()) {
      setError('Findings are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/api/laboratories/requests/${requestId}/report`, {
        findings,
        report_url: reportUrl || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Report Uploaded!</h2>
          <p className="text-sm text-slate-500 mb-6">
            The report has been finalized and the doctor and patient have been notified.
          </p>
          <button
            onClick={() => navigate('/laboratory/queue')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-lg">

        <div className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
            style={{ backgroundColor: '#1E3A5F' }}>
            Laboratory Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Upload Lab Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter findings and optionally attach a report URL.
            This report will be marked as final and cannot be edited after upload.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Findings / Results *
            </label>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Enter detailed findings, test results, and any observations..."
              rows={6}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Report URL (optional)
            </label>
            <input
              type="url"
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              placeholder="https://example.com/report.pdf"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2"
            />
            <p className="text-xs text-slate-400 mt-1">
              Link to a PDF report if available
            </p>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700 font-semibold">
              ⚠️ Once uploaded, this report is final and cannot be edited.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/laboratory/queue')}
              className="flex-1 py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#1E3A5F' }}
            >
              {loading ? 'Uploading...' : 'Upload Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabReportUploadPage;