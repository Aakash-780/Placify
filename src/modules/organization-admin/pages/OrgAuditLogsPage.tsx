import React, { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Search, RefreshCw, Loader2, Download } from 'lucide-react';

export default function OrgAuditLogsPage() {
  const { roleData } = useRole();
  const currentOrgId = roleData?.organization_id;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadLogs() {
    if (!currentOrgId) return;
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [currentOrgId]);

  function handleExportLogs() {
    const headers = ['Performer', 'Action', 'Target Node', 'Timestamp', 'Device Profile'];
    const rows = logs.map(log => [
      log.performed_by,
      log.action,
      log.affected_user || '',
      new Date(log.created_at).toLocaleString(),
      log.device_info ? log.device_info.replace(/,/g, ' ') : ''
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredLogs = logs.filter(log => {
    return log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.performed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.affected_user && log.affected_user.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6 p-6 animate-fade-in text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <span>Organization Activity Ledger</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit logging trace generated for actions performed inside your organization tenant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Filter audit logs by action or performer..."
          className="pl-9 h-11"
        />
      </div>

      <Card className="border border-border/60 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Performer</th>
                <th className="p-4">Affected Entity</th>
                <th className="p-4">Device Info</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-muted-foreground text-[10px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 font-semibold text-foreground font-sans">{log.action}</td>
                  <td className="p-4 text-primary font-sans font-semibold">{log.performed_by}</td>
                  <td className="p-4 text-muted-foreground text-[11px]">{log.affected_user || 'N/A'}</td>
                  <td className="p-4 text-muted-foreground font-sans text-[9px] truncate max-w-xs" title={log.device_info}>
                    {log.device_info}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground font-sans">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'No audit entries recorded.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
