/**
 * @file    AdminQrReissuePage.jsx
 * @module  Admin
 * @desc    Search for a patient and reissue their QR code — the old
 *          code is instantly deactivated, a fresh one is assigned.
 */

import { useState } from 'react';
import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { SearchX } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const AdminQrReissuePage = () => {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reissuingId, setReissuingId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/patients/search?search=${encodeURIComponent(search)}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Search failed');
        return;
      }

      setPatients(data.data);
    } catch (err) {
      console.error('Search patients error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleReissue = async (patientId) => {
    if (!window.confirm('Reissue this patient\'s QR code? The old code will stop working immediately.')) return;

    setReissuingId(patientId);
    try {
      const res = await fetch(`${API_URL}/api/admin/patients/${patientId}/reissue-qr`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Reissue failed');
        return;
      }

      // Update the patient's qr_code_id in the current list
      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, qr_code_id: data.data.qr_code_id } : p))
      );
      alert('QR code reissued successfully.');
    } catch (err) {
      console.error('Reissue QR error:', err);
      alert('Could not connect to the server.');
    } finally {
      setReissuingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">QR Code Deactivation & Reissue</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Search for a patient to reissue a lost or compromised QR code. The old code fails instantly.
        </p>
      </div>

      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end w-full">
          <Input
            label="Patient Search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or NIC..."
            className="flex-1 w-full"
          />
          <Button 
            type="submit" 
            variant="brand" 
            className="w-full sm:w-auto"
            disabled={loading}
          >
            Search
          </Button>
        </form>
      </Card>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && hasSearched && patients.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
          <SearchX className="w-10 h-10 text-muted-foreground mb-4 opacity-50" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-foreground">No patients found.</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Please check the spelling or NIC number and try again.
          </p>
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className="space-y-4">
          {patients.map((patient) => {
            const isReissuing = reissuingId === patient.id;
            return (
              <Card key={patient.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{patient.full_name}</h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      <span className="text-foreground">NIC:</span> {patient.nic}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground font-mono bg-secondary self-start px-2 py-1 rounded">
                      ID: {patient.qr_code_id}
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  onClick={() => handleReissue(patient.id)}
                  disabled={isReissuing}
                  loading={isReissuing}
                  className="w-full sm:w-auto"
                >
                  {isReissuing ? 'Reissuing...' : 'Reissue QR Code'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminQrReissuePage;