import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';

function Matches() {
  return (
    <>
      <PageHeader title="Matches" description="Manage fixtures, results, and match metadata." />
      <DataTable columns={[{ key: 'name', label: 'Match' }, { key: 'status', label: 'Status' }]} rows={[]} />
    </>
  );
}

export default Matches;
