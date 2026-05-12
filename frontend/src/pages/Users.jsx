import DataTable from '../components/DataTable.jsx';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';

function Users() {
  return (
    <>
      <PageHeader title="Users" description="Manage admin users and roles." />
      <PageContent>
        <DataTable columns={[{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }]} rows={[]} />
      </PageContent>
    </>
  );
}

export default Users;
