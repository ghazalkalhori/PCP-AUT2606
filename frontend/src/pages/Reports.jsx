import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';

function Reports() {
  return (
    <>
      <PageHeader title="Reports" description="Review generated football reports." />
      <DataTable columns={[{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }]} rows={[]} />
    </>
  );
}

export default Reports;
