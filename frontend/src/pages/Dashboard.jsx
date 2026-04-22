import PageHeader from '../components/PageHeader.jsx';
import SummaryCard from '../components/SummaryCard.jsx';

function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of football content operations." />
      <div className="summary-grid">
        <SummaryCard label="Matches" value="0" />
        <SummaryCard label="Reports" value="0" />
        <SummaryCard label="Generation Jobs" value="0" />
      </div>
    </>
  );
}

export default Dashboard;
