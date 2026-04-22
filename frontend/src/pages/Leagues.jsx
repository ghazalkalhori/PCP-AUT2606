import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';

function Leagues() {
  return (
    <>
      <PageHeader title="Leagues" description="Organize leagues, seasons, and competition data." />
      <DataTable columns={[{ key: 'name', label: 'League' }, { key: 'country', label: 'Country' }]} rows={[]} />
    </>
  );
}

export default Leagues;
