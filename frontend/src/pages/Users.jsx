import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';

function Users() {
  return (
    <>
      <PageHeader title="Users" description="Manage admin users and roles." />
      <DataTable columns={[{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }]} rows={[]} />
    </>
  );
}

export default Users;
