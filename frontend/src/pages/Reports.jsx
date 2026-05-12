import DataTable from '../components/DataTable.jsx';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';

function Reports() {
  return (
    <>
      <PageHeader title="Reports" description="Review generated football reports." />
      <PageContent>
        <DataTable columns={[{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }]} rows={[]} />
      </PageContent>
    </>
  );
}

export default Reports;
