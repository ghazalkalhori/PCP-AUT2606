import DataTable from '../components/DataTable.jsx';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';

function GenerationJobs() {
  return (
    <>
      <PageHeader title="Generation Jobs" description="Track AI content generation requests." />
      <PageContent>
        <DataTable columns={[{ key: 'id', label: 'Job ID' }, { key: 'status', label: 'Status' }]} rows={[]} />
      </PageContent>
    </>
  );
}

export default GenerationJobs;
