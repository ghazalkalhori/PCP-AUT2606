import DataTable from '../components/DataTable.jsx';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';

function Leagues() {
  return (
    <>
      <PageHeader title="Leagues" description="Organize leagues, seasons, and competition data." />
      <PageContent>
        <DataTable columns={[{ key: 'name', label: 'League' }, { key: 'country', label: 'Country' }]} rows={[]} />
      </PageContent>
    </>
  );
}

export default Leagues;
