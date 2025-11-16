const DashboardStats = ({ users }) => {
  const totalRevenue = calculateTotalRevenue(users);
  const activePlans = countActivePlans(users);
  const recentPayments = getRecentPayments(users);

  return (
    <div>
      <h2>Dashboard Stats</h2>
      {/* <p>Total Revenue: ₹{totalRevenue}</p> */}
      <p>Active Plans: {activePlans}</p>
      <h3>Recent Payments:</h3>
      <ul>
        {recentPayments.map((pay, idx) => (
          <li key={idx}>
            {pay.userName} - {pay.planName} - ₹{pay.amount} - {pay.status} - {new Date(pay.startDate).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};
